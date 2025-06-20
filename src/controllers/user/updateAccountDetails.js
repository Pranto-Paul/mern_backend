import asyncHandler from "#utils/asyncHandler.js";
import ApiError from "#utils/apiError.js";
import { User } from "#models/user.model.js";
import ApiResponse from "#utils/apiResponse.js";

const updateAccountDetails = asyncHandler(async (req, res) => {
    const { fullName, email } = req.body;

    if (!fullName || !email) {
        throw new ApiError(400, "All fields are required");
    }

    let user;

    try {
        user = await User.findByIdAndUpdate(
            req.user?._id,
            {
                $set: {
                    fullName,
                    email,
                },
            },
            { new: true }
        ).select("-password");
    } catch (error) {
        if (error.code === 11000) {
            const duplicateField = Object.keys(error.keyPattern)[0];
            throw new ApiError(
                409,
                `${duplicateField.charAt(0).toUpperCase() + duplicateField.slice(1)} already exists. Please try another one.`
            );
        }

        throw new ApiError(
            500,
            "Something went wrong while updating account",
            [],
            error.stack
        );
    }

    return res
        .status(200)
        .json(
            new ApiResponse(200, user, "Account details updated successfully")
        );
});

export default updateAccountDetails;
