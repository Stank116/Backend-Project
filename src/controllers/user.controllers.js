import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { User } from "../models/user.models.js";
import {Subscription} from "../models/subscription.models.js"
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import jsonwebtoken from "jsonwebtoken"

const generateAccessRefreshTokens = async (userId) => {
    try{
    const user = await User.findById(userId)
    const accessToken = user.generateAccessToken
    const refreshToken = user.generateRefreshToken
    user.refreshToken = refreshToken
    await user.save({validateBeforeSave : false})
    return {accessToken, refreshToken}
    }
    catch(error){
        throw new ApiError(500, "Something went wrong")
    }
}

const registerUser = asyncHandler( async (res, req) => {
    //get details from user
    //check if its not blank and email format
    //check if user exists
    //get avatar and coverimage from user
    //upload on cloudinary and again check for avatar is uploaded or not
    //store data on mongoDB in object format
    //remove password and tokens from Db after storing
    //check if user is present or not in DB
    //return res

   const {fullname, email, username, password} = req.body
   //console.log("email: ", email)

   if(
    [fullname,email, username, password].some((field) => field?.trim() === "" )
    ){
        throw new ApiError(400, "All fields are required")
    }

    const existedUser = await User.findOne({
        $or: [{username}, {email}]
    })

    if(existedUser){
        throw new ApiError(409, "User with email or usernamealready exists")
    }

    const avatarLocalPath = req.files?.avatar[0].path;
   // const coverImageLocalPath = req.files?.coverImage[0].path;

   let coverImageLocalPath;
   if(req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0){
    coverImageLocalPath = req.files.coverImage[0].path;
   }


   

    if(!avatarLocalPath){
        throw new ApiError(400, "Avatar file is required")
    }

    const avatar = await uploadOnCloudinary(avatarLocalPath)
    const coverImage = await uploadOnCloudinary(coverImageLocalPath)

    if(!avatar){
        throw new ApiError(400, "Avatar file is required")
    }

    const user = await User.create({
        fullname,
        avatar : avatar.url,
        coverImage : coverImage?.url || " ",
        email,
        username : username.toLowerCase(),
        password
    })


   const createdUser = await User.findById(user._id).select("-password, -refreshToken")

   if(!createdUser){
    throw new ApiError(500, "Something went wrong while registering the user")
   }

   return res.status(201).json(
    new ApiResponse(200, "User registerd successfully")
   )
})

const loginUser = asyncHandler( async (req,res) => {
    //get data from users like username or email and password
    //check if is it not blank
    //check email or username 
    //check password
    //generate access tokens and refresh tokens
  
    const {username, email, password} = req.body

    // if([username, email, password].some((field) => field?.trim() === "") ){
    //     throw new ApiError(400, "All details are required")
    // }

    if( !(username || email)){
        throw new ApiError(400, "username or email is required")
    }

    const user = await User.findOne({
        $or:[{username}, {email}]
    })

    if(!user){
        throw new ApiError(404, "username or email not found")
    }

    const isPasswordValid =  await user.isPasswordCorrect(password)

    if(!isPasswordValid){
        throw new ApiError(401, "Invalid user credentials")
    }

    const {accessToken, refreshToken} =  await generateAccessRefreshTokens()
    
    const loggedInUser = await  User.findById(user._id).select("-password, -refreshToken")

    options = {
        httpOnly : true,
        secure : true
    }

    return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
        new ApiResponse(200, {
            user : loggedInUser , accessToken , refreshToken
        },
        "User logged in successfully"
    )
    )
})

const logoutUser = asyncHandler(async (req, res) => {
    User.findByIdAndUpdate(req.user._id,{
       $unset : {refreshToken : 1}
       
    },
    {
        new : true
    }
    )

    const options =  {
        httpOnly : true,
        secure : true
    }

    return res 
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(
        new ApiResponse(200, {}, "User logged Out")
    )

})

const refreshAccessToken = asyncHandler(async (req, res) => {
    const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken

    if(!incomingRefreshToken){
        throw new ApiError(401, "unauthorized request")
    }
    try{
    const decodedToken = jsonwebtoken.verify(incomingRefreshToken, process.env.REFRESH_TOKEN_SECRET)

    const user = await User.findById(decodedToken?.user._id)

    if(!user){
        throw new ApiError(401, "Invalid refrsesh token")
    }

    if(incomingRefreshToken !== user?.refreshToken){
        throw new ApiError(401, "Refresh token is expired or used")
    }

    const options = {
        httpOnly : true,
        secure: true
    }

    const {accessToken, newRefreshToken}= await generateAccessRefreshTokens()

    return res
    .status(200)
    .cookie("accesstoken", accessToken,options)
    .cookie("refreshToken", newRefreshToken, options)
    .json(
        new ApiResponse(
            200,
            {accessToken,  refreshToken : newRefreshToken},
            "access token refreshed"
        )
    )} catch(error){
        throw new ApiError(401, error?.message || "Invalid refresh token")
    }
})

const changeCurrentPassword = asyncHandler(async (req, res) => {
  const {oldPassword, newPassword} =  req.body

  if(!oldPassword || !newPassword){
    throw new ApiError(401, "old and new passwords are required !")
  }

  const user = await User.findById(req.user._id)

  const isPasswordCorrect =  await user.isPasswordCorrect(oldPassword)

  if(!isPasswordCorrect){
    throw new ApiError(401, "old Passwors not matching !")
  }

  user.password = newPassword
  await user.save({validateBeforeSave : false})

  return res
  .status(200)
  .json(new ApiResponse(200, {}, "Password changed successfully"))

})

const getCurrentUser = asyncHandler(async (req, res) => {
    return res
    .status(200)
    .json(new ApiResponse(200, req.user, "User fetched successfully"))
})

const changeAccountDetails = asyncHandler(async(req, res) => {
    const {fullname, email} = req.body

    if(!fullname || !email){
        throw new ApiError(400, "Email and fullname are required !")
    }

    const user = await  User.findByIdAndUpdate(req.user._id,
        {
           $set : {
                email, 
                fullname
           }
        },
        {new : true}
    ).select("-password")

    return res
    .status(200)
    .json(new ApiResponse(
        200,
        user,
        "Account details updated successfully"
    ))
})

const changeUserAvatar = asyncHandler( async (req, res) => {
    const avatarLocalPath = req.file?.path

    if(!avatarLocalPath){
        throw new ApiError(401, "AvatarLocalPath not found")
    }

    const avatar = await uploadOnCloudinary(avatarLocalPath)

    if(!avatar.url){
        throw new ApiError(400, "Avatar does not uploaded succcesfully")
    }

    const user = await  User.findByIdAndUpdate(req.user?._id, 
        {
            $set: {
                avatar : avatar.url
            }
    },
        {new : true}
    ).select("-password")

    return res
    .status(200)
    .json( new ApiResponse(
        200,
        user,
        "Avatar Changed successully"
    ))

})

const changeUserCoverImage = asyncHandler( async (req, res) => {
    const coverImageLocalPath = req.file?.path

    if(!coverImageLocalPath){
        throw new ApiError(401, "CoverImageLocalPath not found")
    }

    const coverImage = await uploadOnCloudinary(coverImageLocalPath)

    if(!coverImage.url){
        throw new ApiError(400, "CoverImage does not uploaded succcesfully")
    }

    const user = await  User.findByIdAndUpdate(req.user?._id, 
        {
            $set: {
                coverImage : coverImage.url
            }
    },
        {new : true}
    ).select("-password")

    return res
    .status(200)
    .json( new ApiResponse(
        200,
        user,
        "CoverImage Changed successully"
    ))

})

const getChannelProfile = asyncHandler(async (req, res) => {
    const {username} = req.params
    if(!username){
        throw new ApiError(400, "Username not available")
    }

    const Channel = await  User.aggregate([
    {
        $match : {
            username : username?.toLowerCase()
        }
    },
    {
        $lookup : {
            from : "subscriptions",
            localField : "_id",
            foreignField : "channel",
            as : "subscribers"
        }
    },
    {
        $lookup : {
            from : "subscriptions",
            localField : "_id",
            foreignField : "subscriber",
            as : "subscribedTo"
        }
    },
    {
        $addFields: {
            subscriberCount : {
                $size : "subscribers"
            },
            subscribedCount : {
                $size : "subscribedTo"
            },
            isSubscribed : {
                $cond : {
                    if : {$in : [req.user?._id, "$subscribers.subscriber"]},
                    then: true,
                    else : false
                }
            }
        }
    },
    {
        $project : {
            fullname : 1,
            username : 1,
            email : 1,
            avatar : 1, 
            coverImage : 1,
            subscriber : 1,
            channel : 1,
            isSubscribed : 1,
            subscriberCount :1,
            subscribedCount : 1
        }
    }
 ])

 if(!Channel?.length){
    throw new ApiResponse(400, "channel does not exist")
 }

 return res 
 .status(200)
 .json(new ApiResponse(200, Channel[0], "User channel fetched successfully"))
})



export  {registerUser,
         loginUser,
         logoutUser,
         refreshAccessToken,
         changeCurrentPassword,
         getCurrentUser,
         changeAccountDetails,
         changeUserAvatar,
         changeUserCoverImage,
         getChannelProfile
}
