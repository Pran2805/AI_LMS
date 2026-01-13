import app from "./app.js";
import { connectDB } from "./db/index.js";
import { ENV } from "./utils/env.js";


const port = ENV.port;
app.listen(port, async()=>{
    await connectDB()
    console.log(`Server is running on port: ${port}`)
})