import express from 'express';
import  fetch from 'node-fetch';
import * as dotenv from 'dotenv';
import {Octokit} from 'octokit'
import { conn } from '../MongoDb/connect.js';
import User from '../MongoDb/models/user.js'
import Token from '../MongoDb/models/token.js'
import { generateAccessToken } from './tokenRoute.js';

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
          
            const dbUser = await User.create([
                user
            ]);
            console.log(`success`)
        const GeneratedRefreshToken = generateRefreshToken(user)

        await Token.create([
            {
                refreshToken: refreshToken
            }
        ]);
            res.status(201).send({success:true,data:{user: {user}, token: {GeneratedRefreshToken}}});
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
         console.log(GHuser)

         await session.withTransaction(async()=>{
            let LoggedUser = {
                fullName: `${GHuser?.name} ${ GHuser?.lastName ? GHuser?.lastName : '' }`,
                picture: GHuser?.avatar_url,
                email: GHuser?.email,
                loggedThrough: 'Github'

            }
            console.log(LoggedUser)
          
            const dbUser =  User.find({ email : LoggedUser?.email})

            if(!dbUser) {
                return res.status(404).send({success:false, message:`NOT_SIGNED_UP`})
            }
            console.log(`success`)
            const GeneratedAccessToken = generateAccessToken(LoggedUser)

        
            res.status(201).send({success:true,data:{user : {LoggedUser}, token: {GeneratedAccessToken}}});
           await session.commitTransaction(); 
            session.endSession()
        })

    } catch (error) {
        console.log(error)
        res.status(500).send({success:false, message:error})       
    }
})
export default router