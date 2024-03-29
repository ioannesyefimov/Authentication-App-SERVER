import express from 'express'
import * as dotenv from "dotenv"
import bcrypt from 'bcrypt'

import jwt from 'jsonwebtoken'
import { conn } from '../MongoDb/connect.js'
import {checkError, validatePassword, Errors } from '../utils.js'

import User from '../MongoDb/models/user.js'
import Login from '../MongoDb/models/login.js'
import { generateAccessToken, generateRefreshToken } from './tokenRoute.js'

dotenv.config();
 

const router = express.Router()

export const  serverValidatePw = ( fullName,email,password,res) =>{
    console.log(`server pw validation started`);
    if(!fullName|| !email|| !password) {
        return   res.status(400).send(Errors.MISSING_ARGUMENTS)
    } 
    if(validatePassword(password, fullName) === `valid`){
        console.log(`valid server checkr`);
        return {success:true,message:`valid`}
    }else 
       
     if(validatePassword(password,fullName) == Errors.INVALID_PASSWORD){
         console.log(Errors.INVALID_PASSWORD)
        return   {success:false,message:Errors.INVALID_PASSWORD}

    } 
    else if(validatePassword(password, fullName) == Errors.PASSWORD_CONTAINS_NAME){
        console.log(Errors.PASSWORD_CONTAINS_NAME)
        return   {success:false, message:Errors.PASSWORD_CONTAINS_NAME}

    }
    if(/^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/.test(email) === false) {
        console.log()
        return   {success:false,message:Errors.INVALID_EMAIL}
    }    
}

router.route('/').post(async(req,res)=>{
    try {
        const session = await conn.startSession()

        const {fullName, email, password, picture, loggedThrough} = req.body
        
        const isLoggedAlready = await Login.findOne({email: email})
        if(isLoggedAlready !== null){
            return isLoggedAlready?.loggedThrough !== 'Internal' ? 
             res.status(400).send({
                success:false, message: Errors.SIGNED_UP_DIFFERENTLY, 
                loggedThrough: isLoggedAlready?.loggedThrough
            }) :
            res.status(400).send({
                success:false, message: Errors.ALREADY_EXISTS,
                loggedThrough: isLoggedAlready?.loggedThrough
            })
        }
        let isValidPassword = await serverValidatePw(fullName, email,password,res);
        if(!isValidPassword?.success) return res.status(400).send({success:false,message:isValidPassword?.message})
        const hash = bcrypt.hashSync(password, 10)

       return await session.withTransaction(async()=>{
            let user = {
                email: email,
                fullName: fullName,
                picture: picture,
                loggedThrough:loggedThrough,
                bio: null,
                phone: null,
            }
            const refreshToken = generateRefreshToken(user);
            const accessToken = generateAccessToken(user);

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
                    bio: null,
                    phone: null,
                    
                }
            ], {session});
            
            
            console.log(`success`)
       

    
            res.status(201).send({success:true,data:{accessToken, refreshToken, loggedThrough: loggedThrough}});
           await session.commitTransaction(); 
            session.endSession()
        })
    
    } catch (error) {
        console.log(`trigger err`)
        return checkError(error,res)
    }
})

export default router
