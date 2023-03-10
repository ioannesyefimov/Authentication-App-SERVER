import express from 'express'
import * as dotenv from "dotenv"





dotenv.config();
 

const router = express.Router()

router.route('/picture').post(async(req,res)=>{
    console.log('/api/change/picture')
    console.log(req.body)
    res.end()
})

export default router