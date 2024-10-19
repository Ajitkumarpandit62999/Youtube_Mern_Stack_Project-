import connectDB from "./database/connect.js";
import dotenv from "dotenv"
import {app} from "./app.js"

dotenv.config({
    path:'./env'
})

connectDB()
.then(()=>{
    app.listen(process.env.PORT || 4000 , ()=>{
        console.log(`Server is listening from port : ${process.env.PORT}`)
    })

    app.on("error in app" , (err)=>{
        console.log("error" , err);
    })
})
.catch((err)=>{
    console.log("Mongodb connection  failed !!! " , err)
})

