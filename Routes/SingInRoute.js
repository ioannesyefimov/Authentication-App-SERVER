import express from 'express'
import * as dotenv from "dotenv"
import bcrypt from 'bcrypt'


import User from '../MongoDb/models/user.js'
import Login from '../MongoDb/models/login.js'
import { generateAccessToken, generateRefreshToken } from './tokenRoute.js'

import { handleGoogleSingin } from './googleAuth.js'
import { handleGithubSingin } from './githubAuthRoute.js'
import jwt from 'jsonwebtoken'
import { handleUserData } from './getUserData.js'

import { Errors } from '../utils.js'
dotenv.config();
 

const router = express.Router()

router.route('/').post(async(req,res)=>{
    try {
        const {email, password, accessToken, loggedThrough} = req.body

        if(accessToken && loggedThrough == 'Github'){
           return handleGithubSingin(accessToken, res)
        }
        if(accessToken && loggedThrough ){
            return handleUserData(accessToken,res)
        } 
        // }
        if(!email || !password) return res.status(400).send({success:false, message:`INCORRECT_FORM_SUBMISSION`})

        const USER_LOGIN = await Login.find({email: email})

        if(USER_LOGIN.length < 1){
            return res.status(404).send({success:false,message:Errors.NOT_FOUND})
        }

        if( USER_LOGIN[0]?.loggedThrough !== loggedThrough) {
            console.log('1')
            return res.status(400).send({success:false, message: Errors.SIGNED_UP_WITH , loggedThrough: USER_LOGIN[0]?.loggedThrough})
            
        }
        let USER = await User.find({email: email})

        if(USER.length > 0 && USER[0].loggedThrough === 'Internal') {
        console.log(USER)

            const isValid = bcrypt.compareSync(password, USER_LOGIN[0].password)
            if(!isValid){
                return res.status(400).send({success:false, message:Errors.WRONG_PASSWORD});
            } 
            let user = {fullName: USER[0].fullName, email: USER[0].email, picture: USER[0]?.picture}
            const GeneratedToken = generateAccessToken(user);
            return res.status(200).send({success:true, data: { accessToken: GeneratedToken, loggedThrough: USER[0].loggedThrough}})
     
        }
    } catch (error) {
        console.log(`error: `, error)
        return res.status(500).send({success: false, message: error})
    }
})

export default router
