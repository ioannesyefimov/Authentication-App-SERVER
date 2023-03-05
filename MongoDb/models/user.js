import mongoose from "mongoose";

let validateEmail = function(email) {
    const regex = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/; 
       return regex.test(email)
};

const User = new mongoose.Schema({
    fullName: {type: String, required:true},
    email: {
        type: String,
        trim: true,
        lowercase: true,
        unique: true,
        required: 'Email address is required',
        validate: [validateEmail, 'Please fill a valid email address'],

        
        // match: [/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/, 'Please fill a valid email address'],
    },
    loggedThrough: {type:String, required:true},
    picture: {type: String},
     
}, {versionKey: false })


User.set('toJSON', {
    virtuals: true,
    transform: (doc,result) => {
        return {
            ...result,
            id: result._ID
        }
        // ret.dbID = ret._id;
        // delete ret.id
        // delete ret._id;
        // delete ret.__v;
    }
})
const UserSchema = mongoose.model('User', User) || mongoose.model('User')

export default UserSchema