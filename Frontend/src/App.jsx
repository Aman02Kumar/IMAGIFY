import React from 'react'
import { Route, Routes } from 'react-router-dom'
import Home from './pages/Home'
import BuyCredit from './pages/BuyCredit'
import Result from './pages/Result'
import './index.css'
import Navbar from './components/Navbar'
import Footer from './components/Footer'
import Login from './components/Login'
import { useContext } from 'react'
import { AppContext } from './context/AppContext'
import { ToastContainer} from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const App = () => {
  const {showLogin}=useContext(AppContext);
  return (
    <div className='px-4 sm:px-10 md:px-14 lg:28 min-h-screen bg-gradient-to-b from-teal-50 from-orange-50'>
      <ToastContainer position='bottom-right'/>
      <Navbar/>
      {showLogin && <Login/>}
      <Routes>
        <Route path='/' element={<Home/>}/>
        <Route path='/Buy' element={<BuyCredit/>}/>
        <Route path='/Result' element={<Result/>}/>
      </Routes>
      <Footer/>
    </div>
  )
}

export default App