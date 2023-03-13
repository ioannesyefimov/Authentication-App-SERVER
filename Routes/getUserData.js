import express from 'express'
import * as dotenv from "dotenv"
import bcrypt from 'bcrypt'


import User from '../MongoDb/models/user.js'
import Login from '../MongoDb/models/login.js'


import jwt from 'jsonwebtoken'
import { Errors, verifyAccessToken } from '../utils.js'

dotenv.config();
 

const router = express.Router()

export const handleUserData = async(accessToken,res) => {
    try {
        if(accessToken){
            const  isValidToken = await verifyAccessToken(accessToken) 

            if(isValidToken?.err) return res.status(400).send({success:false,message:err})
                console.log(isValidToken)
                const USER = await User.find({email: isValidToken?.email})
                if(USER.length <1 )return res.status(404).send({success:false,message:`NOT_FOUND`})
                const user = {
                    fullName: USER[0]?.fullName  ,
                    email: USER[0].email,
                    picture: USER[0]?.picture || null,
                    bio: USER[0]?.bio || null,
                    phone: USER[0]?.phone || null,
                    loggedThrough: USER[0]?.loggedThrough
                }
                console.log(user)
                return res.status(200).send({
                    success:true,
                    data: {user, loggedThrough: USER[0]?.loggedThrough}
                })
        }
    }catch(err){
        console.log(err);
        return res.status(500).send({success:false, message:err})
    }
    }


router.route('/').post(async(req,res)=>{
    try {
    const {accessToken} =req.body        
        if(accessToken){
            return jwt.verify(accessToken, process.env.JWT_TOKEN_SECRET, (err,result) => {
                if(err) {
                    console.log(err)
                    return res.status(404).send({success:false, message:err})
                }
                console.log(result)
                const USER = User.find({email: result?.email})
                if(USER.length <1 )return res.status(404).send({success:false,message:`NOT_FOUND`})
                const user = {
                    fullName: USER[0]?.fullName  ,
                    email: USER[0].email,
                    picture: USER[0]?.picture || null,
                    bio: USER[0]?.bio || null,
                    phone: USER[0]?.phone || null,
                    loggedThrough: USER[0]?.loggedThrough
                }
                
                console.log(user)
                return res.status(200).send({
                    success:true,
                    data: {user, loggedThrough: result?.loggedThrough}
                })
            })
        }
    } catch (error) {
        console.log(`error: `, error)
        return res.status(500).send({success: false, message: error})
    }
})

export default router
