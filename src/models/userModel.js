import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
    {
        name:{
            type:String,required:true,
        },

        email:{
            type:String,required:true,unique:true,
        },

        password:{
            type:String,required:true,
        },

        avatar:{
            type:String,default:"",
        },

        role:{
            type:String,enum:["admin","employee"],default:"employee",
        },

        jobTitle:{
            type:String,default:"",
        },

        department:{
            type:String,default:"",
        },

        isActive:{
            type:Boolean,default:true,
        },
    }, {
        timestamps:true,
    });


    const userModel = mongoose.models.user || mongoose.model('User',userSchema);

export default userModel;