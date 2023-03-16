import express from 'express'
import * as dotenv from "dotenv"
import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'

import { Errors } from '../../utils.js'
import {Login,User} from '../../MongoDb/models/index.js'
import { serverValidatePw } from '../RegisterRoute.js'
import { validatePassword, verifyAccessToken } from '../../utils.js'
import { conn } from '../../MongoDb/connect.js'
import { generateAccessToken } from '../tokenRoute.js'
import { validateNumber } from '../../MongoDb/models/user.js'

dotenv.config();


const router = express.Router()

router.route('/delete').delete(async(req,res)=>{
    try {
        const session = await conn.startSession()

        const {userEmail, updatedParams,accessToken} = req.body

        const isValidToken = await verifyAccessToken(accessToken);
        if(isValidToken?.err) return res.status(400).send({success:false,message:isValidToken?.err})

        const isLogged = await Login.findOne({email:userEmail})
        if(!isLogged) {
            return res.status(404).send({success:false, message:Errors.NOT_FOUND})
        }

        return await session.withTransaction(async()=>{
            if(!isLogged?.password && isLogged?.loggedThrough !== 'Internal'){
                let isDeletedLOGIN = await Login.deleteOne({email: userEmail}, {session});
                let isDeletedUSER = await User.deleteOne({email: userEmail}, {session});
                console.log(`USER:`, isDeletedUSER);
                console.log(`LOGIN:`, isDeletedLOGIN);
                return res.status(200).send({success:true, data: { message:`USER_IS_DELETED`}})

            }
            const isValidPw = bcrypt.compareSync(updatedParams?.password, isLogged?.password)
            console.log("ISVALID:",isValidPw)
            if(!isValidPw) return res.status(400).send({success:false,message:Errors.WRONG_PASSWORD})
            let isDeletedLOGIN = await Login.deleteOne({email: userEmail}, {session});
            let isDeletedUSER = await Login.deleteOne({email: userEmail}, {session});

            if(!isDeletedLOGIN || !isDeletedUSER) return res.status(500).send({success:false,message:`USER_ISN'T_DELETED`})
            console.log(`USER:`, isDeletedUSER);
            console.log(`LOGIN:`, isDeletedLOGIN);
            console.log(isLogged);
            await session.commitTransaction(); 
            session.endSession()
            return res.status(200).send({success:true, data: { message:`USER_IS_DELETED`}})

        })

        
    } catch (error) {
        
    }

})

router.route('/').post(async(req,res)=>{

    try {
        const session = await conn.startSession()
    
        const {userEmail, accessToken, updatedParams } = req.body 
        let changesArray = {
        }

        console.log(req.body)
        const isLogged = await User.find({email:userEmail});
    
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
                console.log('login',login);
                console.log('user',user);
                if (user?.modifiedCount === 0 && login?.modifiedCount === 0 (user?.acknowledged && !login?.acknowledged)){
                    changesArray.newEmail = `${updatedParams?.email}  hasn't been applied`
                     console.log(changesArray.newEmai)
                } else if (user?.modifiedCount != 0 &&login?.modifiedCount != 0 ){
                    changesArray.newEmail = updatedParams?.email
                     console.log(changesArray.newEmail)
                }
                
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
                
            }
            if(updatedParams?.phone){
                let isValid = validateNumber(updatedParams?.phone)
                
                if(!isValid){
                    changesArray.newPhone = Errors?.INVALID_NUMBER
                    throw new Error({message: Errors?.INVALID_NUMBER})
                } 
               
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
                console.log(`token:`, isValidToken);
                const isValid = await serverValidatePw(isValidToken?.fullName,userEmail,updatedParams?.password,res)
                if(!isValid?.success) return console.log(isValid); 
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
            let userData = {
              email:isLogged[0]?.email,
              fullName: isLogged[0]?.fullName,
              bio:isLogged[0]?.bio ,
              phone:isLogged[0]?.phone ,
              picture: isLogged[0]?.picture,
              loggedThrough: isLogged[0]?.loggedThrough,
            }
            console.log(userData);
            let accessToken = await generateAccessToken(userData);
            console.log(`token: ${accessToken}`);
            await session.commitTransaction(); 
            session.endSession()
            return res.status(200).send({success:true, data: { message:Errors.CHANGES_APPLIED, changes: changesArray, accessToken}})

        })

    } catch (error) {
        return res.status(500).send({success:false,message:error |`SOMETHING WENT WRONG`})

    }
})


export default router