class ErrorHandler extends Error{
    constructor(message, statusCode){
         super(message);
         this.statusCode = statusCode
    }
}

export const errorMidleware = (err, req, res, next) => {
    err.statusCode = err.statusCode || 500;
    err.message = err.message || "internal server error in error.js";

    if(err.name === "CastError"){
        const message = `Invalid ${err.path}`;
        err = new ErrorHandler(message, 400)
    }

    if(err.code === 11000){
        const message = `Duplicate ${Object.keys(err.keyValue)} entered in middeware/error.js`
        err = new ErrorHandler(message, 400)
    }

    if(err.name === "JsonwebTokenError"){
        const message = `json web token is invalid, try again middleware/error.js`;
        err = new ErrorHandler(message, 400)
    }

    if(err.name === "TokenExpiredError"){
        const message = `json web token is expired , try again middleware/error.js`;
        err = new ErrorHandler(message, 400)
    }

    return res.status(err.statusCode).json({
        success: false,
        message: err.message,
        
    })
}

export default ErrorHandler