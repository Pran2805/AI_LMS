import { Router } from "express";
import { rateLimiterMiddleware } from "../middlewares/rateLimiter.middleware.js";
import documentRouter from './document.route.js'
const app = Router();

// add all routes below
// eg. app.use("/api/users", userRouter)
app.use("/v1", rateLimiterMiddleware)

// todo: add all the api belows
app.use("/v1/documents", documentRouter)

export default app;