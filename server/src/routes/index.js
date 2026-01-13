import { Router } from "express";
import { rateLimiterMiddleware } from "../middlewares/rateLimiter.middleware.js";

const app = Router();

// add all routes below
// eg. app.use("/api/users", userRouter)
app.use("/api", rateLimiterMiddleware)

export default app;