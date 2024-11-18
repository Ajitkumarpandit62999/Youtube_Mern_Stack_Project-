import mongoose, {isValidObjectId} from "mongoose"
import {Video} from "../models/video.model.js"
import {User} from "../models/user.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"
import {uploadOnCloudinary , deleteOnCloudinary} from "../utils/cloudinary.js"


const getAllVideos = asyncHandler(async (req, res) => {
    const { page = 1, limit = 10, query, sortBy = 'createdAt', sortType = -1, userId } = req.query;
  
    const options = {
      page: parseInt(page),
      limit: parseInt(limit),
    };
  
    const pipeline = [];
  
    // Search Query
    if (query) {
      pipeline.push({
        $match: {
          $or: [
            { title: { $regex: query, $options: "i" } },
            { description: { $regex: query, $options: "i" } },
          ],
        },
      });
    }
  
    // Filter by userId (owner)
    if (userId) {
      pipeline.push({
        $match: {
          owner: userId,
        },
      });
    }
  
    // Sorting
    if (sortBy) {
      pipeline.push({
        $sort: {
          [sortBy]: parseInt(sortType) || -1, // Default to descending
        },
      });
    }
  
    // Pagination
    pipeline.push(
      { $skip: (options.page - 1) * options.limit },
      { $limit: options.limit }
    );
  
    // Execute Aggregation
    const videoList = await Video.aggregate(pipeline);
  
    if (!videoList) throw new ApiError(400, "Could not fetch videos");
  
    // Pagination Metadata
    const totalVideos = await Video.countDocuments({});
    const totalPages = Math.ceil(totalVideos / options.limit);
  
    return res.status(200).json(new ApiResponse(200, {
      videos: videoList,
      pagination: {
        totalItems: totalVideos,
        totalPages,
        currentPage: options.page,
      },
    }, "Videos fetched successfully"));
  });
  

  const publishAVideo = asyncHandler(async (req, res) => {
    const { title, description } = req.body;
    const initialValue = 0;

    if (!title || !description) {
        throw new ApiError(404, "Title and description are required.");
    }

    if (!req.files || !req.files.videoFile || !req.files.thumbnail) {
        throw new ApiError(400, "Video and thumbnail are required.");
    }

    const videoLocalPath = req.files.videoFile[0]?.path;
    const thumbnailLocalPath = req.files.thumbnail[0]?.path;

    if (!videoLocalPath || !thumbnailLocalPath) {
        throw new ApiError(400, "Video and thumbnail paths are required.");
    }

    let videoFile, thumbnail;
    try {
        videoFile = await uploadOnCloudinary(videoLocalPath);
        thumbnail = await uploadOnCloudinary(thumbnailLocalPath);
    } catch (error) {
        throw new ApiError(500, "Error uploading to Cloudinary");
    }

    if (!videoFile.url || !thumbnail.url) {
        throw new ApiError(500, "Failed to upload video or thumbnail to Cloudinary.");
    }

    const videoDetails = await Video.create({
        videoFile: videoFile.url,
        thumbnail: thumbnail.url,
        title,
        description,
        duration: videoFile.duration,
        isPublished: true,
        owner: req.user._id,
        views: initialValue,
    });

    if (!videoDetails) {
        throw new ApiError(500, "Internal server error: Video details not created.");
    }

    return res
        .status(200)
        .json(new ApiResponse(200, videoDetails, "Published video successfully."));
});


const getVideoById = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    //TODO: get video by id

   if (!videoId) throw new ApiError (400 , "videoId is required");

   const fetchedVideo = await Video.aggregate([
    {
      //find the video on the database
      $match: {
        _id: new mongoose.Types.ObjectId(videoId),
      },
    },

    // //get owner details
    {
      $lookup: {
        from: "users",
        localField: "owner",
        foreignField: "_id",
        as: "videoOwner",
        pipeline: [
          {
            //display username, fullname and avatar of the owner only
            $project: {
              username: 1,
              fullname: 1,
              avatar: 1,
            },
          },
        ],
      },
    },

    //get a list of likes on the video
    {
      $lookup: {
        from: "likes", //you are in "video" and want to get data from "likes"
        localField: "_id",
        foreignField: "video",
        as: "videoLikes",
      },
    },

    // //get a list of comments on the video
    {
      $lookup: {
        from: "comments", //you are in video and want to get from comments
        localField: "_id",
        foreignField: "video",
        as: "videoComments",
      },
    },

    // //add video likes and comments count and if you have liked the video
    {
      $addFields: {
        videoLikesCount: {
          $size: "$videoLikes",
        },
        videoCommentsCount: {
          $size: "$videoComments",
        },
        isLiked: {
          $cond: {
            if: { $in: [req.user?._id, "$videoLikes.likedBy"] },
            then: true,
            else: false,
          },
        },
      },
    },
  ]);
  // console.log(fetchedVideo);

  if (!fetchedVideo) throw new ApiError(404, "Video not found");

  const currentUser = await User.findById(req.user._id);

  if (!currentUser.watchHistory.includes(fetchedVideo[0]._id)) {
    const addVideoToUserWatchHistory = await User.findByIdAndUpdate(
      req.user._id,
      {
        $push: {
          watchHistory: fetchedVideo[0]._id,
        },
      }
    );

    if (!addVideoToUserWatchHistory)
      throw new ApiError(500, "Could not add video to watch history");
  }

  await Video.updateOne(
    {
      _id: new mongoose.Types.ObjectId(videoId),
    },
    {
      $inc: {
        views: 1,
      },
    }
  );

  return res
    .status(200)
    .json(new ApiResponse(200, fetchedVideo, "Video fetched successfully!"));
});
  
  

const updateVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    const {title , description} = req.body

  if(!videoId) throw new ApiError(400 , "video Id not Found ")

  if (!title || !description) throw new ApiError (400 , "tittle and description is required ")

   const thumbnailLocalPath = req.file?.path;

    if (!thumbnailLocalPath) {
        throw new ApiError(400, "Video and thumbnail paths are required.");
    }

    const videoDetail = await Video.findById(videoId)
    console.log(videoDetail.thumbnail)

    const deletedThumbnail = await deleteOnCloudinary(oldThumbnail.thumbnail)

    if (!deletedThumbnail) {
        throw new ApiError(500 , "internal server error can,t delete your old thumbnail before saving new thumbnail")
    }


    const thumbnail = await uploadOnCloudinary(thumbnailLocalPath)

    if (!thumbnail.url) {
        throw new ApiError(500 , "internal server error can,t upload on data base")
    }


  const updatedVideoDetails = await Video.findByIdAndUpdate(videoId ,
       {
        $set:{
          title,
          description,
          thumbnail:thumbnail.url
        },
        
      },
      {
        new:true
      }
)

return res
.status(200)
.json(new ApiResponse(200 , updatedVideoDetails , "video detail updated succesfully "))

  
})

const deleteVideo = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  //TODO: delete video
  if (!videoId) throw new ApiError(400, "Invalid link");

  const deletedVideo = await Video.findByIdAndDelete(videoId);
  if (!deleteVideo)
    throw new ApiError(500, "Something went wrong while deleting the video");

  return res
    .status(200)
    .json(new ApiResponse(200, deletedVideo, "Video Deleted Successfully"));
});


const togglePublishStatus = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    if (!videoId) throw new ApiError(400, "Invalid link");

    const video = await Video.findById(videoId)

    const toggleStatus = await Video.findByIdAndUpdate(videoId , 

      {
        $set:{
          isPublished:!video.isPublished
        }
      },
      {
        new:true
      }
    )

    if (!toggleStatus) {
        throw new ApiError(500 , "something went wrong while togglePublishStatus")
    }

    return res
    .status(200)
    .json(new ApiResponse(200, toggleStatus, "toggeld Successfully"));


})

export {
    getAllVideos,
    publishAVideo,
    getVideoById,
    updateVideo,
    deleteVideo,
    togglePublishStatus
}