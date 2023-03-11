import cloudinary from 'cloudinary'
import express from 'express'
import uploadImageFunc from './fileUploadMiddleware.js'

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
})
const router = express.Router()


router.route('/picture').post(async(req,res)=>{

   const uploadImage = await uploadImageFunc(req.body.image)
   if(!uploadImage.success){
    console.log(uploadImage)
    return res.status(500).send({success:false,message:uploadImage.message})
   }

   return res.status(200).send({success:true, data:{url: uploadImage.data?.url}})
//    if(uplaodImage)
//     .then(url=>{
//         console.log(url)
//         return res.status(200).send({sucess:true,data:url})
//     })
//     .catch(err=>{
//         console.log(err)

//        return  res.status(500).send({sucess:false,message:err})
//     })
})
export default router
