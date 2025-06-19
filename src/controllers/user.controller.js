import asyncHandler from "../utils/asyncHandler.js";
import ApiError from "../utils/apiError.js";
import { User } from "../models/user.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import ApiResponse from "../utils/apiResponse.js";
import { registerUserSchema } from "../schema/user.schema.js";
import { z } from "zod";

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
    try {
        // Validate request body using Zod
        const validatedData = registerUserSchema.parse(req.body);
        const { fullName, email, username, password } = validatedData;

        // Check if user already exists
        const existedUser = await User.findOne({
            $or: [{ username }, { email }],
        });

        if (existedUser) {
            throw new ApiError(
                409,
                "User with email or username already exists"
            );
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

        // Upload to cloudinary
        // const avatar = await uploadOnCloudinary(avatarLocalPath);
        // const coverImage = await uploadOnCloudinary(coverImageLocalPath);

        //upload to cloudinary (Optimize approach)
        const uploadTasks = [uploadOnCloudinary(avatarLocalPath)];
        if (coverImageLocalPath) {
            uploadTasks.push(uploadOnCloudinary(coverImageLocalPath));
        }
        const [avatar, coverImage] = await Promise.all(uploadTasks);

        if (!avatar) {
            throw new ApiError(400, "Avatar upload failed");
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
        // Handle Zod validation errors
        if (error instanceof z.ZodError) {
            const errorMessages = error.errors.map((err) => ({
                field: err.path.join("."),
                message: err.message,
            }));

            throw new ApiError(400, "Validation failed", errorMessages);
        }

        // Re-throw other errors
        throw error;
    }
});

const loginUser = asyncHandler(async (req, res) => {
    try {
        const { email, username, password } = req.body;

        if (!username && !email) {
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
    } catch (error) {
        return res.status(error.statusCode || 500).json({
            success: false,
            message: error.message || "Internal Server Error",
        });
    }
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
export { registerUser, loginUser, logoutUser };
