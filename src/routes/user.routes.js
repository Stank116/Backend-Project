import Router from "express";
import {registerUser, loginUser, logoutUser, refreshAccessToken} from "../controllers/user.controllers.js";
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

export default userRouter