import express from 'express'
import cors from 'cors'
import 'dotenv/config'
import connectDB from './Models/db.js';
import userRouter from './Router/UserRouter.js';
import imageRouter from './Router/ImageRouter.js';

const PORT=process.env.PORT || 4000
const app=express()

app.use(express.json())
app.use(cors())
await connectDB()

app.use('/api/user',userRouter)
app.use('/api/image',imageRouter)
app.get('/',(req,res)=>{
    res.send("API working")
})

app.listen(PORT,()=>{
    console.log(`Server is running on port ${PORT}`)
})