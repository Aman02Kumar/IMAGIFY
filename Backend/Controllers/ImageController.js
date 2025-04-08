import axios from "axios";
import UserModel from "../Models/User.js";
import FormData from "form-data";

export const generateImage=async(req,res)=>{
    try {
        const {userId,prompt}=req.body;
        const user= await UserModel.findById(userId)
        if(!user || !prompt){
            return res.json({success:false , message:"Missing details"})
        }
        if(user.creditBalance ===0 || user.creditBalance <0){
            return res.json({success:false , message:"No credit Balance" , creditBalance:user.creditBalance})
        }
        const formData=new FormData();
        formData.append('prompt',prompt)

        const {data}=await axios.post('https://clipdrop-api.co/text-to-image/v1',formData,{
            headers:{
                'x-api-key':process.env.CLIPDROP_API,
            },
            responseType:'arraybuffer'
        })

        const base64Img=Buffer.from(data,'binary').toString('base64')
        const resultImg= `data:image/png;base64,${base64Img}`
        await UserModel.findByIdAndUpdate(user._id,{creditBalance:user.creditBalance-1})

        res.json({success:true, message:"Image generated", creditBalance:user.creditBalance-1,resultImg})
    } catch (error) {
        console.error(error);
        res.json({ success: false, message: error.message });
    }
}

