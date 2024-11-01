import {asyncHandler} from "../utils/asyncHandler.js"
import{ApiError} from "../utils/ApiError.js"
import {User} from "../models/user.model.js"
import {uploadOnCloudinary} from "../utils/cloudinary.js"
import {ApiResponse} from "../utils/ApiResponse.js"

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

const loginUser = asyncHandler( async (req ,res)=>{
   // get user details from frontend
   //check if user already exists : username , email 
   //passwork check
   //check access token match or not 
   // send cookies to the user 

   const {username , email , password } = req.body

   if(!username || !email){
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
            $set:{
               refreshToken:undefined
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


export {registerUser , loginUser , logoutUser}