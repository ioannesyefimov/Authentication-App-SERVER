import express from 'express'
import * as dotenv from "dotenv"
import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'


import {Login,User} from '../../MongoDb/models/index.js'
import { serverValidatePw } from '../RegisterRoute.js'
import { validatePassword } from '../../utils.js'



dotenv.config();



const router = express.Router()



router.route('/picture').post(async(req,res)=>{

    const {email, newPicture} = req.body
    const isLogged = await Login.find({email:email})
    if(isLogged.length < 1) {
        return res.status(404).send({success:false, message:'NOT_FOUND'})
    }


    const USER = await User.updateOne({email:email}, {picture: newPicture}, {upsert:true})
    console.log(USER)

    if(USER?.acknowledged){
        if(USER?.modifiedCount == 0){
            return res.status(400).send({success:false,message:`PICTURE IS THE SAME`})
        }
            return res.status(200).send({success:true,data:{message:`PICTURE HAS BEEN CHANGED TO ${newPicture}`, url: newPicture}})
            
        
    } else {
        return res.status(500).send({success:false,message:`something went wrong: ${USER}`})
    }
})

router.route('/name').post(async(req,res)=>{

    const {email, newName} = req.body
    const isLogged = await Login.find({email:email})
    if(isLogged.length < 1) {
        return res.status(404).send({success:false, message:'NOT_FOUND'})
    }


    const USER = await User.updateOne({email:email}, {fullName: newName}, {upsert:true})
    console.log(USER)

    if(USER?.acknowledged){
        if(USER?.modifiedCount == 0){
            return res.status(400).send({success:false,message:`Name IS THE SAME`})
        }
            return res.status(200).send({success:true,data:{message:`NAME HAS BEEN CHANGED TO ${newName}`, name: newName}})
            
        
    } else {
        return res.status(500).send({success:false,message:`something went wrong: ${USER}`})
    }
})

router.route('/phone').post(async(req,res)=>{

    const {email, newPhone} = req.body
    const isLogged = await Login.find({email:email})
    if(isLogged.length < 1) {
        return res.status(404).send({success:false, message:'NOT_FOUND'})
    }


    const USER = await User.updateOne({email:email}, {phone: newPhone}, {upsert:true})
    console.log(USER)

    if(USER?.acknowledged){
        if(USER?.modifiedCount == 0){
            return res.status(400).send({success:false,message:`Name IS THE SAME`})
        }
            return res.status(200).send({success:true,data:{message:`PHONE HAS BEEN CHANGED TO ${newPhone}`, phone: newPhone}})
            
        
    } else {
        return res.status(500).send({success:false,message:`something went wrong: ${USER}`})
    }
})
router.route('/bio').post(async(req,res)=>{

    const {email, newbio} = req.body
    const isLogged = await Login.find({email:email})
    if(isLogged.length < 1) {
        return res.status(404).send({success:false, message:'NOT_FOUND'})
    }


    const USER = await User.updateOne({email:email}, {bio: newbio}, {upsert:true})
    console.log(USER)

    if(USER?.acknowledged){
        if(USER?.modifiedCount == 0){
            return res.status(400).send({success:false,message:`BIO IS THE SAME`})
        }
            return res.status(200).send({success:true,data:{message:`BIO HAS BEEN CHANGED TO ${newbio}`, bio: newbio}})
            
        
    } else {
        return res.status(500).send({success:false,message:`something went wrong: ${USER}`})
    }
})

router.route('/password').post(async(req,res)=>{

    const {email, newPassword, oldPassword, accessToken, loggedThrough} = req.body
    if(!newPassword ) return res.status(400).send({success:false, message:`MISSING ARGUMENT`})
    const isLogged = await Login.find({email:email})
    
    if(isLogged.length < 1) {
        return res.status(404).send({success:false, message:'NOT_FOUND'})
    }

    const salt = bcrypt.genSaltSync(10);
    const hashPw = bcrypt.hashSync(newPassword, salt)
    if(isLogged[0].loggedThrough !=='Internal' && !oldPassword){
       return jwt.verify(accessToken, process.env.JWT_TOKEN_SECRET, async(err,result)=>{
            if(err) {
                console.log(err)
                return res.status(404).send({success:false, message:err})
            }
            console.log(result)
            console.log(`password: ${newPassword}`)
            const isValid = serverValidatePw(result?.fullName,result?.email,newPassword,res)
            if(isValid != `valid`) return console.log(`isn't valid`);
            console.log(`valid`)
            const updatedPw = await Login.updateOne({email:email}, {password: hashPw})

            if(updatedPw?.modifiedCount == 0){
                return res.status(400).send({success:false,message:`Password IS THE SAME`})
            }
            return res.status(200).send({success:true, message: `PASSWORD HAS BEEN CHANGED`})
        })
    }

    // const USER = await User.updateOne({email:email}, {bio: newPassword}, {upsert:true})


    const isVALID = bcrypt.compareSync(oldPassword, isLogged[0]?.password)
    if(!isVALID){
        return res.status(400).send({success:false, message:Errors.WRONG_PASSWORD});
    } 

    
    const updateLogin = await Login.updateOne({email:email}, {password: hashPw})
    // console.log(USER)

    if(updateLogin?.acknowledged){
        if(updateLogin?.modifiedCount == 0){
            return res.status(400).send({success:false,message:`PASSWORD IS THE SAME`})
        }
            return res.status(200).send({success:true,data:{message:`PASSWORD HAS BEEN CHANGED`}})
            
        
    } else {
        return res.status(500).send({success:false,message:`something went wrong: ${updateLogin}`})
    }
})


export default router