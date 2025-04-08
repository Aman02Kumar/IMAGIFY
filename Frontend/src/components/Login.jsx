import React, { useEffect, useState } from 'react'
import { assets } from '../assets/assets'
import { AppContext } from '../context/AppContext';
import { useContext } from 'react';
import { motion } from "motion/react"
import axios from 'axios'
import { toast } from 'react-toastify';

const Login = () => {
    const [state,setState]=useState('Login');
    const {setShowLogin,backendUrl,setToken,setUser}=useContext(AppContext);

    const [name,setName]=useState('');
    const [email,setEmail]=useState('');
    const [password,setPassword]=useState('');

    const onSubmitHandler=async(e)=>{
        e.preventDefault();
        try {
            if(state==='Login'){
                const {data}=await axios.post(backendUrl+'/api/user/login',{email,password})
                if(data.success){
                    setToken(data.token)
                    setUser(data.user)
                    localStorage.setItem('token',data.token)
                    setShowLogin(false)
                }else{
                    toast.error(data.message)
                }
            }else{
                const {data}=await axios.post(backendUrl+'/api/user/signup',{name,email,password})
                if(data.success){
                    setToken(data.token)
                    setUser(data.user)
                    localStorage.setItem('token',data.token)
                    setShowLogin(false)
                }else{
                    toast.error(data.message)
                }
            }
            
        } catch (error) {
            toast.error(error.message)
        }
    }

    useEffect(()=>{
        document.body.style.overflow='hidden';
        return()=>{
            document.body.style.overflow='unset';
        }
    },[])
  return (
    <div className='absolute top-0 left-0 right-0 bottom-0 z-10 backdrop-blur-sm bg-black/30 flex justify-center items-center'>
        <motion.form onSubmit={onSubmitHandler}
        initial={{opacity:0.2 , y:50}}
        transition={{duration:.3}}
        whileInView={{opacity:1,y:0}}
        viewport={{once:true}}
        className='relative bg-white p-10 rounded-xl text-slate-500'>
            <h1 className='text-center text-2xl text-neutral-700 font-medium'>{state}</h1>
            <p className='text-sm text-center mt-2'>{state==='Login' ? 'Welcome Back! Please Sign In to Continue':'Please Sign Up to Continue'}</p>
            {state!=='Login' && <div className='border px-6 py-2 flex items-center gap-2 rounded-full mt-5'>
                <img src={assets.profile_icon} width={22}/>
                <input type='text' placeholder='Full Name' onChange={e=>setName(e.target.value)} value={name} className='outline-none text-sm' required/>
            </div> }
            <div className='border px-6 py-2 flex items-center gap-2 rounded-full mt-4'>
                <img src={assets.email_icon}/>
                <input type='email' placeholder='Email id' onChange={e=>setEmail(e.target.value)} value={email} className='outline-none text-sm' required/>
            </div>
            <div className='border px-6 py-2 flex items-center gap-2 rounded-full mt-4'>
                <img src={assets.lock_icon}/>
                <input type='password' placeholder='Password' onChange={e=>setPassword(e.target.value)} value={password} className='outline-none text-sm' required/>
            </div>
            <p className='text-sm text-blue-600 my-4 cursor-pointer'>Forgot Password?</p>
            <button className='bg-blue-600 w-full text-white py-2 rounded-full'>{state==='Login' ? 'Login' :'create Account'}</button>
            {state==='Login' && <p className='mt-5 text-center'>Don't have an account?<span className='text-blue-600 cursor-pointer ml-1' onClick={()=>setState('Sign Up')}>Sign up</span></p>}
            {state!=='Login' && <p className='mt-5 text-center'>Already have an account?<span className='text-blue-600 cursor-pointer ml-1' onClick={()=>setState('Login')}>Login</span></p>}
            <img src={assets.cross_icon} className='absolute right-5 top-5 cursor-pointer' onClick={()=>setShowLogin(false)}/>
            
        </motion.form>
    </div>
  )
}

export default Login