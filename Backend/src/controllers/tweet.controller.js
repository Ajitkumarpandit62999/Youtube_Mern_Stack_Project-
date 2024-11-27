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
        $lookup: {
          from: "users",
          localField: "owner",
          foreignField: "_id",
          as: "TweetOwner",
          pipeline: [
            {
              $project: {
                fullname: 1,
                username: 1,
                avatar: 1,
              },
            },
          ]
        },
      },
      {
        $lookup: {
          from: "likes",
          localField: "_id",
          foreignField: "tweet",
          as: "TweetLikes",
          pipeline: [
            {
              $project: {
                likedBy: 1,
              },
            },
            {
              $lookup: {
                from: "users",
                localField: "likedBy",
                foreignField: "_id",
                as: "TweetLikedByUsers",
                pipeline: [
                  {
                    $project: {
                      fullname: 1,
                      username: 1,
                      avatar: 1,
                    },
                  },
                ],
              },
            },
          ],
        },
      },
      {
        $addFields: {
          tweetLikes: {
            $size: "$tweetLikes",
          },
          hasUserLikedTweet: {
            $cond: {
              if: { $in: [req.user?._id, "$TweetLikes.likedBy"] },
              then: true,
              else: false,
            },
          },
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
    const  {tweetId}  = req.body
    console.log(tweetId);
    
    if (!tweetId) throw new ApiError(404, "Invalid Tweet Link");
  
    const updatedTweet = await Tweet.findByIdAndUpdate(
      tweetId,
      {
        $set: {
          content: req.body.content,
        },
      },
      {
        new: true,
      }
    );
    if (!updatedTweet) throw new ApiError(400, "Could not update tweet");
  
    return res
      .status(200)
      .json(new ApiResponse(200, updatedTweet, "Tweet updated successfully!"));
  });

const deleteTweet = asyncHandler(async (req, res) => {
    //TODO: delete tweet
    const { tweetId } = req.params;
    console.log(tweetId);
    
    if (!tweetId) throw new ApiError(404, "Invalid Tweet Link");

    const deletedTweet = await Tweet.findByIdAndDelete(tweetId)

    if (!deletedTweet) {
      throw new ApiError(500 , "internal server erorr can,t delete this tweet")
    }

    return res
    .status(200)
    .json(new ApiResponse(200 , deletedTweet , "Tweet deleted successfully"))

})

export {
    createTweet,
    getUserTweets,
    updateTweet,
    deleteTweet
}