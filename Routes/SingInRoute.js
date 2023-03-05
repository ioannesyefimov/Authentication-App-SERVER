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
        const {email, password, accessToken, loggedThrough} = req.body
        
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
                    picture: result?.picture || null,
                    
                }
                
                console.log(user)
                return res.status(200).send({
                    success:true,
                    data: {user, loggedThrough: result?.loggedThrough}
                })
            })
        }
        if(!email || !password) return res.status(400).send({success:false, message:`INCORRECT_FORM_SUBMISSION`})

        const USER_LOGIN = await Login.find({email: email})

        if(USER_LOGIN && USER_LOGIN[0]?.loggedThrough !== 'Internal') {
            console.log('1')
            return res.status(400).send({success:false, message: `LOGGED_THROUGH_SOCIAL`, social: USER_LOGIN[0]?.loggedThrough})
            
        }
        let USER = await User.find({email: email})

        if(USER && USER.length > 0) {
        console.log(USER)

            const isValid = bcrypt.compareSync(password, USER_LOGIN[0].password)
            if(!isValid){
                return res.status(400).send({success:false, message:'WRONG_PASSWORD'});
            } 
            let user = {fullName: USER[0].fullName, email: USER[0].email, picture: USER[0]?.picture}
            const GeneratedToken = generateAccessToken(user);
            return res.status(200).send({success:true, data: {user, accessToken: GeneratedToken, loggedThrough: 'Internal'}})
     
        }
    } catch (error) {
        console.log(`error: `, error)
        return res.status(500).send({success: false, message: error})
    }
})

export default router
