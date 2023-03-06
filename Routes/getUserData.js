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
    const {accessToken} =req.body        
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
                    loggedThrough: result?.loggedThrough
                    
                }
                const isLogged = Login.find({email:user.email })

                if(isLogged.length < 1){
                    return res.status(404).send({success:false,message:`NOT_FOUND`})
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
