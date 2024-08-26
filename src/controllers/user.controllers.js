import { asyncHandler } from "../utils/asyncHandler";
import { ApiError } from "../utils/ApiError";
import { ApiResponse } from "../utils/ApiResponse";
import { User } from "../models/user.models";
import { uploadOnCloudinary } from "../utils/cloudinary";

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

   const{fullname, email, username, password} = req.body

   if(
    [fullname,email, username, password].some((field) => field?.trim() === "" )
    ){
        throw new ApiError(400, "All fields are required")
    }

    const existedUser =  User.findOne({
        $or: [{username}, {email}]
    })

    if(existedUser){
        throw new ApiError(409, "User with email or usernamealready exists")
    }

    const avatarLocalPath = req.files?.avatar[0].path;
    const coverImaegeLocalPath = req.files?.coverImage[0].path;

    if(!avatarLocalPath){
        throw new ApiError(400, "Avatar file is required")
    }

    const avatar = await uploadOnCloudinary(avatarLocalPath)
    const coverImaege = await uploadOnCloudinary(coverImaegeLocalPath)

    if(!avatar){
        throw new ApiError(400, "Avatar file is required")
    }

    const user = await User.create({
        fullname,
        avatar : avatar.url,
        coverImaege : coverImaege?.url || " ",
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

export {registerUser}
