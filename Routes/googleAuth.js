import express from 'express'
import * as dotenv from "dotenv"
import  verifyGoogleToken  from '../SocialAuth/googleAuth.js'
import { Errors } from '../utils.js'

import jwt from 'jsonwebtoken'
import User from '../MongoDb/models/user.js'
// import Token from '../MongoDb/models/token.js'
import Login from '../MongoDb/models/login.js'
import { generateAccessToken, generateRefreshToken } from './tokenRoute.js'
import { conn } from '../MongoDb/connect.js'

dotenv.config()

const router = express.Router()

export const handleGoogleSingin = async(credentials, res) =>{
    try {
            // console.log(req.body.credential)
            const verificationResponse = await verifyGoogleToken(credentials)
            console.log(verificationResponse)
            if(verificationResponse.error) {
                return res.status(400).send({success:false,message: verificationResponse.error})
            };

            const profile =  verificationResponse?.payload;
            console.log(profile)
    
            const dbUser = await Login.find({email:profile?.email})
            // console.log(existsInDb)
    
            if(dbUser.length < 1){
                return res.status(400).json({
                    message: "You are not registered. Please sign up."
                });
            }
            let user = {

                fullName: `${profile?.given_name} ${profile?.family_name}`,
                picture: profile?.picture,
                email: profile?.email,
                bio: profile?.bio,
                phone: profile?.phone,
                loggedThrough: 'Google'
               
            }
            if(dbUser[0]?.loggedThrough !== 'Google'){
                return res.status(400).send({success:false, message: Errors.SIGNED_UP_DIFFERENTLY, loggedThrough: dbUser[0]?.loggedThrough})
            }
        

            res.status(201).send({
                success:true,
                 data:{
                    loggedThrough: 'Google',
                    user: user,
                    accessToken: generateAccessToken(user)
                }
            });
    } catch (error) {
        res.status(500).json({
            message: error?.message || error,
        })
    }
}

router.route('/signin').post(async(req,res)=>{
    
    try {
        if(req.body.credential) {
            // console.log(req.body.credential)
            const verificationResponse = await verifyGoogleToken(req.body.credential)
            console.log(verificationResponse)
            if(verificationResponse.error) {
                return res.status(400).json({message: verificationResponse.error})
            };

            const profile =  verificationResponse?.payload;
            console.log(profile)
    
            const dbUser = await Login.find({email:profile?.email})
            // console.log(existsInDb)
    
            if(!dbUser){
                return res.status(400).json({
                    message: "You are not registered. Please sign up."
                });
            }
            let user = {

                fullName: `${profile?.given_name} ${profile?.family_name}`,
                picture: profile?.picture,
                email: profile?.email,
                bio: profile?.bio,
                phone: profile?.phone,
                loggedThrough: 'Google'
               
            }
            if(dbUser[0]?.loggedThrough !== 'Google'){
                return res.status(400).send({success:false, message: Errors.SIGNED_UP_DIFFERENTLY, loggedThrough: dbUser[0]?.loggedThrough})
            }
        

            res.status(201).send({
                success:true,
                 data:{
                    loggedThrough: 'Google',
                    // user: user,
                    accessToken: generateAccessToken(user)
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
                    bio: profile?.bio,
                    phone: profile?.phone,
                    loggedThrough: 'Google'
                   
                }
                
                const isLoggedAlready = await Login.find({email: user?.email})
                if(isLoggedAlready.length !== 0){
                    return res.status(400).send({
                        success:false, message: Errors.ALREADY_EXISTS,
                        loggedThrough: isLoggedAlready[0]?.loggedThrough
                        })
                }
                const GeneratedRefreshToken = generateRefreshToken(user)
                const GeneratedAccessToken = generateAccessToken(user)

                const loginUser = await Login.create([
                    {
                        email: user?.email,
                        refreshToken: GeneratedRefreshToken,
                        loggedThrough: 'Google'
                    }
                ])
              
                const dbUser = await User.create([
                    {
                        email: user?.email,
                        fullName: user?.fullName,
                        picture: user?.picture,
                        bio: user?.bio,
                        phone: user?.phone,
                        loggedThrough: 'Google'
                    }
                ]);
                console.log(`success`)

                if(loginUser && dbUser){
                    

                    res.status(201).send(
                        {success:true,data:
                            { 
                                accessToken:GeneratedAccessToken, 
                                refreshToken: GeneratedRefreshToken
                            }
                        });
                    await session.commitTransaction(); 
                    session.endSession()
                }
    
       
            })
           
        }
        
    } catch (error) {
        console.log(error)
        res.status(500).send({success:false, message:error})  
    }
})
export default router
