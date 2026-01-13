import { RateLimiterMemory } from "rate-limiter-flexible"

const rateLimiter = new RateLimiterMemory({
  points: 20,     
  duration: 60,  
  blockDuration: 60, 
})


export const rateLimiterMiddleware = (req, res, next) => {
  rateLimiter.consume(req.ip)
    .then(() => {
      next()
    })
    .catch(() => {
      res.status(429).json({
        message: "Too many requests, slow down.",
      })
    })
}