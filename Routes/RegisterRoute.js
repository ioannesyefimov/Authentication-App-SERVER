import express from 'express'
import * as dotenv from "dotenv"
import bcrypt from 'bcrypt'

import jwt from 'jsonwebtoken'
import { conn } from '../MongoDb/connect.js'
import { validatePassword, Errors } from '../utils.js'

import User from '../MongoDb/models/user.js'
import Login from '../MongoDb/models/login.js'
import { generateAccessToken, generateRefreshToken } from './tokenRoute.js'

dotenv.config();
 

const router = express.Router()

router.route('/').post(async(req,res)=>{
    try {
        const session = await conn.startSession()

        const {fullName, email, password, picture, loggedThrough} = req.body
        const userCredentials = {
            fullName, email, picture
        }
        // validate form submission
        if(!fullName|| !email|| !password) {
            return res.status(400).send(`incorrect form submission`)
        } 
        else  if(validatePassword(password,fullName) == Errors.INVALID_PASSWORD){
            console.log()
            return res.status(400).send({success:false,message:Errors.INVALID_PASSWORD})
        } 
        else if(validatePassword(password, fullName) == Errors.PASSWORD_CONTAINS_NAME){
            console.log()
            return res.status(400).send({success:false, message:Errors.PASSWORD_CONTAINS_NAME})
    
        }
        if(/^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/.test(email) === false) {
            console.log()
            return res.status(400).send({success:false,message:Errors.INVALID_EMAIL})
        }    

        const hash = bcrypt.hashSync(password, 10)

        const isLoggedAlready = await Login.find({email: email})
        if(isLoggedAlready.length !== 0){
            return res.status(400).send({success:false, message: Errors.SIGNED_UP_DIFFERENTLY, loggedThrough: isLoggedAlready[0]?.loggedThrough})
        }


        await session.withTransaction(async()=>{
            let user = {
                email: email,
                fullName: fullName,
                picture: picture,
                loggedThrough:loggedThrough
            }
            const refreshToken = generateRefreshToken(user)
            const accessToken = generateAccessToken(user)

            const loginUser = await Login.create([{
                email: email,
                password: hash,
                loggedThrough: loggedThrough,
                refreshToken: refreshToken

            }], {session})
            const USER = await User.create([
                {
                    email: email,
                    fullName: fullName,
                    picture: picture || null,
                    loggedThrough: loggedThrough,
                    
                }
            ], {session});
            
            
            console.log(`success`)
       

    
            res.status(201).send({success:true,data:{accessToken, refreshToken, loggedThrough: loggedThrough}});
           await session.commitTransaction(); 
            session.endSession()
        })
    
    } catch (error) {
        console.log(`error: `, error)
        
        res.status(500).send({success:false, message: error})
    }
})

export default router
