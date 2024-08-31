import Router from "express";
import {registerUser, loginUser, logoutUser, refreshAccessToken, changeCurrentPassword, getCurrentUser, changeAccountDetails, changeUserAvatar, changeUserCoverImage} from "../controllers/user.controllers.js";
import { upload } from "../middlewares/multer.middlewares.js";
import { JWTverify } from "../middlewares/auth.middlewares.js";

const userRouter = Router()

userRouter.route("/register").post(
    upload.fields([
        {
            name : "avatar",
            maxCount: 1
        },
        {
            name: "coverImage",
            maxCount: 1
        }
    ]),
    registerUser)

userRouter.route("/login").post(loginUser)
userRouter.route("/logout").post(JWTverify, logoutUser)
userRouter.route("refresh-token").post(refreshAccessToken)
userRouter.route("/change-password").post(JWTverify, changeCurrentPassword )
userRouter.route("/current-user").get(JWTverify, getCurrentUser )
userRouter.route("/update-account").patch(JWTverify, changeAccountDetails )
userRouter.route("/avatar").patch(JWTverify, upload.single("avatar") , changeUserAvatar)
userRouter.route("/cover-image").patch(JWTverify, upload.single("coverImage") , changeUserCoverImage)



export default userRouter