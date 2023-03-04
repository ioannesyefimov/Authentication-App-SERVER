import express from 'express'
import * as dotenv from "dotenv"
import bcrypt from 'bcrypt'


import User from '../MongoDb/models/user.js'
import Login from '../MongoDb/models/login.js'
import { generateAccessToken, generateRefreshToken } from './tokenRoute.js'


import jwt from 'jsonwebtoken'

dotenv.config();
 

const router = express.Router()

router.route('/').post(async(req,res)=>{
    try {
        const {email, password, accessToken} = req.body
        
        
        if(accessToken){
            return jwt.verify(accessToken, process.env.JWT_TOKEN_SECRET, (err,result) => {
                if(err) {
                    console.log(err)
                    return res.status(404).send({success:false, message:err})
                }
                console.log(result)
                const user = {
                    fullName: result?.fullName || `${result.firstName} ${result.lastName}` ,
                    email: result.email,
                    picture: result?.picture || null
                }
                console.log(user)
                return res.status(200).send({success:true, data: user})
            })
        }
        if(!email || !password) return res.status(400).send({success:false, message:`INCORRECT_FORM_SUBMISSION`})

        console.log(email)
        const USER = await User.find({email:email})
        if(USER == null || undefined || USER.length < 1) res.status(404).send({success:false, message: `NOT_FOUND`})
        if(USER){
            const isRegister =  await Login.find({email: email})
            console.log(USER)
           if(isRegister.length !== 0) {
            console.log(isRegister)

            let user = {fullName: USER[0].fullName, email: USER[0].email}
            const GeneratedToken = generateAccessToken(user);
            return res.status(200).send({success:true, data: {user, GeneratedToken}})
        } else {
            console.log(isRegister)
            return res.status(400).send({success:false, message: `LOGGED_THROUGH_SOCIAL`, social: USER[0]?.loggedThrough})
           }
        } else if(!isValid){
            return res.status(400).send({success:false, message: `WRONG_PASSWORD`})
        }


 
    } catch (error) {
        console.log(`error: `, error)
        return res.status(500).send({success: false, message: error})
    }
})

export default router
