import express from 'express'
import * as dotenv from "dotenv"
import  verifyGoogleToken  from '../SocialAuth/googleAuth.js'
import { DB } from '../server.js'

import jwt from 'jsonwebtoken'

dotenv.config()

const router = express.Router()

router.route('/google').post(async(req,res)=>{
    
    try {
        if(req.body.credential) {
            const verificationResponse = await verifyGoogleToken(req.body.credential)
            console.log(verificationResponse)
            if(verificationResponse.error) {

                // return res.status(400).json({message: verificationResponse.error})
            };
            const profile = verificationResponse?.payload;
    
            DB.push(profile)
    
            res.status(201).json({
                message: "Register was successful",
                user: {
                    firstName: profile?.given_name,
                    lastName: profile?.family_name,
                    picture: profile?.picture,
                    email: profile?.email,
                    token: jwt.sign({email: profile?.email}, process.env.JWT_SECRET, {
                        expiresIn: "1d",
                    }),
                },
            
            });
        }
        
    } catch (error) {
        res.status(500).json({
            message: "An error occured. Registration failed"
        })
    }
})
export default router
