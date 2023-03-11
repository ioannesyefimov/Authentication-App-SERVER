import express from 'express'
import * as dotenv from "dotenv"


import {Login,User} from '../../MongoDb/models/index.js'



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
            return res.status(200).send({success:true,data:{message:`NAME HAS BEEN CHANGED TO ${newName}`, url: newPicture}})
            
        
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
            return res.status(200).send({success:true,data:{message:`PHONE HAS BEEN CHANGED TO ${newPhone}`, url: newPicture}})
            
        
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
            return res.status(200).send({success:true,data:{message:`BIO HAS BEEN CHANGED TO ${newbio}`, url: newPicture}})
            
        
    } else {
        return res.status(500).send({success:false,message:`something went wrong: ${USER}`})
    }
})

router.route('/password').post(async(req,res)=>{

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
            return res.status(200).send({success:true,data:{message:`BIO HAS BEEN CHANGED TO ${newbio}`, url: newPicture}})
            
        
    } else {
        return res.status(500).send({success:false,message:`something went wrong: ${USER}`})
    }
})


export default router