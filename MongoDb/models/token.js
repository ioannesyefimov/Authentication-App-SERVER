import mongoose from "mongoose";



const refreshToken = new mongoose.Schema({
    refreshToken : {
        type: String,
    }
})


refreshToken.set('toJSON', {
    virtuals: true,
    transform: function(doc, ret, options){
        ret.dbID = ret._id;
        delete ret.id
        delete ret._id;
        delete ret.__v;
    }
})
const refreshTokenScheme = mongoose.model('refreshToken', refreshToken)


export default refreshTokenScheme 