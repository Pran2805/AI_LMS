import app from "./app.js";
import { connectDB } from "./db/index.js";
import router from "./routes/index.js";
import { ENV } from "./utils/env.js";

app.use("/api", router)
const port = ENV.port;

import userRoutes from './routes/user.routes.js';
app.use("/api/users", userRoutes)

import errorHandler from './middlewares/errorHandler.js';
app.use(errorHandler);


app.listen(port, async()=>{
    await connectDB()
    console.log(`Server is running on port: ${port}`)
})