import asyncHandler from "#utils/asyncHandler.js";
import ApiError from "#utils/apiError.js";
import { User } from "#models/user.model.js";
import ApiResponse from "#utils/apiResponse.js";
const getUserChanelProfile = asyncHandler(async (req, res) => {
    const { username } = req.username;

    if (!username?.trim()) {
        throw new ApiError(400, "username is missing");
    }
    const chanel = await User.aggregate([
        {
            $match: {
                username: username?.toLowerCase(),
            },
        },
        {
            $lookup: {
                from: "subscriptions",
                localField: "_id",
                foreignField: "chanel",
                as: "subscribers",
            },
        },
        {
            $lookup: {
                from: "subscriptions",
                localField: "_id",
                foreignField: "subscriber",
                as: "subscribedTo",
            },
        },
        {
            $addFields: {
                subscriberCount: {
                    $size: "$subscribers",
                },
                chanelsSubscribedToCount: {
                    $size: "$subscribedTo",
                },
                isSubscribed: {
                    $cond: {
                        if: { $in: [req.user?._id, "$subscribers.subscriber"] },
                        then: true,
                        else: false,
                    },
                },
            },
        },
        {
            $project: {
                fullName: 1,
                username: 1,
                subscriberCount: 1,
                chanelsSubscribedToCount: 1,
                isSubscribed: 1,
                avatar: 1,
                coverImage: 1,
                email: 1,
            },
        },
    ]);
    if (!chanel?.length) {
        throw new ApiError(404, "chanel doesnot exists");
    }
    return res
        .status(200)
        .json(
            new ApiResponse(200, chanel[0], "User chanel fetched successfully")
        );
});

export default getUserChanelProfile;
