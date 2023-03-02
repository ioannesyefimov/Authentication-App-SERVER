import express from 'express'
import * as dotenv from "dotenv"

import refreshToken from '../MongoDb/models/token.js'

export const generateAccessToken = (user) => {
    const accessToken = jwt.sign(user, process.env.JWT_TOKEN_SECRET, {
        expiresIn: '30m'
    })
    return accessToken
} 

export const generateRefreshToken = (user) =>{
    const refreshToken = jwt.sign(user, process.env.JWT_REFRESH_TOKEN_SECRET)
    return refreshToken
}

import jwt from 'jsonwebtoken'

const  router = express.Router()

router.route('/').post(async(req,res)=>{
    const refreshToken = req.body.refreshToken 

    if(refreshToken == null) return res.sendStatus(401)

     const isValidToken = await refreshToken.find({refreshToken: refreshToken});
    if(!isValidToken) {
        console.log(isValidToken)
    }
        console.log(isValidToken)
         jwt.verify(result[0], process.env.JWT_REFRESH_TOKEN_SECRET, (error, user) => {
            if(error){
                return res.status(403).send({success:false, message:err})
            } 
            const accessToken = generateAccessToken({fullName: user.fullName})
            console.log(accessToken)
            res.status(200).send({success:true, data: accessToken})
        })
})

dotenv.config();
 