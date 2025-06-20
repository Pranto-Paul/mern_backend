import ApiError from "#utils/apiError.js";
import asyncHandler from "#utils/asyncHandler.js";
import { User } from "#models/user.model.js";
import {
    uploadOnCloudinary,
    removeImageFromCloudinary,
} from "#utils/cloudinary.js";
import ApiResponse from "#utils/apiResponse.js";

const updateUserCoverImage = asyncHandler(async (req, res) => {
    const coverImageLocalPath = req.file?.path;

    if (!coverImageLocalPath) {
        throw new ApiError(400, "Cover image file is missing");
    }

    const [{ url, public_id }, result] = await Promise.all([
        uploadOnCloudinary(coverImageLocalPath),
        removeImageFromCloudinary(
            req.user.coverImage?.public_id
                ? req.user.coverImage.public_id
                : null
        ),
    ]);

    if (!url && !public_id) {
        throw new ApiError(400, "Error while uploading cover image");
    }

    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set: {
                coverImage: { url: url, public_id: public_id },
            },
        },
        { new: true }
    ).select("-password");

    return res
        .status(200)
        .json(new ApiResponse(200, user, "Cover image updated successfully"));
});
export default updateUserCoverImage;
