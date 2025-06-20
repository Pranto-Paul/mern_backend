import { Router } from "express";
import {
    registerUser,
    loginUser,
    logoutUser,
    deleteUser,
    refreshAccessToken,
    changeCurrentPassword,
    getCurrentUser,
    updateUserAvatar,
    updateUserCoverImage,
    updateAccountDetails,
    getUserChanelProfile,
    getWatchHistory,
} from "../controllers/user.controller.js";
import { upload } from "../middlewares/multer.middleware.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
const userRouter = Router();

userRouter.post(
    "/register",
    upload.fields([
        { name: "avatar", maxCount: 1 },
        { name: "coverImage", maxCount: 1 },
    ]),
    registerUser
);
userRouter.post("/login", loginUser);
userRouter.post("/refresh-token", refreshAccessToken);

//secured routes
userRouter.post("/logout", verifyJWT, logoutUser);
userRouter.delete("/delete", verifyJWT, deleteUser);
userRouter.post("/change-password", verifyJWT, changeCurrentPassword);
userRouter.get("/current-user", verifyJWT, getCurrentUser);
userRouter.patch("/update-account", verifyJWT, updateAccountDetails);
userRouter.patch(
    "/avatar",
    verifyJWT,
    upload.single("avatar"),
    updateUserAvatar
);
userRouter.patch(
    "/cover-image",
    verifyJWT,
    upload.single("coverImage"),
    updateUserCoverImage
);
userRouter.get("/chanel/:username", verifyJWT, getUserChannelProfile);
userRouter.get("/history", verifyJWT, getWatchHistory);
export default userRouter;
