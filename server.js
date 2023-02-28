import express from 'express'
import * as dotenv from 'dotenv'
import cors from 'cors'
import bodyParser from 'body-parser'


import {  GoogleRoute, GitHubRoute} from './Routes/index.js'
export let DB = []
const app = express();

app.use(
    cors()
)
app.use(bodyParser.json())

app.use(express.json())

app.use(express.json({limit: '50mb'}));

// app.use('/api/auth/register', RegisterRoute)
// app.use('/api/auth/signin', SignInRoute)

app.use('/api/auth/github', GitHubRoute)
app.use('/api/auth/google', GoogleRoute)



const PORT = process.env.PORT || 5050

app.listen(PORT, () => console.log(`Server is running on ${PORT} `))