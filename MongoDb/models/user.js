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
    picture: {type: String}
})


User.set('toJSON', {
    virtuals: true,
    transform: function(doc, ret, options){
        ret.dbID = ret._id;
        delete ret.id
        delete ret._id;
        delete ret.__v;
    }
})
const UserSchema = mongoose.model('User', User) || mongoose.model('User')

export default UserSchema