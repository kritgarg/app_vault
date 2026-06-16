import express from "express"
import cors from "cors"
import { toNodeHandler } from "better-auth/node"
import { auth } from "./utils/auth.js"
import variables from "./utils/env.js"
import { prisma } from "./utils/prisma.js"
import cardRouter from "./routes/card.routes.js"
import passwordRouter from "./routes/password.routes.js"
import searchRouter from "./routes/search.routes.js"
import documentRouter from "./routes/document.routes.js"
import dashboardRouter from "./routes/dashboard.routes.js"

const app = express()

app.use(cors({ origin: true, credentials: true }))
app.all("/api/auth/*any", toNodeHandler(auth))

app.use(express.json())

app.use("/cards", cardRouter)
app.use("/passwords", passwordRouter)
app.use("/search", searchRouter)
app.use("/documents", documentRouter)
app.use("/dashboard", dashboardRouter)

app.get("/",(req,res)=>{
    res.send("server running congo my friends")
})

app.post("/login",async (req,res)=>{
    const {name,email } = req.body

    if (!name || !email){
        return res.status(401).json({error:"all fields are required"})
    }

    const alreadypresent = await prisma.user.findUnique({
        where : {
            email
        }
    })

    if (alreadypresent) {
        return res.status(409).json({error:"Email already exists"})
    }
    
    try{
        await prisma.user.create({
            data : {
                name,
                email
            }
        })
        return res.status(201).json({message:"user created" , "data" : {name,email}})
    }catch(err){
        console.error(err)
        return res.status(500).json({error:"internal server error"})
    }

})

app.listen(variables.PORT, () =>{
    console.log(`Server is running on port ${variables.PORT}`)
})