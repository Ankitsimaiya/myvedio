import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/userModel.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import  jwt  from "jsonwebtoken";

const genrateAccessAndRefreshTokens = async (userId) => {
  try {
    
   const user =  await User.findById(userId);

    const accessToken = user.generateAccessToken();
    const refreshToken = user.generateRefreshToken();

    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });

    return { accessToken, refreshToken };
  } catch (error) {
    throw new ApiError(
      500,
      "something went wrong while genrating access and refresh tokens"
    );
  }
};

const registerUser = asyncHandler(async (req, res) => {
  const { fullname, email, username, password } = req.body;
  // console.log('email',email)
  // console.log('fullname',fullname)
  // console.log(req.body)
  // console.log(req.files)

  if (fullname === "") {
    throw ApiError(400, "fullname is required");
  }
  //another ways
  if (
    [fullname, email, username, password].some((field) => field?.trim() === "")
  ) {
    throw new ApiError(400, "all field is required");
  }
  const exsitingUser = await User.findOne({
    $or: [{ username }, { email }],
  });
  if (exsitingUser) {
    throw new ApiError(409, "user with email and username already exist");
  }
  const avatarLocalPath = req.files?.avatar[0]?.path;
  const coverImageLocalPath = req.files?.coverImage?.path;

  // let coverImageLocalPath;
  // if(req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0){
  //   coverImageLocalPath = req.files.coverImage?[0].path
  // }

  if (!avatarLocalPath) {
    throw new ApiError(400, "Avatar file is required");
  }

  const avatar = await uploadOnCloudinary(avatarLocalPath);
  const coverImage = await uploadOnCloudinary(coverImageLocalPath);

  if (!avatar) {
    throw new ApiError(400, "Avatar file is required");
  }

  const user = await User.create({
    fullname,
    avatar: avatar.url,
    email,
    coverImage: coverImage?.url || "",
    username: username.toLowerCase(),
    password,
  });

  const createdUser = await User.findById(user._id).select(
    "-password -refreshToken "
  );
  if (!createdUser) {
    throw new ApiError(500, "something went wrong while registration");
  }
  return res
    .status(201)
    .json(new ApiResponse(200, createdUser, "user registered succesfully"));
});

const loginUser = asyncHandler(async (req, res) => {
  const { email, username, password } = req.body;

  if (!(username || email)) {
    throw new ApiError(400, "username or email is required");
  }

  const user = await User.findOne({
    $or: [{ username }, { email }], //dono me se koi ek mil jaye jo pehle mile wo store ho jae
  });

  if (!user) {
    throw new ApiError(404, "user does not exist");
  }

  // console.log(user.get.isPasswordCorrect)
  const isPasswordValid = await user.isPasswordCorrect(password);

  if (!isPasswordValid) {
    throw new ApiError(401, "Invalid user credential");
  }
  const { accessToken, refreshToken } = await genrateAccessAndRefreshTokens(
    user._id
    );
    console.log(genrateAccessAndRefreshTokens)

  const loggedInUser = await User.findById(user._id).select(
    "-password -refreshToken"
  );

  const option = {
    httpOnly: true,
    secure: true,
  };

  return res
    .status(200)
    .cookie("accessToken", accessToken, option)
    .cookie("refreshToken", refreshToken, option)
    .json(
      new ApiResponse(
        200,
        {
          user: loggedInUser,
          accessToken,
          refreshToken,
        },
        "user logged in succesfully"
      )
    );
});

const logoutUser = asyncHandler(async (req, res) => {
  await User.findByIdAndUpdate(
    req.user._id,
    {
      $set: {
        refreshToken: undefined,
      },
    },
    {
      new: true,
    }
  );
  const option = {
    httpOnly: true,
    secure: true
  }
  return res.status(200).clearCookie("accessToken", option).clearCookie("refreshToken", option).json(
    new ApiResponse(200, {}, "User logged Out")
  )
});

const refreshAccessToken = asyncHandler(async (req,res) => {

  const incomingRefreshtoken = req.cookies.refreshToken || req.body.refreshToken
  
  if (!incomingRefreshtoken){
    throw new ApiError(401,"unathorized request")
  }

 try {
   const decodedToken = jwt.verify(incomingRefreshtoken,process.env.REFRESH_TOKEN_SECRET)
 
   const user =   User.findById(decodedToken?._id)
 
   if(!user){
     throw new ApiError(401,"Invalid refresh token")
   }
   
   if(incomingRefreshtoken !== user?.refreshToken){
     throw new ApiError(401,"refresh token is already used or expired")
   }
   const option = {
     httpOnly:true,
     secure:true
   }
   const {accessToken,newrefreshToken} = await genrateAccessAndRefreshTokens(user._id)
 
   return res
   .status(200)
   .cookie("accessToken",accessToken,option)
   .cookie("refreshToken",newrefreshToken,option)
   .json(
     new ApiResponse(
       200,
       {accessToken,refreshToken:newrefreshToken},
       "Access token refresed successfully"
     )
   )
 } catch (error) {
   throw new ApiError(401,error?.message || "invalid refresh token")
 }

})


export { registerUser, loginUser, logoutUser ,refreshAccessToken};

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

//steps to follow for the user login
//req body -> data
//username or email
//find the user
//password check
//access and reference token
//send cookie
