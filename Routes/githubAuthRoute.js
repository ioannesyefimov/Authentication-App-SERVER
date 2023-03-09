import express from 'express';
import  fetch from 'node-fetch';
import * as dotenv from 'dotenv';
import {Octokit} from 'octokit'
import { conn } from '../MongoDb/connect.js';
import User from '../MongoDb/models/user.js'
import Login from '../MongoDb/models/login.js'
import Token from '../MongoDb/models/token.js'
import { generateAccessToken,generateRefreshToken } from './tokenRoute.js';
import { Errors } from "../utils.js"

dotenv.config()
const router = express.Router()


router.route('/getAccessToken').get( async (req,res) =>{
    const params = `?client_id=${process.env.GITHUB_CLIENT_ID}&client_secret=${process.env.GITHUB_CLIENT_SECRET}&code=${req.query.code}&scope=user`

    await fetch("https://github.com/login/oauth/access_token" + params, {
        method: "POST",
        headers: {
            "Accept": "application/json"
        }
    }).then(response=>{
        return response.json()
    }).then(data => {
        console.log(data)
        res.json(data)
    })
})

router.route("/register").get( async(req,res)=>{
    try {
        const session = await conn.startSession()
        const accessTok = req.get('Authorization')  // Bearer ACCESSTOKEN
        const octokit = new Octokit({
         auth: accessTok
     })
    //  console.log(accessTok)
         const basicUser = await octokit.request('GET /user', {
             headers: {
                 'X-GitHub-Api-Version': '2022-11-28'
               }
         })
         const GHuser = await basicUser.data
         GHuser.loggedThrough = 'Github'
         console.log(GHuser)

         await session.withTransaction(async()=>{
            let user = {
                fullName: `${GHuser?.name} ${GHuser?.lastName}`,
                picture: GHuser?.avatar_url,
                email: GHuser?.email,
                loggedThrough: 'Github'

            }
            const GeneratedRefreshToken = generateRefreshToken(user)
            const GeneratedAccessToken = generateAccessToken(user)
            
            const isLoggedAlready = await Login.find({email: user?.email})
            if(isLoggedAlready.length !== 0){
                console.log(Errors);
                return res.status(400).send({success:false, message: Errors.SIGNED_UP_DIFFERENTLY, loggedThrough: isLoggedAlready[0]?.loggedThrough})
            }

            const loginUser = await Login.create([{
                email: user?.email,
                refreshToken: GeneratedRefreshToken,
                loggedThrough: 'Github'
            }])
          
            const dbUser = await User.create([
                user
            ]);
            console.log(`success`)

      
            res.status(201).send({success:true,data:{accessToken: GeneratedAccessToken, refreshToken: GeneratedRefreshToken}});
           await session.commitTransaction(); 
            session.endSession()
        })

    } catch (error) {
        console.log(error)
        res.status(500).send({success:false, message:error})       
    }
})



router.route("/signin").get( async(req,res)=>{
    try {
        const session = await conn.startSession()
        const accessTok = req.get('Authorization')  // Bearer ACCESSTOKEN
        const octokit = new Octokit({
         auth: accessTok
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
          
            const dbUser = await Login.find({ email : user?.email})

            if(dbUser.length < 1) {
                return res.status(404).send({success:false, message:`NOT_SIGNED_UP`})
            }
            console.log(`success`)
            const GeneratedAccessToken = generateAccessToken(user)

            if(dbUser[0]?.loggedThrough !== 'Github'){
                return res.status(400).send({success:false, message: `SIGNED_UP_DIFFERENTLY`, loggedThrough: dbUser[0]?.loggedThrough})
            }
             res.status(201).send({success:true,data:{user : user, token: {GeneratedAccessToken}}});
            await session.commitTransaction(); 
            session.endSession()
        })

    } catch (error) {
        console.log(error)
        res.status(500).send({success:false, message:error})       
    }
})
export default router