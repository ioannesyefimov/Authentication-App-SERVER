import express from 'express';
import  fetch from 'node-fetch';
import * as dotenv from 'dotenv';

dotenv.config()
const router = express.Router()

router.route('/getAccessToken').get( async (req,res) =>{
    const params = `?client_id=${process.env.GITHUB_CLIENT_ID}&client_secret=${process.env.GITHUB_CLIENT_SECRET}&code=${req.query.code}&scope=user,user:email`

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
    const basicUser = await fetch('https://api.github.com/user', {
        method: "GET",
        headers: {
            "Authorization": accessTok
        }
    })
    const response1 = await basicUser.json()
    const userEmail = await fetch('https://api.github.com/user/emails', {
            method:"GET",
            headers:{
                "Authorization": accessTok
            }
        })
    const response2 = await userEmail.json()
    console.log(response1)
    console.log(response2)
    res.status(200).send({success: true, data: {response1, response2}})
})

export default router