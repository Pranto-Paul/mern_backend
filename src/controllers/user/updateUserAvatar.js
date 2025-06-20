import asyncHandler from "#utils/asyncHandler.js";
import ApiError from "#utils/apiError.js";
import { User } from "#models/user.model.js";
import {
    uploadOnCloudinary,
    removeImageFromCloudinary,
} from "#utils/cloudinary.js";
import ApiResponse from "#utils/apiResponse.js";

const updateUserAvatar = asyncHandler(async (req, res) => {
    const avatarLocalPath = req.file?.path;

    if (!avatarLocalPath) {
        throw new ApiError(400, "Avatar file is missing");
    }

    const [{ url, public_id }, result] = await Promise.all([
        uploadOnCloudinary(avatarLocalPath),
        removeImageFromCloudinary(req.user.avatar.public_id),
    ]);

    if (!url && !public_id) {
        throw new ApiError(400, "Error while uploading on avatar");
    }

    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set: {
                avatar: { url: url, public_id: public_id },
            },
        },
        { new: true }
    ).select("-password");

    return res
        .status(200)
        .json(new ApiResponse(200, user, "Avatar image updated successfully"));
});

export default updateUserAvatar;
