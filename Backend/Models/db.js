import mongoose from "mongoose";
const mong_url=process.env.MONGODB_URL;

const connectDB = async() =>{
    mongoose.connection.on('connected',()=>{
        console.log('Database Connected')
    })
    await mongoose.connect(mong_url)
}

export default connectDB;