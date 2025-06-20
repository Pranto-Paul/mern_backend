import asyncHandler from "../utils/asyncHandler.js";
import ApiError from "../utils/apiError.js";
import { User } from "../models/user.model.js";
import {
    uploadOnCloudinary,
    removeImageFromCloudinary,
} from "../utils/cloudinary.js";
import ApiResponse from "../utils/apiResponse.js";
import { registerUserSchema } from "../schema/user.schema.js";
import jwt from "jsonwebtoken";

const generateAccessAndRefereshTokens = async (user) => {
    try {
        const accessToken = user.generateAccessToken();
        const refreshToken = user.generateRefreshToken();

        user.refreshToken = refreshToken;
        await user.save({ validateBeforeSave: false });

        return { accessToken, refreshToken };
    } catch (error) {
        throw new ApiError(
            500,
            "Something went wrong while generating referesh and access token"
        );
    }
};

const registerUser = asyncHandler(async (req, res) => {
    // Validate request body using Zod
    const validatedData = registerUserSchema.safeParse(req.body);
    if (!validatedData.success) {
        throw new ApiError(400, "Validation Error", validatedData.error.errors);
    }
    const { fullName, email, username, password } = validatedData.data;

    // Check if user already exists
    const existedUser = await User.findOne({
        $or: [{ username }, { email }],
    });

    if (existedUser) {
        throw new ApiError(409, "User with email or username already exists");
    }

    // Handle file uploads
    const avatarLocalPath = req.files?.avatar?.[0]?.path;
    let coverImageLocalPath;

    if (
        req.files &&
        Array.isArray(req.files.coverImage) &&
        req.files.coverImage.length > 0
    ) {
        coverImageLocalPath = req.files.coverImage[0].path;
    }

    if (!avatarLocalPath) {
        throw new ApiError(400, "Avatar file is required");
    }

    let avatar, coverImage;
    const uploadedPublicIds = []; // Track uploaded assets for cleanup

    try {
        // Upload to cloudinary (Optimized approach)
        const uploadTasks = [uploadOnCloudinary(avatarLocalPath)];
        if (coverImageLocalPath) {
            uploadTasks.push(uploadOnCloudinary(coverImageLocalPath));
        }

        const uploadResults = await Promise.all(uploadTasks);
        avatar = uploadResults[0];
        coverImage = uploadResults[1] || null;

        if (!avatar) {
            throw new ApiError(400, "Avatar upload failed");
        }

        // Track uploaded public IDs for potential cleanup
        uploadedPublicIds.push(avatar.public_id);
        if (coverImage?.public_id) {
            uploadedPublicIds.push(coverImage.public_id);
        }

        // Create user
        const user = await User.create({
            fullName,
            avatar: avatar.url,
            coverImage: coverImage?.url || "",
            email,
            password,
            username,
        });

        if (!user) {
            throw new ApiError(500, "Failed to create user in database");
        }

        // Get created user without sensitive fields
        const createdUser = await User.findById(user._id).select(
            "-password -refreshToken"
        );

        if (!createdUser) {
            throw new ApiError(
                500,
                "Something went wrong while registering the user"
            );
        }

        return res
            .status(201)
            .json(
                new ApiResponse(
                    201,
                    createdUser,
                    "User registered successfully"
                )
            );
    } catch (error) {
        // Cleanup uploaded images if user creation fails
        if (uploadedPublicIds && uploadedPublicIds.length > 0) {
            try {
                await Promise.all(
                    uploadedPublicIds.map((publicId) =>
                        removeImageFromCloudinary(publicId)
                    )
                );
            } catch (cleanupError) {
                log.error("Failed to cleanup uploaded images:", cleanupError);
            }
        }
        throw error; // Re-throw the original error
    }
});

const loginUser = asyncHandler(async (req, res) => {
    const { email, username, password } = req.body;

    if (!(username || email)) {
        throw new ApiError(400, "username or email is required");
    }
    const user = await User.findOne({
        $or: [{ username }, { email }],
    });

    if (!user) {
        throw new ApiError(404, "User does not exist");
    }

    const isPasswordValid = await user.isPasswordCorrect(password);

    if (!isPasswordValid) {
        throw new ApiError(401, "Invalid user credentials");
    }

    const { accessToken, refreshToken } =
        await generateAccessAndRefereshTokens(user);

    const loggedInUser = await User.findById(user._id).select(
        "-password -refreshToken"
    );

    const options = {
        httpOnly: true,
        secure: true,
    };

    return res
        .status(200)
        .cookie("accessToken", accessToken, options)
        .cookie("refreshToken", refreshToken, options)
        .json(
            new ApiResponse(
                200,
                {
                    user: loggedInUser,
                    accessToken,
                    refreshToken,
                },
                "User logged In Successfully"
            )
        );
});

const logoutUser = asyncHandler(async (req, res) => {
    await User.findByIdAndUpdate(
        req.user._id,
        {
            $unset: {
                refreshToken: 1, // this removes the field from document
            },
        },
        {
            new: true,
        }
    );

    const options = {
        httpOnly: true,
        secure: true,
    };

    return res
        .status(200)
        .clearCookie("accessToken", options)
        .clearCookie("refreshToken", options)
        .json(new ApiResponse(200, {}, "User logged Out"));
});

const refreshAccessToken = asyncHandler(async (req, res) => {
    const incomingRefreshToken =
        req.cookies.refreshToken || req.body.refreshToken;

    if (!incomingRefreshToken) {
        throw new ApiError(401, "unauthorized request");
    }

    try {
        const decodedToken = jwt.verify(
            incomingRefreshToken,
            process.env.REFRESH_TOKEN_SECRET
        );

        const user = await User.findById(decodedToken?._id);

        if (!user) {
            throw new ApiError(401, "Invalid refresh token");
        }

        if (incomingRefreshToken !== user?.refreshToken) {
            throw new ApiError(401, "Refresh token is expired or used");
        }

        const options = {
            httpOnly: true,
            secure: true,
        };

        const { accessToken, newRefreshToken } =
            await generateAccessAndRefereshTokens(user);

        return res
            .status(200)
            .cookie("accessToken", accessToken, options)
            .cookie("refreshToken", newRefreshToken, options)
            .json(
                new ApiResponse(
                    200,
                    { accessToken, refreshToken: newRefreshToken },
                    "Access token refreshed"
                )
            );
    } catch (error) {
        throw new ApiError(401, error?.message || "Invalid refresh token");
    }
});

export { registerUser, loginUser, logoutUser, refreshAccessToken };
