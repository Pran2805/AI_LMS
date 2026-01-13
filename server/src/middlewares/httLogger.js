import pinoHttp from "pino-http"
import logger from "../utils/logger.js"

const httpLogger = pinoHttp({
  logger,
  customLogLevel: (res, err) => {
    if (res.statusCode >= 500 || err) return "error"
    if (res.statusCode >= 400) return "warn"
    return "info"
  },
})

export default httpLogger
