import React from 'react'
import { assets } from '../assets/assets'
import { motion } from "motion/react"

const Footer = () => {
  return (
    <motion.div className='flex items-center justify-between gap-4 py-3 mt-20'
    initial={{opacity:0.2 , y:100}}
    transition={{duration:1}}
    whileInView={{opacity:1,y:0}}
    viewport={{once:true}}
    >
        <div className='flex gap-2.5 ml-auto mr-4 cursor-pointer'>
        <a href="https://x.com/bharat_jaw91783" target='_blank'>
            <img src={assets.twitter_icon} width={35} />
        </a>

        <a href="https://www.instagram.com/bharat_jawa_" target='_blank'>
            <img src={assets.instagram_icon} width={35}/>
        </a>
        </div>
    </motion.div>
  )
}

export default Footer