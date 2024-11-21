import {Router} from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import {createPlaylist , getUserPlaylists , updatePlaylist, deletePlaylist , removeVideoFromPlaylist , getPlaylistById , addVideoToPlaylist} from "../controllers/playlist.controller.js"

const router = Router()


router.route("/createPlaylist").post(verifyJWT , createPlaylist )
router.route("/userPlaylists/:userId").get(verifyJWT , getUserPlaylists )
router.route("/deletePlaylist/:playlistId").delete(verifyJWT , deletePlaylist )
router.route("/getPlaylist/:playlistId").get(verifyJWT , getPlaylistById )
router.route("/addVideoToPlaylist/:playlistId/:videoId").patch(verifyJWT , addVideoToPlaylist )
router.route("/deleteVideoToPlaylist/:playlistId/:videoId").delete(verifyJWT , removeVideoFromPlaylist )
router.route("/updatePlaylist/:playlistId").patch(verifyJWT , updatePlaylist)



export default router