import mongoose from 'mongoose';
const Schema=mongoose.Schema;

const UserSchema=new Schema({
    name:{
        type:String,
        required:true,
    },
    email:{
        type:String,
        required:true,
        unique:true
    },
    password:{
        type: String,
        required:true,
    },
    creditBalance:{
        type:Number,
        default:5,
    }
});

const UserModel=mongoose.models.users  || mongoose.model('users',UserSchema);
export default UserModel