import express from 'express'
import * as dotenv from "dotenv"
import  verifyGoogleToken  from '../SocialAuth/googleAuth.js'
import mongoose from 'mongoose'
import { DB } from '../server.js'

import jwt from 'jsonwebtoken'
import { conn } from '../MongoDb/connect.js'
import { validatePassword, Errors } from '../utils.js'

import {Login, User} from '../MongoDb/models/index.js'
dotenv.config();
 

const router = express.Router()

router.route('/').post(async(req,res)=>{
    try {
        const session = await conn.startSession()

        const {fullName, email, password, picture} = req.body
        // validate form submission
        if(!fullName|| !email|| !password) {
            return res.status(400).json(`incorrect form submission`)
        } 
        else  if(validatePassword(password,fullName) == Errors.INVALID_PASSWORD){
            return res.status(400).json(Errors.INVALID_PASSWORD)
        } 
        else if(validatePassword(password, fullName) == Errors.PASSWORD_CONTAINS_NAME){
            return res.status(400).json(JSON.stringify(Errors.PASSWORD_CONTAINS_NAME))
    
        }
        if(/^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/.test(email) === false) {
            return res.status(400).json(Errors.INVALID_EMAIL)
        }    

        const hash = bcrypt.hashSync(password, 10)


        await session.withTransaction(async()=>{
            const loginUser = await Login.create([{
                email: email,
                password: hash
            }], {session})

            const user = await User.create([
                {
                    email: email,
                    fullName: fullName,
                    picture: picture,
                }
            ]);
            console.log(`success`)
            res.status(201).json({success:true,data:user});
            session.endSession()
        })
    
    } catch (error) {
        console.log(`error: `, error)
        res.status(500).json({success:false, message: error})
    }
})

export default router
