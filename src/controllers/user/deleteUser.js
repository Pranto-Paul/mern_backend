import asyncHandler from "#utils/asyncHandler.js";
import ApiError from "#utils/apiError.js";
import ApiResponse from "#utils/apiResponse.js";
import { User } from "#models/user.model.js";
import { removeImageFromCloudinary } from "#utils/cloudinary.js";
const deleteUser = asyncHandler(async (req, res) => {
    const { password } = req.body;

    // Validate inputs
    if (!req.user) {
        throw new ApiError(401, "Unauthorized access");
    }

    if (!password) {
        throw new ApiError(400, "Password is required to delete account");
    }

    // Find user
    const user = await User.findById(req.user._id);
    if (!user) {
        throw new ApiError(404, "User not found");
    }

    // Verify password
    const isPasswordValid = await user.isPasswordCorrect(password);
    if (!isPasswordValid) {
        throw new ApiError(401, "Incorrect password");
    }
    //remove uploaded image from cloudinary
    const deletionPromises = [
        user.avatar?.public_id,
        user.coverImage?.public_id,
    ].filter(Boolean);

    const result = await Promise.all(
        deletionPromises.map((item) => removeImageFromCloudinary(item))
    );

    // Delete user
    await User.findByIdAndDelete(req.user._id);

    return res
        .status(200)
        .json(new ApiResponse(200, null, "User deleted successfully"));
});

export default deleteUser;
