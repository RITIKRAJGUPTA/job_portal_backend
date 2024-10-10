import  {catchAsyncError} from "../middlewares/catchAsyncError.js";
import ErrorHandler from "../middlewares/error.js";
import {User} from  "../models/userSchema.js";
import {v2 as cloudinary} from "cloudinary";
import {sendToken} from "../utils/jwtToken.js";

export const register = catchAsyncError(async(req, res, next ) =>{
    try {
        const {
            name, 
            email, 
            phone, 
            address, 
            password, 
            role, 
            firstNiche, 
            secondNiche, 
            thirdNiche, 
            coverLetter,
        } = req.body;

        if(!name || !email || !phone || !address || !password || !role){
            return next(new ErrorHandler("All feild are required. controllers/userController", 400 ));
        }
        if(role === "Job Seaker" &&  (!firstNiche || !secondNiche || !thirdNiche)){
            return next(new ErrorHandler("please provide your prefered niches. controllers/userController", 400 ));
        }
        const existingUser = await User.findOne({email});
        if(existingUser){
            return next(new ErrorHandler("email already registerd. controllers/userController", 400 ));
        }
        const userData = {
            name, 
            email, 
            phone, 
            address, 
            password, 
            role, 
            niches: {
                firstNiche, 
                secondNiche, 
                thirdNiche,
            },
            coverLetter,
        };

        if(req.files && req.files.resume){
            const {resume} = req.files;
            if(resume){
                try {
                    const cloudinaryResponse = await cloudinary.uploader.upload(resume.tempFilePath,
                        {folder: "Job_Seakers_Resume"}
                    )
                    if(!cloudinaryResponse || cloudinaryResponse.error){
                        return nect(new ErrorHandler("Failed to upload resume to cloud. userController", 500));
                    }
                    userData.resume  = {
                        public_id: cloudinaryResponse.public_id,
                        url: cloudinaryResponse.secure_url
                    }
                } catch (error) {
                   return next (new ErrorHandler("Failed to upload resume",  500)) 
                }
            }
        }

        const user = await User.create(userData);
        sendToken(user, 201, res, "user registered")
    } catch (error) {
        next(error);
    }
});


export const login = catchAsyncError(async(req, res, next) => {
    const {role, email, password} = req.body;
    if(!role || !email || !password){
        return next(new ErrorHandler("email, password and role are required in userController", 400));
    }
    const user = await User.findOne({email}).select("+password");
    if(!user){
        return next(new ErrorHandler("Invalid email and password.   userCON", 400));
    }
    const isPasswordMatched = await user.comparePassword(password);
    if(!isPasswordMatched){
        return next(new ErrorHandler("Invalid email or password. userController", 400))
    }
    if(user.role !== role){
        return next(new ErrorHandler("Invalid user role. userController ", 400));
    }
    sendToken(user, 200, res, "user logged in successfully");
});

export const logout  = catchAsyncError(async(req, res, next) => {
    res.status(200).cookie("token","",{
        expires: new Date(Date.now()),//delete created token or user 
        httpOnly: true,
    }).json({
        success: true,
        message:"Logged out successfully"
    });
});

export const getUser = catchAsyncError(async(req, res, next)=> {
    const user = req.user;
    res.status(200).json({
        success:true,
        user,
    });
});

export const updateProfile = catchAsyncError(async(req, res, next) => {
    const newUserData ={
        name: req.body.name,
        email: req.body.email,
        phone: req.body.phone,
        address: req.body.address,
        coverLetter: req.body.coverLetter,
        niches:{
            firstNiche: req.body.firstNiche,
            secondNiche: req.body.secondNiche,
            thirdNiche: req.body.thirdNiche,
        }
    }

    const {firstNiche,secondNiche,thirdNiche} = newUserData.niches;

    if(req.user.role === "Job Seaker" && (!firstNiche || !secondNiche || !thirdNiche)){
        return next(new ErrorHandler("please provide your all prefered job niches update user", 400));
    }
    if(req.files){
        const resume = req.files.resume;
        if(resume){
            const currentResumeId = req.user.resume.public_id;
            if(currentResumeId){
                await cloudinary.uploader.destroy(currentResumeId);
            }
            const newResume  = await cloudinary.uploader.upload(resume.tempFilePath, {
                folder : "Job_Seakers_Resume"
            });
            newUserData.resume = {
                public_id: newResume.public_id,
                url: newResume.secure_url,
            };
        }
    }
    const user  = await User.findByIdAndUpdate(req.user.id, newUserData, {
        new: true,
        runValidators:true,
        useFindAndModify: false,
    });
    res.status(200).json({
        success:true,
        user,
        message: "profile updated // update secction",
    });
});

export const UpdatePassword = catchAsyncError(async(req, res, next) => {
    const user = await User.findById(req.user.id).select("+password");

    const isPasswordMatched = await user.comparePassword(req.body.oldPassword);

    if(!isPasswordMatched){
        return next(new ErrorHandler("old password id incorrect", 400));
    }

    if(req.body.newPassword !== req.body.confirmPassword){
        return next(new ErrorHandler("new password & confim password do not match.", 400));
    }

    user.password = req.body.newPassword;
    await user.save();
    sendToken(user,200,res,"password updated suucessfully.");
});