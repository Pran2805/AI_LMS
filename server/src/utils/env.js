import dotenv from 'dotenv'
dotenv.config({quiet: true})

// the value should be there, add those value here
if(!process.env.DATABASE_URL){
    throw new Error("DB url should be required")
}

// add all env files component here so it will be managable and typo will be reduced at crucial time
// i know it will take few minutes but it will reduce too much errors
export const ENV = {
    port: process.env.PORT || 5000,
    logLevel: process.env.LOG_LEVEL || "info",
    dbUrl: process.env.DATABASE_URL
}