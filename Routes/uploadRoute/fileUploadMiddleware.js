import axios from 'axios'
import cloudinary from 'cloudinary'


function fileUploadMiddleware(req,res){
    cloudinary.uploader.upload_stream((result)=>{
        console.log(`${req.headers.origin}/api/change/picture`)
        axios({
            url:`${req.headers.origin}/api/change/picture`,
            method: "post",
            data: {
                url: result.secure_url,
                profileName: req.body.proifleName,
                
            },
        }).then(response=>{
            res.status(200).send({success:true,data:response.data.data})
        })
        .catch(err=>{
            res.status(500).sed({success:false,message:err})
        })
    })

}

export default fileUploadMiddleware