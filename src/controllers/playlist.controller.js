import mongoose, {isValidObjectId, Types} from "mongoose"
import {PlayList} from "../models/playlist.modal.js"
import {Video} from "../models/video.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"


const createPlaylist = asyncHandler(async (req, res) => {
    const {name, description} = req.body
    //TODO: create playlist

    if (!name || !description) {
        throw new ApiError(400 , "please give name and description")
    }

    const newPlaylist = await PlayList.create({
        name,
        description,
        owner:req.user._id,
        playListVideos:[]

    })

    if (!newPlaylist) {
        throw new ApiError(500 , " internal server error cant create a playlist");
    }

    return res
    .status(200)
    .json(new ApiResponse(200 , newPlaylist , "playlist created successfully"));

})

const getUserPlaylists = asyncHandler(async (req, res) => {
    const {userId} = req.params

    //TODO: get user playlists
    if (!userId) {
        throw new ApiError(400 , "Invalid link")
    }

    const AllPlaylists  = await PlayList.aggregate([
        {
            $match:{
               owner:new mongoose.Types.ObjectId(userId)
            }
        },

    ]);
    

    return res
    .status(200)
    .json(new ApiResponse(200 , AllPlaylists , "AllPlaylist fetched sucessfully"));
})

const getPlaylistById = asyncHandler(async (req, res) => {
    const {playlistId} = req.params
    //TODO: get playlist by 
    if (!playlistId) {
        throw new ApiError(400 , "invalid Link")
    }

    const fetchPlaylist = await PlayList.aggregate([
        {
            $match:{
                _id:new mongoose.Types.ObjectId(playlistId)
            }
        },
        {
            $lookup:{
                from:"videos",
                localField:"playListVideos",
                foreignField:"_id",
                as:"playListVideos",

                pipeline:[
                    {
                        $lookup:{
                            from:"users",
                            localField:"owner",
                            foreignField:"_id",
                            as:"VideoOwner",

                            pipeline:[
                                {
                                    $project:{
                                        username:1,
                                        fullname:1
                                    }
                                }
                            ]
                        }

                    }

                ]
            }
        },

        {
            $addFields:{
                playListVideoCount : {
                    $size:"$playListVideos"
                }
            }
        }

    ])

    if (!fetchPlaylist) {
        throw new ApiError(400 , "internal server error playlist not found")
    }

    return res 
    .status(200)
    .json(new ApiResponse(200 , fetchPlaylist , "playlist found sucessfully"))


})


const addVideoToPlaylist = asyncHandler(async (req, res) => {
    const { playlistId, videoId } = req.params;
    if (!playlistId || !videoId)
      throw new ApiError(404, "Playlist ID or Video ID is missing");
  
    const fetchedVideo = await Video.findById(videoId);
    if (!fetchedVideo) throw new ApiError(404, "Requested video not found");
  
    const fetchedPlaylist = await PlayList.findById(playlistId);
    if (!fetchedPlaylist) throw new ApiError(404, "Playlist not found");
  
    if (!fetchedPlaylist.playListVideos.includes(fetchedVideo._id)) {
      const videoAddedToPlaylist = await PlayList.findByIdAndUpdate(
        playlistId,
        {
          $push: {
            playListVideos: fetchedVideo,
          },
        },
        {
          new: true,
        }
      );
  
      if (!videoAddedToPlaylist)
        throw new ApiError(500, "Could not add the video to the playlist");
    }
  
    return res.status(200).json(
      new ApiResponse(
        200,
        {
          "Video added to the playlist: ": fetchedVideo,
        },
        "Video added to the playlist successfully!"
      )
    );
  });
  

const removeVideoFromPlaylist = asyncHandler(async (req, res) => {
    const {playlistId, videoId} = req.params
    // TODO: remove video from playlist
    if (!playlistId || !videoId)
        throw new ApiError(404, "Playlist ID or Video ID is missing");
    
    if (!videoId) throw new ApiError(404, "Requested video not found");

    if (!playlistId) throw new ApiError(404, "Playlist not found");

    const videoRemovedPlaylist = await PlayList.findByIdAndUpdate(
        playlistId,
        {
          $pull: {
            playListVideos: new mongoose.Types.ObjectId(videoId),
          },
        },
        {
          new: true,
        }
      );

    return res.status(200).json(
        new ApiResponse(
          200,
          {
            "Video Deleted to the playlist: ": videoRemovedPlaylist,
          },
          "Video removed to the playlist successfully!"
        )
      );



})

const deletePlaylist = asyncHandler(async (req, res) => {
    const { playlistId } = req.params;
    // TODO: delete playlist
  
    if (!playlistId || !isValidObjectId(playlistId))
      throw new ApiError(400, "Invalid playlist id");
  
    const deletedPlaylist = await PlayList.findByIdAndDelete(playlistId);
  
    if (!deletedPlaylist)
      throw new ApiError(500, "Could not delete the playlist");
  
    return res
      .status(200)
      .json(
        new ApiResponse(200, deletedPlaylist, "Playlist deleted successfully!")
      );
  });

const updatePlaylist = asyncHandler(async (req, res) => {
    const {playlistId} = req.params
    const {name, description} = req.body
    //TODO: update playlist
       if(!playlistId) throw new ApiError(400 , "Inavlid link")
       if(!name || !description) throw new ApiError(400 , "please send name and description")
    const updatePlaylistDetails = await PlayList.findByIdAndUpdate(playlistId ,
         {
            $set:{
                name:name,
                description:description
            }
         },
         {
            new:true
         }
        
    );

    if (!updatePlaylistDetails) {
        throw new ApiError(500 , "Internal server error cant update details")
    }

    return res
    .status(200)
    .json(new ApiResponse(200 , updatePlaylistDetails , "playlist updated succesfully"))

})

export {
    createPlaylist,
    getUserPlaylists,
    getPlaylistById,
    addVideoToPlaylist,
    removeVideoFromPlaylist,
    deletePlaylist,
    updatePlaylist
}