import app from "./app.js";
import { connectDB } from "./db/index.js";
import router from "./routes/index.js";
import { ENV } from "./utils/env.js";
import userRoutes from './routes/user.routes.js';
import errorHandler from './middlewares/errorHandler.js';

const port = ENV.port;

app.use("/api/users", userRoutes)
app.use("/api", router)

app.use(errorHandler);


app.listen(port, async()=>{
    await connectDB()
    console.log(`Server is running on port: ${port}`)
})