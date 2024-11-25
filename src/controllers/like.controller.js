import mongoose, {isValidObjectId} from "mongoose"
import {Like} from "../models/like.modal.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"
import {Video} from "../models/video.model.js"
import {Comment} from "../models/comment.modal.js"
import { Tweet } from "../models/tweet.modal.js"


const toggleVideoLike = asyncHandler(async (req, res) => {
    const {videoId} = req.params
    let message
    //TODO: toggle like on video
    if (!videoId) {
        throw new ApiError(400 , "Invalid Link")
    }
    const fetchedVideo = await Video.findById(videoId);
    if (!fetchedVideo) throw new ApiError(404, "Video not found");

    const isLikedToVideo = await Like.findOne(
        {
         likedBy: req.user._id,
         video: new mongoose.Types.ObjectId(videoId),
        },
        {
          new: true,
        }
      );

      if (isLikedToVideo) {
        await Like.findByIdAndDelete(isLikedToVideo._id);
        message = "Video unliked successfully";
      }

       else {
        const LikedToVideo = await Like.create({
          likedBy: req.user._id,
          video: new mongoose.Types.ObjectId(videoId),  
     });

     if (!LikedToVideo) throw new ApiError(500, "Failed to like video");

     message = "Video liked successfully";

    }

  return res
  .status(200)
  .json(new ApiResponse (200 ,fetchedVideo , message ))

})

const toggleCommentLike = asyncHandler(async (req, res) => {
    const {commentId} = req.params
    //TODO: toggle like on comment
    let message
    //TODO: toggle like on video
    if (!commentId) {
        throw new ApiError(400 , "Invalid Link")
    }
    const fetchedComment = await Comment.findById(commentId);
    if (!fetchedComment) throw new ApiError(404, "Comment not found");

    const isLikedToComment = await Like.findOne(
        {
         likedBy: req.user._id,
         comment: new mongoose.Types.ObjectId(commentId),
        },
        {
          new: true,
        }
      );

      if (isLikedToComment) {
        await Like.findByIdAndDelete(isLikedToComment._id);
        message = "Comment unliked successfully";
      }

       else {
        const LikedToComment = await Like.create({
          likedBy: req.user._id,
          comment: new mongoose.Types.ObjectId(commentId),  
     });

     if (!LikedToComment) throw new ApiError(500, "Failed to like Comment");

     message = "Comment liked successfully";

    }

  return res
  .status(200)
  .json(new ApiResponse (200 , fetchedComment , message))

})

const toggleTweetLike = asyncHandler(async (req, res) => {
    const {tweetId} = req.params
    //TODO: toggle like on tweet

    let message
    //TODO: toggle like on video
    if (!tweetId) {
        throw new ApiError(400 , "Invalid Link")
    }
    const fetchedTweet = await Tweet.findById(tweetId);
    if (!fetchedTweet) throw new ApiError(404, "Tweet not found");

    const isLikedToTweet = await Like.findOne(
        {
         likedBy: req.user._id,
         tweet: new mongoose.Types.ObjectId(tweetId),
        },
        {
          new: true,
        }
      );

      if (isLikedToTweet) {
        await Like.findByIdAndDelete(isLikedToTweet._id);
        message = "Tweet unliked successfully";
      }

       else {
        const isLikedToTweet = await Like.create({
          likedBy: req.user._id,
          tweet: new mongoose.Types.ObjectId(tweetId),  
     });

     if (!isLikedToTweet) throw new ApiError(500, "Failed to like Tweet");

     message = "Tweet liked successfully";

    }

  return res
  .status(200)
  .json(new ApiResponse (200 , fetchedTweet , message))

}
)

const getLikedVideos = asyncHandler(async (req, res) => {
    //TODO: get all liked videos
    const allLikedVideos = Video.aggregate([
      {
        
      }
    ])
})

export {
    toggleCommentLike,
    toggleTweetLike,
    toggleVideoLike,
    getLikedVideos
}