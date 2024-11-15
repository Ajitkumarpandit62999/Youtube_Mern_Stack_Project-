import mongoose, { isValidObjectId } from "mongoose"
import {Tweet} from "../models/tweet.modal.js";
import {User} from "../models/user.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"

const createTweet = asyncHandler(async (req, res) => {
    // get user details from frontend

     const newTweet = await Tweet.create({
           content:req.body.tweet,
           owner:req.user._id 

     })

     if (!newTweet) {
        throw new ApiError(500, "Tweet is not created")
     }
     
     return res.status(201).json(
        new ApiResponse(200, newTweet , "tweet created succesfully")
     )
     
 } )

 const getUserTweets = asyncHandler(async (req, res) => {
    // TODO: get user tweets
    const userTweets = await Tweet.aggregate([
      {
        $match: {
          owner: req.user._id,
        },
      },
      {
        $lookup: {
          from: "likes",
          localField: "_id",
          foreignField: "tweet",
          as: "tweetLikes",
        },
      },
      {
        $addFields: {
          tweetLikes: {
            $size: "$tweetLikes",
          }
        },
      },
    ]);

    if (!userTweets) throw new ApiError(400, "Could not fetch user tweets");
  
    return res
      .status(200)
      .json(new ApiResponse(200, userTweets, "User tweets fetched successfully"));
  });

  
const updateTweet = asyncHandler(async (req, res) => {
    //TODO: update tweet
})

const deleteTweet = asyncHandler(async (req, res) => {
    //TODO: delete tweet
})

export {
    createTweet,
    getUserTweets,
    updateTweet,
    deleteTweet
}