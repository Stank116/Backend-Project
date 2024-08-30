import { asyncHandler } from "../utils/asyncHandler";
import { User } from "../models/user.models";
import jsonwebtoken  from "jsonwebtoken";
import { ApiError } from "../utils/ApiError";

const JWTverify = asyncHandler(async(req, res, next) => {
    try { 
        const token = req.cookies?.accessToken || req.header("Authorization")?.replace("Bearer", "")

    if(!token){
        throw new ApiError(401, "Unauthorized request")
    }

    const decodedToken = jsonwebtoken.verify(token, process.env.ACCESS_TOKEN_SECRET)

   const user = await User.findById(decodedToken?._id).select("-password, -refreshToken")

   req.user = user

   if(!user){
    throw new ApiError(401, "Invalid Access Token")
   }

   next()
}
catch(error){
    throw new ApiError(401, error.message || "Invalid access token")
}
})

export {JWTverify}