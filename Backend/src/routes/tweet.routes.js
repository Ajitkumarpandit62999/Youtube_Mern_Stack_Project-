import {Router} from "express";
import { createTweet , deleteTweet, getUserTweets , updateTweet } from "../controllers/tweet.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";



const router = Router()

router.route("/createTweet").post( verifyJWT, createTweet)
router.route("/userTweets").get( verifyJWT , getUserTweets)
router.route("/updateTweet/:tweetId").patch(verifyJWT , updateTweet)
router.route("/deleteTweet/:tweetId").delete(verifyJWT , deleteTweet)

export default router