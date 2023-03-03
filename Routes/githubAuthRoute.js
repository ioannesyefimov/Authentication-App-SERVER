import express from 'express';
import  fetch from 'node-fetch';
import * as dotenv from 'dotenv';
import {Octokit} from 'octokit'
import { conn } from '../MongoDb/connect.js';
import User from '../MongoDb/models/user.js'
import Token from '../MongoDb/models/token.js'
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

router.route("/getUserData").get( async(req,res)=>{
    try {
        const session = await conn.startSession()
        const accessTok = req.get('Authorization')  // Bearer ACCESSTOKEN
        const octokit = new Octokit({
         auth: accessTok
     })
     console.log(accessTok)
         const basicUser = await octokit.request('GET /user', {
             headers: {
                 'X-GitHub-Api-Version': '2022-11-28'
               }
         })
         const GHuser = await basicUser.data
         GHuser.loggedThrough = 'Github'

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
        const refreshToken = generateRefreshToken(user)

        await Token.create([
            {
                refreshToken: refreshToken
            }
        ]);
            res.status(201).send({success:true,data:{user, refreshToken}});
           await session.commitTransaction(); 
            session.endSession()
        })

    } catch (error) {
        console.log(error)
        res.status(500).send({success:false, message:error})       
    }
})

export default router