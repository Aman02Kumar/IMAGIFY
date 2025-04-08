import express from 'express'
import {login,paymentRazorpay,signup,userCredits, verifyRazorpay} from '../Controllers/AuthController.js'
import userAuth from '../Middlewares/auth.js'

const userRouter=express.Router()

userRouter.post('/signup',signup)
userRouter.post('/login',login)
userRouter.get('/credits',userAuth,userCredits)
userRouter.post('/pay-razor',userAuth,paymentRazorpay)
userRouter.post('/verify-razor',verifyRazorpay)

export default userRouter