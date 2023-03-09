import express from 'express';
import  fetch from 'node-fetch';
import * as dotenv from 'dotenv';
import {Octokit} from 'octokit'
import { conn } from '../MongoDb/connect.js';
import User from '../MongoDb/models/user.js'
import Login from '../MongoDb/models/login.js'
import { generateAccessToken,generateRefreshToken } from './tokenRoute.js';
import jwt from 'jsonwebtoken'
import { Errors } from "../utils.js"

dotenv.config()
const router = express.Router()


export const handleGithubSingin = async(accessToken ,res)=>{
    try {
        
        jwt.verify(accessToken, process.env.JWT_TOKEN_SECRET, async (err,result) => {
            if(err) {
                console.log(err)
                return res.status(404).send({success:false, message:err})
            }
            const session = await conn.startSession()
            console.log(result)
            const user = {
                fullName: result?.fullName  ,
                email: result.email,
                picture: result?.picture || null,
                loggedThrough: result?.loggedThrough
            }
            const GeneratedRefreshToken = generateRefreshToken(user)
            const GeneratedAccessToken = generateAccessToken(user)
            
            const isLoggedAlready = await Login.find({email: user?.email})
            if(isLoggedAlready.length !== 0){
                console.log(Errors);
                return res.status(400).send({success:false, message: Errors.SIGNED_UP_DIFFERENTLY, loggedThrough: isLoggedAlready[0]?.loggedThrough})
            }

            await session.withTransaction(async()=>{

                const GeneratedAccessToken = generateAccessToken(user)
                
                const isLoggedAlready = await Login.find({email: email})

                
                if(isLoggedAlready.length !== 0 && user.loggedThrough !== 'Github' ){
                    return res.status(400).send({success:false, message: `LOGGED_DIFFERENTLY`, loggedThrough: isLoggedAlready[0]?.loggedThrough})
                }
          
                res.status(201).send({success:true,data:{loggedThrough:user.loggedThrough, user: user}});
               await session.commitTransaction(); 
                session.endSession()
            })
        
        })
        
    } catch (error) {
        console.log(error)
        res.status(500).send({success:false, message:error})       
    }
}

router.route('/register').post(async(req,res) =>{
    try {
        const session = await conn.startSession()
        const {accessToken} = req.body  // Bearer ACCESSTOKEN
        console.log(accessToken)
        const octokit = new Octokit({
         auth: accessToken
         })
    //  console.log(accessTok)
         const basicUser = await octokit.request('GET /user', {
             headers: {
                 'X-GitHub-Api-Version': '2022-11-28'
               }
         })
         const GHuser = await basicUser.data

         await session.withTransaction(async()=>{
            let user = {
                fullName: `${GHuser?.name} ${ GHuser?.lastName ? GHuser?.lastName : '' }`,
                picture: GHuser?.avatar_url,
                email: GHuser?.email,
                loggedThrough: 'Github'

            }
          
            const isRegistered = await Login.find({ email : user?.email});

            if(isRegistered.length > 0) {
                return res.status(404).send({success:false, message:`ALREADY_EXISTS`, loggedThrough: isRegistered[0].loggedThrough})
            }

            const dbLOGIN = await Login.create([{
                email:user.email,
                loggedThrough: user.loggedThrough,

            }]);

            const dbUser = await User.create([{
                email:user.email,
                fullName: `${GHuser?.name} ${ GHuser?.lastName ? GHuser?.lastName : '' }`,
                picture: GHuser?.avatar_url,
                email: GHuser?.email,
            }]);

            console.log(`success`)
            const GeneratedAccessToken = generateAccessToken(user)

            
            res.status(201).send({success:true,data:{user:user, accessToken: GeneratedAccessToken}});
            await session.commitTransaction(); 
            session.endSession()
        })

    } catch (error) {
        console.log(error)
        res.status(500).send({success:false, message:error})       
    }
    }
)



router.route('/getAccessToken').get( async (req,res) =>{
    const params = `?client_id=${process.env.GITHUB_CLIENT_ID}&client_secret=${process.env.GITHUB_CLIENT_SECRET}&code=${req.query.code}&scope=user`

    try {
        const ghAccessToken = await fetch("https://github.com/login/oauth/access_token" + params, {
        method: "POST",
        headers: {
            "Accept": "application/json"
        }})
    
        const ghResponse = await ghAccessToken.json()
        
        console.log(ghResponse)

        if(ghResponse?.access_token){
            return res.status(200).send({success:true,data: {accessToken: ghResponse.access_token}})
            
        }
        // if(!ghResponse.access_token){
        //     return res.status(400).send({success:false, message: ghResponse.error})
        // }
        
    } catch(error){
       console.log(error)
        return res.status(500).send({success:false,message:error})
    }

  
   
})

router.route('/getUserToken').get(async(req,res)=>{
    try {
        const session = await conn.startSession()
        const octokit = new Octokit({
         auth: req.get('Authorization')
         })
    //  console.log(accessTok)
         const basicUser = await octokit.request('GET /user', {
             headers: {
                 'X-GitHub-Api-Version': '2022-11-28'
               }
         })
         const GHuser = await basicUser.data

         await session.withTransaction(async()=>{
            let user = {
                fullName: `${GHuser?.name} ${ GHuser?.lastName ? GHuser?.lastName : '' }`,
                picture: GHuser?.avatar_url,
                email: GHuser?.email,
                loggedThrough: 'Github'
            }

            const isRegistered = await Login.find({email: user.email})

            if(isRegistered.length > 0){
                const GeneratedAccessToken = generateAccessToken(user)
                console.log(`success`)
                res.status(201).send({success:true,data:{accessToken: GeneratedAccessToken}});
                await session.commitTransaction(); 
                session.endSession()

            }
            else {
                return res.status(404).send({success:false,message:`NOT_FOUND`})
            }
            
        })

    } catch (error){
        return res.status(500).send({success:false,message:error ||`SOMETHING WENT WRONG`})
    }
}
)

export default router