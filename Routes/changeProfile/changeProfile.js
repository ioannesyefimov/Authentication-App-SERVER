import express from 'express'
import * as dotenv from "dotenv"
import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'

import { Errors } from '../../utils.js'
import {Login,User} from '../../MongoDb/models/index.js'
import { serverValidatePw } from '../RegisterRoute.js'
import { validatePassword, verifyAccessToken } from '../../utils.js'
import { conn } from '../../MongoDb/connect.js'

dotenv.config();


const router = express.Router()

router.route('/picture').post(async(req,res)=>{

    const {email, updatedParam, accessToken} = req.body
    const isLogged = await Login.find({email:email})
    if(isLogged.length < 1) {
        return res.status(404).send({success:false, message:Errors.NOT_FOUND})
    }

    const isValidToken = await verifyAccessToken(accessToken)

    if(isValidToken?.err) return res.status(400).send({success:false,message:isValidToken?.err})

    const USER = await User.updateOne({email:email}, {picture: updatedParam}, {upsert:true})
    console.log(USER)

    if(USER?.modifiedCount == 0){
        return res.status(400).send({success:false,message:`PICTURE IS THE SAME`})
    } else if (USER?.acknowledged && USER?.modifiedCount !== 0){
        return res.status(200).send({success:true,data:{message:`PICTURE HAS BEEN CHANGED TO ${updatedParam}`, url: updatedParam}})
    } else {
        return res.status(500).send({success:false,message:`something went wrong: ${USER}`})
    }
})

router.route('/name').post(async(req,res)=>{

    const {email, updatedParam,accessToken} = req.body
    const isLogged = await Login.find({email:email})
    if(isLogged.length < 1) {
        return res.status(404).send({success:false, message:Errors.NOT_FOUND})
    }
    
    const isValidToken = await verifyAccessToken(accessToken)

    if(isValidToken?.err) return res.status(400).send({success:false,message:isValidToken?.err})


    const USER = await User.updateOne({email:email}, {fullName: updatedParam}, {upsert:true})
    console.log(USER)

    if(USER?.modifiedCount == 0){
        return res.status(400).send({success:false,message:`Name IS THE SAME`})
    } else if(USER?.acknowledged && USER?.modifiedCount !== 0 ){
        return res.status(200).send({success:true,data:{message:`NAME HAS BEEN CHANGED TO ${updatedParam}`, name: updatedParam}})
    } else {
        return res.status(500).send({success:false,message:`something went wrong: ${USER}`})
    }
})

router.route('/phone').post(async(req,res)=>{

    const {email, updatedParam, accessToken} = req.body
    const isLogged = await Login.find({email:email})
    if(isLogged.length < 1) {
        return res.status(404).send({success:false, message:Errors.NOT_FOUND})
    }
    
    const isValidToken = await verifyAccessToken(accessToken)

    if(isValidToken?.err) return res.status(400).send({success:false,message:isValidToken?.err})


    const USER = await User.updateOne({email:email}, {phone: updatedParam}, {upsert:true})
    console.log(USER)
    if(USER?.modifiedCount == 0){
        return res.status(400).send({success:false,message:`Name IS THE SAME`})
    } else if (USER?.acknowledged && USER?.modifiedCount !== 0){
        return res.status(200).send({success:true,data:{message:`PHONE HAS BEEN CHANGED TO ${updatedParam}`, phone: updatedParam}})
    } else {
        return res.status(500).send({success:false,message:`something went wrong: ${USER}`})
    }
})

router.route('/email').post(async(req,res)=>{
    try {
        const session = await conn.startSession()
        const {email, updatedParam, accessToken} = req.body
        const isLogged = await Login.find({email:email})
        if(isLogged.length < 1) {
            console.log(Errors.NOT_FOUND);
            return res.status(404).send({success:false, message:Errors.NOT_FOUND})
        }
        
        const isValidToken = await verifyAccessToken(accessToken)

        if(isValidToken?.err) return res.status(400).send({success:false,message:isValidToken?.err})

        return await session.withTransaction(async()=>{

            const USER = await User.updateOne({email:email}, {email: updatedParam}, {upsert:true}, {session})
            const LOGIN = await Login.updateOne({email:email}, {email: updatedParam}, {upsert:true}, {session})
            // console.log(USER)
    
            if(USER?.modifiedCount == 0 && LOGIN?.modifiedCount == 0 ){
                return res.status(400).send({success:false,message:`Email IS THE SAME`})
            }

             res.status(200).send({success:true,data:{message:`Email HAS BEEN CHANGED TO ${updatedParam}`, email: updatedParam}})
            await session.commitTransaction(); 
            session.endSession()
        })
    } catch (error) {
        return res.status(500).send({success:false,message:error})

    }

    
})

router.route('/bio').post(async(req,res)=>{

    const {email, updatedParam,accessToken} = req.body
    const isLogged = await Login.find({email:email})
    if(isLogged.length < 1) {
        return res.status(404).send({success:false, message:Errors.NOT_FOUND})

    }

    const isValidToken = await verifyAccessToken(accessToken)

    if(isValidToken?.err) return res.status(400).send({success:false,message:isValidToken?.err})



    const USER = await User.updateOne({email:email}, {bio: updatedParam}, {upsert:true})
    console.log(USER)

    if(USER?.modifiedCount == 0){
        return res.status(400).send({success:false,message:`BIO IS THE SAME`})
        return res.status(200).send({success:true,data:{message:`BIO HAS BEEN CHANGED TO ${updatedParam}`, bio: updatedParam}})
        
    
    } else {
        return res.status(500).send({success:false,message:`something went wrong: ${USER}`})
    }
})

router.route('/password').post(async(req,res)=>{

    try {
        
    const {email, updatedParam, oldPassword, accessToken, loggedThrough} = req.body
    if(!updatedParam ) return res.status(400).send({success:false, message:`MISSING ARGUMENT`})
    const isLogged = await Login.find({email:email})
    
    if(isLogged.length < 1) {
        return res.status(404).send({success:false, message:Errors.NOT_FOUND})
    }

    const salt = bcrypt.genSaltSync(10);
    const hashPw = bcrypt.hashSync(updatedParam, salt)
    // validate if user has been signed up through social 
    if(isLogged[0].loggedThrough !=='Internal' && !oldPassword){
        const isValidToken = await verifyAccessToken(accessToken)

        if(isValidToken?.err) return res.status(400).send({success:false,message:isValidToken?.err})

        console.log(`password: ${updatedParam}`)
        const isValid = serverValidatePw(isValidToken?.result?.fullName,result?.email,updatedParam,res)
        if(isValid != `valid`) return 
        console.log(`valid`)
        const updatedPw = await Login.updateOne({email:email}, {password: hashPw})
        if(updatedPw?.modifiedCount == 0){
            return res.status(400).send({success:false,message:`Password IS THE SAME`})
        }
        return res.status(200).send({success:true, message: `PASSWORD HAS BEEN ADDED`})
    }

    // validate if user has been signed up manually through register (Internal)
    const isVALID = bcrypt.compareSync(oldPassword, isLogged[0]?.password)
    if(!isVALID){
        return res.status(400).send({success:false, message:Errors.WRONG_PASSWORD});
    } 

    const updatedPw = await Login.updateOne({email:email}, {password: hashPw})

    if(updatedPw?.modifiedCount == 0){
        return res.status(400).send({success:false,message:`PASSWORD IS THE SAME`})
    }else if(updatedPw?.modifiedCount !== 0){
        return res.status(200).send({success:true,data:{message:`PASSWORD HAS BEEN CHANGED`}})
    }
        
    } catch (error) {
        return res.status(500).send({success:false,message:error || `SOMETHING_WENT_WRONG`})

    }

})


export default router