import mongoose from "mongoose";
import {DB_Name} from"../constants.js";

const connectDB = async() =>{
try {

    const connectionInstance = await mongoose.connect(`${process.env.MONGODB_URI}/${DB_Name}?retryWrites=true&w=majority`)

    console.log(`\n MonogoDB connected !! DB HOST : ${connectionInstance.connection.host}`)
    
} catch (error) {
    console.error(" Mongodb connection error" , error);
    process.exit(1);
}

}

export default connectDB