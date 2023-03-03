import express from 'express'
import * as dotenv from "dotenv"
import bcrypt from 'bcrypt'

import jwt from 'jsonwebtoken'
import { conn } from '../MongoDb/connect.js'
import { validatePassword, Errors } from '../utils.js'

import User from '../MongoDb/models/user.js'
import Login from '../MongoDb/models/login.js'
import Token from '../MongoDb/models/token.js'
import { generateAccessToken, generateRefreshToken } from './tokenRoute.js'

dotenv.config();
 

const router = express.Router()

router.route('/').post(async(req,res)=>{
    try {
        const session = await conn.startSession()

        const {fullName, email, password, picture} = req.body
        const userCredentials = {
            fullName, email, picture
        }
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
        const refreshToken = generateRefreshToken(userCredentials)
        const accessToken = generateAccessToken(userCredentials)

        await Token.create([
            {
                refreshToken: refreshToken
            }
        ]);
            res.status(201).send({success:true,data:{user, accessToken, refreshToken}});
           await session.commitTransaction(); 
            session.endSession()
        })
    
    } catch (error) {
        console.log(`error: `, error)
        res.status(500).send({success:false, message: error})
    }
})

export default router
