import express from 'express'
import * as dotenv from 'dotenv'
import cors from 'cors'
import bodyParser from 'body-parser'
dotenv.config()

import {  GoogleRoute, GitHubRoute, UserDataRoute, RegisterRoute, SignInRoute, TokenRoute} from './Routes/index.js'
import connectDB from './MongoDb/connect.js'
const app = express();

app.use(
    cors()
)
app.use(bodyParser.json())

app.use(express.json({limit: '50mb'}));
app.use(express.json())


app.use('/api/auth/register', RegisterRoute)
app.use('/api/auth/signin', SignInRoute)

app.use('/api/auth/github', GitHubRoute)
app.use('/api/auth/google', GoogleRoute)
app.use('/api/auth/user', UserDataRoute)

app.use("/api/auth/token", TokenRoute)

const PORT = process.env.PORT || 5050

const StartServer = async ()=>{
    try {
        connectDB(process.env.MONGODB_URL);
        app.listen(PORT, () => console.log(`Server is running on port ${PORT} `))

    } catch (error) {
        console.log(error)
    }
}

StartServer()


