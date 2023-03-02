import express from 'express';
import  fetch from 'node-fetch';
import * as dotenv from 'dotenv';
import {Octokit} from 'octokit'

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
    const user = await basicUser.data

    

    res.status(200).send({success: true, data: {
        user,
        refreshToken: generateRefreshToken(user),
    }})
})

export default router