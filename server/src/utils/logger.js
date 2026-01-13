import pino from "pino"
import { ENV } from "./env.js"
import fs from "fs"
import path from "path"

const logDir = path.join(process.cwd(), "logs")

if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir)
}

const fileStream = pino.destination({
  dest: path.join(logDir, "app.log"),
  sync: false, // async = fast, non-blocking
})

const logger = pino({
  level: ENV.logLevel,
},
pino.multistream([
    { stream: process.stdout }, // console
    { stream: fileStream },     // file
  ]))

export default logger
