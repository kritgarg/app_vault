import dotenv from "dotenv"
dotenv.config()

const variables = {
    PORT : process.env.PORT,
    DATABASE_URL : process.env.DATABASE_URL,
    BETTER_AUTH_SECRET:process.env.BETTER_AUTH_SECRET
}

export default variables
