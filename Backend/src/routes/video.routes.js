import { Router } from "express";
import {upload} from "../middlewares/mullter.middleware.js"
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { getAllVideos , publishAVideo , deleteVideo , getVideoById , updateVideo , togglePublishStatus} from "../controllers/video.controller.js"

const router = Router()

router.route("/AllVideos").get( verifyJWT , getAllVideos)

router.route("/publishVideo").post ( verifyJWT,

  upload.fields([
    {
      name: "videoFile",
      maxCount: 1,
    },
    {
      name: "thumbnail",
      maxCount: 1,
    },
  ]),  publishAVideo)

router.route("/:videoId").get(verifyJWT , getVideoById)

router.route("/:videoId").patch(verifyJWT ,  
 upload.single("thumbnail") 
 , updateVideo)

router.route("/:videoId").delete(verifyJWT , deleteVideo)
router.route("/togglePublishStatus/:videoId").patch(verifyJWT , togglePublishStatus)




export default router