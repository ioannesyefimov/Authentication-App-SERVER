import express from 'express'
import * as dotenv from "dotenv"
import  verifyGoogleToken  from '../SocialAuth/googleAuth.js'

import jwt from 'jsonwebtoken'
import User from '../MongoDb/models/user.js'
import Token from '../MongoDb/models/token.js'
import { generateAccessToken, generateRefreshToken } from './tokenRoute.js'
import { conn } from '../MongoDb/connect.js'

dotenv.config()

const router = express.Router()

router.route('/signin').post(async(req,res)=>{
    
    try {
        if(req.body.credential) {
            // console.log(req.body.credential)
            const verificationResponse = await verifyGoogleToken(req.body.credential)
            console.log(verificationResponse)
            if(verificationResponse.error) {
                return res.status(400).json({message: verificationResponse.error})
            };

            const profile = await verificationResponse?.payload;
            // console.log(profile)
    
            const existsInDb = await User.find({email:profile.email})
            // console.log(existsInDb)
    
            if(!existsInDb){
                return res.status(400).json({
                    message: "You are not registered. Please sign up."
                });
            }
    
            res.status(201).send({
                success:true, data:{

                    loggedThrough: 'Google',
                    user: {
                        firstName: profile?.given_name,
                        lastName: profile?.family_name,
                        picture: profile?.picture,
                        email: profile?.email,
                        refreshToken: jwt.sign({email: profile?.email}, process.env.JWT_REFRESH_TOKEN_SECRET),
                        accessToken: jwt.sign({email: profile?.email}, process.env.JWT_TOKEN_SECRET, {
                            expiresIn: "1d",
                        }),
                    },
                }
            });
        }
    } catch (error) {
        res.status(500).json({
            message: error?.message || error,
        })
    }
})

router.route('/register').post(async(req,res)=>{
    
    try {
        if(req.body.credential) {
            const session = await conn.startSession()
            const verificationResponse = await verifyGoogleToken(req.body.credential)
            if(verificationResponse.error) {

                return res.status(400).json({message: verificationResponse.error})
            };
            const profile = verificationResponse?.payload;
            
    
            await session.withTransaction(async()=>{
                let user = {
                    fullName: `${profile?.given_name} ${profile?.family_name}`,
                    picture: profile?.picture,
                    email: profile?.email,
                        
                }
              
                const dbUser = await User.create([
                    {
                        email: user?.email,
                        fullName: user?.fullName,
                        picture: user?.picture,
                        loggedThrough: 'Google'
                    }
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
           
        }
        
    } catch (error) {
        console.log(error)
        res.status(500).json({
            message: "An error occured. Registration failed"
        })
    }
})
export default router
