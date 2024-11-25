import mongoose, {isValidObjectId, Types} from "mongoose"
import {User} from "../models/user.model.js"
import { Subscription } from "../models/subscription.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"


const toggleSubscription = asyncHandler(async (req, res) => {
    const { channelId } = req.params;
    let message
    // TODO: toggle subscription
    if (!channelId) throw new ApiError(400, "Invalid Channel Link");
  
    const fetchedChannel = await User.findById(channelId);
    if (!fetchedChannel) throw new ApiError(404, "Channel not found");
  
    const isSubscribedToChannel = await Subscription.findOne(
      {
        subscriber: req.user._id,
        channel: new mongoose.Types.ObjectId(channelId),
      },
      {
        new: true,
      }
    );
    if (isSubscribedToChannel) {
      await Subscription.findByIdAndDelete(isSubscribedToChannel._id);
      message="unsubscribed sucessfully"
    } else {
      const subscribeToChannel = await Subscription.create({
        subscriber: req.user._id,
        channel: new mongoose.Types.ObjectId(channelId),
      });
      if (!subscribeToChannel)
        throw new ApiError(500, "Failed to subscribe to channel");
      message="Successfully subscribed"

    }
  
    return res.status(200).json(
      new ApiResponse( 200 , fetchedChannel , message )
    );
  });
  

// controller to return subscriber list of a channel
const getUserChannelSubscribers = asyncHandler(async (req, res) => {
    const {channelId} = req.params
    if (!channelId) {
      throw new ApiError(400 , "Invalid link")
    }

    const allSubscriber = await Subscription.aggregate([
      {
        $match:{
          channel:new mongoose.Types.ObjectId(channelId)
        }
      },
      {
        $lookup:{
          from:"users",
          localField:"subscriber",
          foreignField:"_id",
          as:"channelSubscribers",

          pipeline:[
          {
              $project:{
                fullname:1,
                username:1,
                avatar:1,
              }

          }

          ]

        }
      },
      {
        $addFields:{
          channelSubscriberCount: {
            $size: "$channelSubscribers",
          },

        }

      }

    ])

    if(!allSubscriber) throw new ApiError(500 , " internal server error subscriber not found ")

    return res
    .status(200)
    .json(new ApiResponse(200 , allSubscriber , "allSubscriber found sucessfully"))

})

// controller to return channel list to which user has subscribed
const getSubscribedChannels = asyncHandler(async (req, res) => {
    const { subscriberId } = req.params
    if (!subscriberId) {
      throw new ApiError(400 , "Invalid link")
    }

    const SubscribedChannels = await Subscription.aggregate([
      {
        $match:{
            subscriber:new mongoose.Types.ObjectId(subscriberId)
        }
      },
      {
        $lookup:{
          from:"users",
          localField:"channel",
          foreignField:"_id",
          as:"SubscribedChannels",

          pipeline:[
          {
              $project:{
                fullname:1,
                username:1,
                avatar:1,
              }

          }

          ]

        }
      },
      {
        $addFields:{
          channelSubscriberCount: {
            $size: "$SubscribedChannels",
          },

        }

      }

    ])

    if(!SubscribedChannels) throw new ApiError(500 , " internal server error subscriber not found ")

    return res
    .status(200)
    .json(new ApiResponse(200 , SubscribedChannels , "allSubscriber found sucessfully"))

})

export {
    toggleSubscription,
    getUserChannelSubscribers,
    getSubscribedChannels
}