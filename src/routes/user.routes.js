import {Router} from "express";
import { registerUser } from "../controllers/user.controller.js";
import { loginUser } from "../controllers/user.controller.js";
import { logoutUser , refreshAccessToken } from "../controllers/user.controller.js";
import {upload} from "../middlewares/mullter.middleware.js"
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router()

router.route("/register").post( 
    
    upload.fields([
    { name:"avatar", maxCount:1 },
    
    {  name:"coverImage", maxCount:1 }
]),

registerUser)

router.route("/login").post(loginUser)

//secured routes 
router.route("/logout"). post( verifyJWT ,logoutUser)
router.route("/refresh-Token").post(refreshAccessToken)


export default router