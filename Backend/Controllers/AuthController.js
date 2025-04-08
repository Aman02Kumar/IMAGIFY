import UserModel from "../Models/User.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import razorpay from 'razorpay';
import TransactionModel from "../Models/TransactionModel.js";

const signup = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.json({ success: false, message: "Missing Details" });
    }

    const existingUser = await UserModel.findOne({ email });
    if (existingUser) {
      return res.json({ success: false, message: "Email already registered" });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const userData = { name, email, password: hashedPassword };
    const newUser = new UserModel(userData);
    const user = await newUser.save();

    if (!process.env.JWT_SECRET) {
      throw new Error("JWT_SECRET is not defined");
    }

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: "1h" });

    res.status(201).json({
      success: true,
      message: "User registered successfully",
      token,
      user: { name: user.name },
    });
  } catch (error) {
    console.error(error);
    res.json({ success: false, message: error.message });
  }
};

const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.json({ success: false, message: "Missing Details" });
    }

    const user = await UserModel.findOne({ email });
    if (!user) {
      return res.json({ success: false, message: "User does not exist" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.json({ success: false, message: "Invalid Credentials" });
    }

    if (!process.env.JWT_SECRET) {
      throw new Error("JWT_SECRET is not defined");
    }

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: "1h" });

    res.json({
      success: true,
      message: "Login successful",
      token,
      user: { name: user.name },
    });
  } catch (error) {
    console.error(error);
    res.json({ success: false, message: error.message });
  }
};


const userCredits=async(req,res)=>{
    try{
        const {userId}=req.body;
        const user= await UserModel.findById(userId)
        res.json({success:true, credits:user.creditBalance, user:{name:user.name}})
    }catch(error){
        console.error(error);
        res.json({ success: false, message: error.message });
    }
}

const razorpayInstance=new razorpay({
  key_id:process.env.RAZORPAY_KEY_ID,
  key_secret:process.env.RAZORPAY_SECRET_ID,
});

// const paymentRazorpay=async(req,res)=>{
//   try {
//     const {userId,planId}=req.body
//     const {userData}=await UserModel.findById(userId)
//     if(!userId || !planId){
//       return res.json({success:false , message:'Missing Details'})
//     }
//     let credits,plan,amount,date

//     switch (planId) {
//       case 'Basic':
//           plan='Basic'
//           credits=100
//           amount=50
//           break;
//       case 'Advanced':
//           plan='Advanced'
//           credits=500
//           amount=250
//           break;
//       case 'Business':
//           plan='Business'
//           credits=5000
//           amount=2000
//           break;
//       default:
//         return res.json({success:false , message:'Plan not Found'});
//     }
    
//     date=Date.now()
//     const transactionData={
//       userId,plan,amount,date,credits
//     }

//     const newTranscation = await TransactionModel.create(transactionData)
//     const options={
//       amount:amount,
//       currency:process.env.CURRENCY,
//       receipt:newTranscation._id,
//     }
//     await razorpayInstance.orders.create(options,(error,order)=>{
//       if(error){
//         console.log(error);
//         res.json({success:false, message:error})
//       }
      
//       res.json({success:true, order})
//     })
//   } catch (error) {
//     console.log(error)
//     res.json({success:false , message:error.message})
//   }
// }

const paymentRazorpay = async (req, res) => {
  try {
      const { userId, planId } = req.body;

      if (!userId || !planId) {
          return res.json({ success: false, message: "Missing Details" });
      }

      const userData = await UserModel.findById(userId);
      if (!userData) {
          return res.json({ success: false, message: "User not found" });
      }

      let credits, plan, amount, date;

      switch (planId) {
          case "Basic":
              plan = "Basic";
              credits = 100;
              amount = 50;
              break;
          case "Advanced":
              plan = "Advanced";
              credits = 500;
              amount = 250;
              break;
          case "Business":
              plan = "Business";
              credits = 5000;
              amount = 2000;
              break;
          default:
              return res.json({ success: false, message: "Plan not Found" });
      }

      date = Date.now();

      const transactionData = { userId, plan, amount, date, credits };
      const newTransaction = await TransactionModel.create(transactionData);

      const options = {
          amount: amount * 100, // Razorpay expects the amount in paise (not rupees)
          currency: process.env.CURRENCY || "INR", // Default currency fallback
          receipt: newTransaction._id.toString(),
      };

      const order = await razorpayInstance.orders.create(options);
      res.json({ success: true, order });
  } catch (error) {
      console.error(error);
      res.json({ success: false, message: error.message });
  }
};


// const verifyRazorpay=async(req,res)=>{
//    try {
//     const {razorpay_order_id}=req.body
//     const orderInfo=await razorpayInstance.orders.fetch(razorpay_order_id)
//     if(orderInfo.status==='paid'){
//       const transactionData=await TransactionModel.findById(orderInfo.receipt)
//       if(transactionData.payment){
//         return res.json({success:false, message:'Payment Failed'})
//       }
//       const userData=await UserModel.findById(transactionData.userId)

//       const creditBalance=userData.creditBalance + transactionData.credits
//       await UserModel.findByIdAndUpdate(userData._id, {creditBalance})
//       await TransactionModel.findByIdAndUpdate(TransactionModel._id, {payment:true})

//       res.json({success:true , message:'Credits Added'})
//     }else{
//       res.json({success:false , message:'Payment Failed'})
//     }

//    } catch (error) {
//     console.log(error)
//     res.json({success:false , message:error.message})
//    }
// }

const verifyRazorpay = async (req, res) => {
  try {
      const { razorpay_order_id } = req.body;

      if (!razorpay_order_id) {
          return res.json({ success: false, message: "Missing Razorpay order ID" });
      }

      const orderInfo = await razorpayInstance.orders.fetch(razorpay_order_id);
      if (orderInfo.status === "paid") {
          const transactionData = await TransactionModel.findById(orderInfo.receipt);
          if (!transactionData) {
              return res.json({ success: false, message: "Transaction not found" });
          }

          if (transactionData.payment) {
              return res.json({ success: false, message: "Payment already processed" });
          }

          const userData = await UserModel.findById(transactionData.userId);
          if (!userData) {
              return res.json({ success: false, message: "User not found" });
          }

          const updatedCreditBalance = (userData.creditBalance || 0) + transactionData.credits;
          await UserModel.findByIdAndUpdate(userData._id, { creditBalance: updatedCreditBalance });
          await TransactionModel.findByIdAndUpdate(transactionData._id, { payment: true });

          res.json({ success: true, message: "Credits Added" });
      } else {
          res.json({ success: false, message: "Payment Failed" });
      }
  } catch (error) {
      console.error(error);
      res.json({ success: false, message: error.message });
  }
};


export { signup, login, userCredits,paymentRazorpay,verifyRazorpay };
