import {asyncHandler} from "../utils/asyncHandler.js"
import{ApiError} from "../utils/ApiError.js"
import {User} from "../models/user.model.js"
import {uploadOnCloudinary , deleteImageByUrl} from "../utils/cloudinary.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import  jwt  from "jsonwebtoken"
import mongoose from "mongoose"



const generateAccessTokenAndRefreshTokens = async(userId)=>{
   try {
     const user = await User.findById(userId)
     const AccessToken =  user.generateAccessToken()
     const RefreshToken = user.generateRefreshToken()
     user.refreshToken = RefreshToken
     await user.save({validateBeforeSave: false})
     return {AccessToken , RefreshToken}

   } catch (error) {
      throw new ApiError(500 , "something went wrong while generating AccessToken And RefreshTokens")
   }
}

const registerUser = asyncHandler(async (req , res)=>{
   // get user details from frontend
   //validation - not empty
   //check if user already exists : username , email
   //check for images , check fro avatar
   // upload them to cloudinary , avatar 
   // create user object - create entry in db
   //remove password and refresh  token field from response 
   // check for user creation 
   // return response 

   const {fullname , email , username , password} = req.body
   console.log(fullname , email , username , password)
  const params = req.params
  console.log(params);
  

   // aam zindagi if else condition 
   // if(fullname === ""){
   //    throw new ApiError(400 , "fullname is required");
   // }

   // mentose zindagi if else condition 

   if(
         [fullname , email , username,password].some((field)=> field?.trim()==="")

   ){
      throw new ApiError(400 , "All fields are required")
   }

   
   const existedUser = await User.findOne({
      $or:[{username} , {email}]
   });

   if(existedUser){
         throw new ApiError(409 , "User with email or username already exists")

   }

   console.log(req.files)

 const avatarLocalPath = req.files?.avatar[0]?.path;

 let coverImageLocalPath;

if(req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0 ){
   coverImageLocalPath = req.files.coverImage[0].path
}


 if(!avatarLocalPath){
   throw new ApiError(400 , "Avatar files is required");
 }



const avatar = await uploadOnCloudinary(avatarLocalPath)
const coverImage= await uploadOnCloudinary(coverImageLocalPath)

if (!avatar) {
   throw new ApiError(400, "Avatar file is required")
}


const user = await User.create({
   fullname,
   avatar: avatar.url,
   coverImage: coverImage?.url || "",
   email, 
   password,
   username: username.toLowerCase()
})

const createdUser = await User.findById(user._id).select(
   "-password -refreshToken"
)

if (!createdUser) {
   throw new ApiError(500, "Something went wrong while registering the user")
}

return res.status(201).json(
   new ApiResponse(200, createdUser, "User registered Successfully")
)

} )

const loginUser =  asyncHandler(async (req , res)=>{
   // get user details from frontend
   //check if user already exists : username , email 
   //passwork check
   //check access token match or not 
   // send cookies to the user 

   const { email , username , password} = req.body
   console.log(username);

   if(!(username || email)){
      throw new ApiError(400 , "username or password is required")
   }

    const userdata = await User.findOne({
     $or:[{username} , {email}] 
   })

   if(!userdata){
      throw new ApiError(400 , "User does not exist") 
   }

  const isPasswordValid =  await userdata.isPasswordCorrect(password)

  if(!isPasswordValid){
   throw new ApiError(401 , "password is incorrect")
  }
   
const {AccessToken , RefreshToken} = await generateAccessTokenAndRefreshTokens(userdata._id)

const loggedInUser = await User.findById(userdata._id).select("-password -refreshToken")

const options = {
   httpOnly : true,
   secure :true
}

return res
.status(200)
.cookie("accessToken" , AccessToken , options)
.cookie("RefreshToken" , RefreshToken)
.json(
   new ApiResponse(
      200,
      {
         user:loggedInUser , AccessToken , RefreshToken
      },

      "User logged in succesfully"
   )
)

})


const logoutUser = asyncHandler(async (req , res)=>{
      await User.findByIdAndUpdate(
         req.user._id,
         {
            $unset:{
               refreshToken:1 // this removes the field from document
            }
         },{
            new:true
         }
      )

      const options = {
         httpOnly : true,
         secure :true
      }

      return res 
      .status(200)
      .clearCookie("accessToken" , options)
      .clearCookie("RefreshToken" , options)
      .json(new ApiResponse(200 , {} , "user logged out"))
})

const refreshAccessToken = asyncHandler(async (req , res)=>{

   const incomingRefreshToken = req.cookies.RefreshToken || req.body.refreshToken

 if(!incomingRefreshToken){

   throw new ApiError(401 ,  "unauthorized refresh token")
 }

 try {
       const decodedToken =  jwt.verify(
           incomingRefreshToken ,
            process.env.REFRESH_TOKEN_SECRET
        )
  
     const user = await User.findById(decodedToken?._id)
  
     if(!user){
        throw new ApiError(401 ,  "invalid refresh token ")
      }
  
      if(incomingRefreshToken !== user?.refreshToken){
        throw new ApiError(401 , "Refresh token is expired or used ")
      }
  
      const options = {
        httpOnly : true,
        secure :true
     }
  
     const {AccessToken , RefreshToken} = await generateAccessTokenAndRefreshTokens(user._id)
  
     return res 
     .status(200)
     .cookie("accessToken" , AccessToken , options)
     .cookie("refreshToken" , RefreshToken , options)
     .json(
        new ApiResponse(200 , {AccessToken ,RefreshToken} , "AcessToken refreshed" )
     )
 } catch (error) {
   throw new ApiError(401 , error?.message , "Invalid refresh token ")
 }




})



const changeCurrentPassword = asyncHandler(async (req , res)=>{
      const {oldPassword , newPassword , confPassword }  = req.body

      if(!(newPassword === confPassword)){
         throw new ApiError(400 , "please re Enter confirm password")
      }

      const user = await User.findById(req.user?._id)
      const isPasswordCorrect = await user.isPasswordCorrect(oldPassword)

   
      if(!isPasswordCorrect){
         throw new ApiError(401 , "password incorrect")
      }

      user.password = newPassword
      await user.save({validateBeforeSave:false})

      return res
      .status(200)
      .json(new ApiResponse(200 , {} ," password changes successfuly "))




})

const getCurrentUser = asyncHandler(async (req , res)=>{
   return res
   .status(200)
   .json( new ApiResponse (200 , req.user , "current user fetched"))
})


const updateAccountDetails = asyncHandler(async(req , res)=>{
      const {fullname , email  } = req.body

      if(!(fullname || email)){
         throw new ApiError(400 , "fullname and email is required")
      }

      const user =  await User.findByIdAndUpdate(
         req.user?._id, 
         {
            $set:{
               fullname,
               email
            }
         },
         {new:true}

      ).select("-password")

      return res
      .status(200)
      .json(new ApiResponse(200 , user , " Account details updated successfully "))

})


const updateUserAvatar = asyncHandler(async(req , res)=>{
   const avatarLocalPath = req.file?.path

   if(!avatarLocalPath){
      throw new ApiError(400 , "Avatar file is missing")
   }

   
  const deleteAvatar = await deleteImageByUrl(req.user.avatar);

      if(!deleteAvatar){
         throw new ApiError(400 , "avatar is not deleted")
      }

  const avatar =  await uploadOnCloudinary(avatarLocalPath)

   if(!avatar.url){
      throw new ApiError(400 , "Error while uploading avatar")
   }

   const user = await  User.findByIdAndUpdate(
      req.user?._id, 
      {
         $set:{
            avatar:avatar.url
         }
      },
      {new:true}

   ).select("-password")

   // delete old avatar image 

   return res
      .status(200)
      .json(new ApiResponse(200 , user , " Avatar details updated successfully "))



})


const updateUserCoverImage = asyncHandler(async(req , res)=>{
   const coverImageLocalPath = req.file?.path

   if(!coverImageLocalPath){
      throw new ApiError(400 , "CoverImage file is missing")
   }

  const coverImage =  await uploadOnCloudinary(coverImageLocalPath)

   if(!coverImage.url){
      throw new ApiError(400 , "Error while uploading CoverImage")
   }

   const user = await User.findByIdAndUpdate(
      req.user?._id, 
      {
         $set:{
            coverImage:coverImage.url
         }
      },
      {new:true}

   ).select("-password")


   return res
      .status(200)
      .json(new ApiResponse(200 , user , " coverImage details updated successfully "))



})


const getUserChannelProfile = asyncHandler(async (req , res)=>{
         const {username} = req.params || req.body
         if(!username?.trim()){
            throw new ApiError(400 , "missing username")
         }

         const channel = await User.aggregate([
            {
               $match:{
                  username : username?.toLowerCase()
               }
            },
            {
               $lookup:{
                  from :"subscriptions",
                  localField:"_id",
                  foreignField:"channel",
                  as:"subscribers"
               }
            },
            {
               $lookup:{
                  from :"subscriptions",
                  localField:"_id",
                  foreignField:"subscriber",
                  as:"subscribedTo"
               }

            },
            {
               $addFields:{
                  subscribersCount:{
                     $size:"$subscribers"
                  },

                  channelsSubscribedToCount:{
                     $size:"$subscribedTo"   
                  },

                  isSubscribed : {
                     $cond :{
                        if :{$in : [req.user?._id , "$subscribers.subscriber"]},
                        then:true,
                        else:false
                     }
                  }

               }
            },

            {
               $project:{
                  fullname : 1,
                  username: 1 ,
                  subscribersCount:1,
                  channelsSubscribedToCount:1,
                  isSubscribed:1,
                  avatar:1,
                  coverImage:1,
                  email:1,

               }

            }
         ])


         if(!channel?.length){
            throw new ApiError(404 , "Channel does not exists" )
         }

      console.log(channel)

      return res 
      .status(200)
      .json(new ApiResponse(200 , channel[0] , " user channel fetched successfuly "))
})

const getWatchHistory = asyncHandler(async (req , res)=>{
      const user = await User.aggregate([
         {
            $match:{
               _id:new mongoose.Types.ObjectId(req.user._id)
            }
         },
         {
            $lookup:{
               from :"videos",
               localField:"watchHistory",
               foreignField:"_id",
               as:"watchHistory",
               pipeline:[
                  {
                     $lookup:{
                        from:"users",
                        localField:"owner",
                        foreignField:"_id",
                        as:"owner",

                        pipeline:[
                           {
                              $project:{
                                 fullname:1,
                                 username:1,
                                 avatar:1
                              }
                           }
                        ]
                     }
                  },
                  {
                     $addFields:{
                        owner:{
                           $first:"$owner"
                        }
                     }
                  }
               ]

            }
         }
      ])

      return res 
      .status(200)
      .json(new ApiResponse(200 , user[0].watchHistory , "watch history fetched succesfully"))
})


export {registerUser, loginUser, logoutUser, refreshAccessToken,  updateAccountDetails, changeCurrentPassword, getCurrentUser ,updateUserAvatar ,
   updateUserCoverImage , getUserChannelProfile  , getWatchHistory }