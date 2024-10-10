import mongoose from "mongoose";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import validator from "validator";

const userSchema = new mongoose.Schema({
    name:{
        type: String,
        required: true,
        minLength: [3, "name must conatin atleast 3 characters. userSchema"],
        maxLength: [30, "name cannot exceed 30 characters. userSchema"],
    },
    email:{
        type: String,
        required: true,
        validate: [validator.isEmail, "Please provide Valid email"]
    },
    phone:{
        type: Number,
        required: true,
    },
    address:{
        type: String,
        required: true,
    },
    niches:{
        firstNiche: String,
        secondNiche: String,
        thirdNiche: String,
    },
    password:{
        type: String,
        required: true,
        minLength: [8, "password must contain 8 characters."],
        maxLength: [32, "password cannot exceed 32 characters."],
        select: false,
    },
    resume:{
        public_id: String,
        url: String,
    },
    coverLetter:{
        type: String
    },
    role:{
        type: String,
        required: true,
        enum: ["Job Seeker", "Employer"]
    },
    createdAt:{
        type: Date,
        default: Date.now
    },
});

userSchema.pre("save", async function(next){
    if(!this.isModified("password")){
        next();
    }
    this.password = await bcrypt.hash(this.password, 10);
});

//comparision of passwords
userSchema.methods.comparePassword = async function(enteredPassword){
    return await bcrypt.compare(enteredPassword, this.password);
}



userSchema.methods.getJWTToken = function(){
    //sign method use to generate a token
    return jwt.sign({id: this._id}, process.env.JWT_SECRET_KEY, {
        expiresIn: process.env.JWT_EXPIRE
    })
}

export const User = mongoose.model('User', userSchema)