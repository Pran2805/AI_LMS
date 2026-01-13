import mongoose from "mongoose"
import { ENV } from "../utils/env.js"

export const connectDB = async() =>{
    try {
        const connection  = await mongoose.connect(ENV.dbUrl)
        console.log("Database connected successfully!! : ",connection.connection.host)
    } catch (error) {
        console.error("Error while connecting database: ", error?.message)
        process.exit(1)
    }
}