import { asyncHandler } from "../utils/asyncHandler.js";
import {ApiError} from "../utils/ApiError.js"
import { User } from "../models/userModel.js";
import {uploadOnCloudinary} from "../utils/cloudinary.js"
import { ApiResponse } from "../utils/ApiResponse.js";

const registerUser = asyncHandler(async (req, res) => {
  
  const {fullname,email,username,password} = req.body
  console.log('email',email)

  if(fullname ===""){
    throw ApiError(400,"fullname is required")
  }
  //another ways 
  if(
    [fullname,email,username,password].some((field) => field?.trim() ==="")
  ){
    throw new ApiError(400,"all field is required")
  }
  const exsitingUser = User.findOne({
    $or:[{username},{email}]
  })
  if(exsitingUser){
    throw new ApiError(409,"user with email and username already exist")
  }
  const avatarLocalPath = req.files?.avatar[0]?.path
  const coverImageLocalPath = req.files?.coverImage[0]?.path;

  if(!avatarLocalPath){
      throw new ApiError(400,"Avatar file is required")
  }

  const avatar =  await uploadOnCloudinary(avatarLocalPath)
  const coverImage = await uploadOnCloudinary(coverImageLocalPath)

  if(!avatar){
    throw new ApiError(400,"Avatar file is required")
  }

const user = await User.create({
    fullname,
    avatar : avatar.url,
    coverImage:coverImage?.url  || "",
    email,
    username:username.toLowerCase(),
    password
  })

  const createdUser = await User.findById(user._id).select(
    "-password -refreshToken "
  )
  if(!createdUser){
    throw new ApiError(500,"something went wrong while registration")
  }
  return res.status(201).json(
    new ApiResponse(200,createdUser,"user registered succesfully",)
  )

});

export { registerUser };


//step to follow for the USER registration
//get user detail from frontend 
//validation not empty
//check if user is alredy exist
//check for the check for avator
//upload them to cloudinary
// create user object create entry in db 
//remove password and token field from response 
//check for user creation 
//return response
