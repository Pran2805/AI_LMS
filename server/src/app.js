import express from 'express'
import httpLogger from './middlewares/httLogger.js';
import { rateLimiterMiddleware } from './middlewares/rateLimiter.middleware.js';
import morgan from 'morgan'
import helmet from 'helmet'

const app = express()

app.use(httpLogger)
app.use(express.json())
app.use(urlencoded({extended: true}))
app.use(rateLimiterMiddleware)
app.use(helmet())
app.use(morgan("combined"))


// just check logger is working or not
// app.get("/pino", (req, res) => {
//   req.log.info("pino")
//   res.send("pino logger testing")
// })

export default app;