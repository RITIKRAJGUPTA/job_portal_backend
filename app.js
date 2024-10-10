import express from "express";
import { config } from "dotenv";
import cors from "cors";
import cookieParser from "cookie-parser";
import {connection} from "./database/connection.js"
import { errorMidleware } from "./middlewares/error.js";
import fileUpload from "express-fileupload";
import userRouter from "./routes/userRouter.js";
import jobRouter from "./routes/jobRouter.js"
import applicationRouter from "./routes/applicationRouter.js"
import { newsLetterCron } from "./automation/newsLetterCron.js";


const app = express();
config({path: "./config/config .env"})



app.use(cors({
   origin: [process.env.FRONTEND_URL],
   methods: ["GET", "POST", "PUT", "DELETE"],
   credentials: true,
})
);

// to gernerate token and access that token in backend
app.use(cookieParser());

//which type of data
app.use(express.json());
app.use(express.urlencoded({extended: true}));

//for file uploading
app.use(fileUpload({
   useTempFiles: true,
   tempFileDir: "./tmp/",
}));


app.use("/api/v1/user", userRouter);
app.use("/api/v1/job", jobRouter);
app.use("/api/v1/application", applicationRouter);

newsLetterCron();

//call conection function
connection();
app.use(errorMidleware)

export default app;