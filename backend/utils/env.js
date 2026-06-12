import dotenv from "dotenv"
dotenv.config()

const variables = {
    PORT : process.env.PORT,
    DATABASE_URL : process.env.DATABASE_URL
}

export default variables
