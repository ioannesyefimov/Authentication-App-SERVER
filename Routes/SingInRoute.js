import express from 'express'
import * as dotenv from "dotenv"
import  verifyGoogleToken  from '../SocialAuth/googleAuth.js'
import { DB } from '../server.js'

import jwt from 'jsonwebtoken'

dotenv.config();
 

const router = express.Router()

export default router
