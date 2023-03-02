import express from 'express'
import * as dotenv from "dotenv"
import bcrypt from 'bcrypt'


import User from '../MongoDb/models/user.js'
import Login from '../MongoDb/models/login.js'


import jwt from 'jsonwebtoken'

dotenv.config();
 

const router = express.Router()

router.route('/').post(async(req,res)=>{
    try {
        const {email, password, accessToken} = req.body

        if(accessToken){
            return jwt.verify(accessToken, process.env.JWT_TOKEN_SECRET, (err,result) => {
                if(err) {
                    console.log(err)
                    return res.status(404).send({success:false, message:err})
                }
                console.log(result)
                const user = {
                    fullName: result.fullName,
                    email: result.email,
                    picture: result?.picture
                }
                return res.status(200).send({success:true, data: user})
            })
        }

        console.log(email)
        const isRegister =  await Login.find({email: email})
        if(isRegister == null || undefined || isRegister.length < 1) res.status(404).send({success:false, message: `NOT_FOUND`})
        const isValid= bcrypt.compareSync(password, isRegister[0].password)
        console.log(isValid)
        if(isValid){
           const USER = await User.find({email:email})
           if(USER) {
            console.log(USER)
           return  res.status(200).send({success:true, user: USER[0]})
           }
        } else if(!isValid){
            return res.status(400).send({success:false, message: `WRONG_PASSWORD`})
        }


 
    } catch (error) {
        console.log(`error: `, error)
        return res.status(500).send({success: false, message: error})
    }
})

export default router
