import multer from 'multer'
import cloudinary from 'cloudinary'
import express from 'express'
import fileUploadMiddleware from './fileUploadMiddleware.js'

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
})
const router = express.Router()

const storage = multer.memoryStorage();
const upload = multer({storage})
// router.route('/').post(upload.single('file'), fileUploadMiddleware);

router.route('/files').post(upload.single('file'), fileUploadMiddleware)

export default router
