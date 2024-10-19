import connectDB from "./database/connect.js";
import dotenv from "dotenv"

dotenv.config({
    path:'./env'
})

connectDB()

