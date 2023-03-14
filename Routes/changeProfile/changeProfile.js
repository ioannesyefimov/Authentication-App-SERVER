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
    

    if(USER?.modifiedCount == 0){
        return res.status(400).send({success:false,message:`PICTURE  hasn't been applied`})
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
    

    if(USER?.modifiedCount == 0){
        return res.status(400).send({success:false,message:`Name  hasn't been applied`})
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
    
    if(USER?.modifiedCount == 0){
        return res.status(400).send({success:false,message:`Name  hasn't been applied`})
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
            // 
    
            if(USER?.modifiedCount == 0 && LOGIN?.modifiedCount == 0 ){
                return res.status(400).send({success:false,message:`Email  hasn't been applied`})
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
    

    if(USER?.modifiedCount == 0){
        return res.status(400).send({success:false,message:`BIO  hasn't been applied`})
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
        const isValid = serverValidatePw(isValidToken?.result?.fullName,isValidToken?.email,updatedParam,res)
        if(isValid != `valid`) return 
        console.log(`valid`)
        const updatedPw = await Login.updateOne({email:email}, {password: hashPw})
        if(updatedPw?.modifiedCount == 0){
            return res.status(400).send({success:false,message:`Password  hasn't been applied`})
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
        return res.status(400).send({success:false,message:`PASSWORD  hasn't been applied`})
    }else if(updatedPw?.modifiedCount !== 0){
        return res.status(200).send({success:true,data:{message:`PASSWORD HAS BEEN CHANGED`}})
    }
        
    } catch (error) {
        return res.status(500).send({success:false,message:error || `SOMETHING_WENT_WRONG`})

    }

})


router.route('/').post(async(req,res)=>{

    try {
        const session = await conn.startSession()
    
        const {userEmail, accessToken, updatedParams } = req.body 
        let changesArray = {
        }

        console.log(req.body)
        const isLogged = await Login.find({email:userEmail});
    
        if(isLogged.length < 1) {
            return res.status(404).send({success:false, message:Errors.NOT_FOUND})
        }
    
        // validate if user has been signed up through social 
        // if(isLogged[0].loggedThrough !=='Internal' && !oldPassword){
        const isValidToken = await verifyAccessToken(accessToken);
        if(isValidToken?.err) return res.status(400).send({success:false,message:isValidToken?.err})


        return await session.withTransaction(async()=>{
            console.log(`transaction started`)

            if(updatedParams?.email){
                let user=   await User.updateOne({email: userEmail}, {email :updatedParams?.email },  {upsert:true}, {session});
                let login = await Login.updateOne({email: userEmail}, {email :updatedParams?.email },  {upsert:true}, {session});

                if (user?.modifiedCount === 0 && login?.modifiedCount === 0 (user?.acknowledged && !login?.acknowledged)){
                    changesArray.newEmail = `${updatedParams?.email}  hasn't been applied`
                     console.log(changesArray.newEmai)
                } else if (user?.modifiedCount != 0 &&login?.modifiedCount != 0 ){
                    changesArray.newEmail = updatedParams?.email
                     console.log(changesArray.newEmail)
                }
                return changesArray
            }
            if(updatedParams.fullName){
             
                  let user=   await User.updateOne({email: userEmail}, {fullName :updatedParams?.fullName },  {upsert:true}, {session});
                if (user?.modifiedCount === 0 && user?.acknowledged ){
                    changesArray.newFullname = `${updatedParams?.fullName}  hasn't been applied`
                     console.log(changesArray.newFullName)
                } else if (user?.modifiedCount != 0){
                    changesArray.newFullName = updatedParams?.fullName
                     console.log(changesArray.newFullName)
                }
                return changesArray
            }
            if(updatedParams?.phone){
               
                  let user=   await User.updateOne({email: userEmail}, {phone :updatedParams?.phone },  {upsert:true}, {session});
                if (user?.modifiedCount === 0 && user?.acknowledged ){
                    changesArray.newPhone = `${updatedParams?.phone}  hasn't been applied`
                     console.log(changesArray.phone)
                } else if (user?.modifiedCount !== 0 ){
                    changesArray.newPhone = updatedParams?.phone
                     console.log(changesArray.newPhone)
                }
            }
            if(updatedParams?.bio){
                let user=   await User.updateOne({email: userEmail}, {bio :updatedParams?.bio },  {upsert:true}, {session});
                console.log(user);
                if (user?.modifiedCount === 0 && user?.acknowledged){
                    changesArray.newBio = `${updatedParams?.bio}  hasn't been applied`
                    console.log(changesArray.newBio)

                } else if (user?.modifiedCount != 0){
                    changesArray.newBio = updatedParams?.bio
                      console.log(changesArray.newBio)
                }
                
            }
            if(updatedParams?.picture){
                let user=   await User.updateOne({email: userEmail}, {picture :updatedParams?.picture },  {upsert:true}, {session});
                console.log(user);
                if (user?.modifiedCount === 0 && user?.acknowledged){
                    changesArray.newPicture = `${updatedParams?.picture}  hasn't been applied`
                    console.log(changesArray.newPicture)

                } else if (user?.modifiedCount != 0){
                    changesArray.newPicture = updatedParams?.picture
                      console.log(changesArray.newPicture)
                }
                
            }
            if(updatedParams?.password){
                const isValid = await serverValidatePw(isValidToken?.fullName,userEmail,updatedParams?.password,res)
                if(!isValid?.success)  console.log(isValid); 
                console.log(isValid);
                const salt = bcrypt.genSaltSync(10);
                const hashPw = bcrypt.hashSync(updatedParams?.password, salt)
                console.log(`before db search`);
                const user = await Login.updateOne({email:userEmail}, {password: hashPw},  {upsert:true}, {session})
                console.log(`after db search`);
                console.log(user)
                if (user?.modifiedCount === 0 && user?.acknowledged){
                    changesArray.newPassword = `${updatedParams?.password}  hasn't been applied`
                     console.log(changesArray.password)
                } else if (user?.modifiedCount != 0){
                    changesArray.newPassword = updatedParams?.password
                     console.log(changesArray.newPassword)
                }
                
            }
            if(Object.keys(changesArray).length === 0 && changesArray.constructor === Object) return res.status(400).send({success:false, message:`CHANGES HAVEN'T BEEN APPLIED`})
            console.log(changesArray)
            await session.commitTransaction(); 
            session.endSession()
            return res.status(200).send({success:true, data: {changes: changesArray}})

        })



    } catch (error) {
        return res.status(500).send({success:false,message:error |`SOMETHING WENT WRONG`})

    }
})
// const handleDBchange = async({email, type, updatedParam,newParam, session})=>{
//     console.log(updatedParam)
//     console.log(newParam)
//     return type === 'Login' ? (
//         await Login.updateOne({email: email}, {updatedParam:newParam },  {upsert:true}, {session})

//     ) : (
//        await User.updateOne({email: email}, {updatedParam:newParam },  {upsert:true},  {session})

//     );

   

// }

export default router