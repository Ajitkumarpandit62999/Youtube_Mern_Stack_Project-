import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import {addComment , deleteComment, getVideoComments , updateComment} from "../controllers/comment.controller.js"

const router = Router()

router.route("/:videoId").post(verifyJWT , addComment)
router.route("/:videoId").get(verifyJWT , getVideoComments)
router.route("/:commentId").patch(verifyJWT , updateComment)
router.route("/:commentId").delete(verifyJWT , deleteComment)

export default router