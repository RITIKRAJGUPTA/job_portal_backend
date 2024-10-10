import { catchAsyncError } from "./catchAsyncError.js";
import ErrorHandler from "./error.js";
import jwt from "jsonwebtoken";
import { User} from "../models/userSchema.js"

export const isAuthenticated = catchAsyncError(async(req, re, next) => {
    const {token} = req.cookies
    if(!token){
        return next(new ErrorHandler("user is not authenitcated /middlerware/auth.js", 400))
    }
    const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY)

    req.user = await User.findById(decoded.id)

    next();
});

export const isAuthorized = (...roles) => {
    return (req, res, next) => {
      if (!roles.includes(req.user.role)) {
        return next(
          new ErrorHandler(
            `${req.user.role} not allowed to access this resource.`
          )
        );
      }
      next();
    };
  };