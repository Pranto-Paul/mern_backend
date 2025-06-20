import asyncHandler from "#utils/asyncHandler.js";
import ApiResponse from "#utils/apiResponse.js";
const getCurrentUser = asyncHandler(async (req, res) => {
    return res
        .status(200)
        .json(new ApiResponse(200, req.user, "User fetched successfully"));
});

export default getCurrentUser;
