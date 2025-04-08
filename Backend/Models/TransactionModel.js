import mongoose from 'mongoose';
const Schema=mongoose.Schema;

const TransactionSchema=new Schema({
    userId:{
        type:String,
        required:true,
    },
    plan:{
        type:String,
        required:true,
    },
    amount:{
        type: Number,
        required:true,
    },
    credits:{
        type:Number,
        required:true,
    },
    payment:{
        type:Boolean,
        default:false,
    },
    date:{
        type:Number,
    }
});

const TransactionModel=mongoose.models.Transaction  || mongoose.model('Transaction',TransactionSchema);
export default TransactionModel