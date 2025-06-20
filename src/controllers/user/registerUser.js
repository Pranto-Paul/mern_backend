import asyncHandler from "#utils/asyncHandler.js";
import { registerUserSchema } from "#schema/user.schema.js";
import { User } from "#models/user.model.js";
import ApiResponse from "#utils/apiResponse.js";
import ApiError from "#utils/apiError.js";
import {
    uploadOnCloudinary,
    removeImageFromCloudinary,
} from "#utils/cloudinary.js";

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
    )
        coverImageLocalPath = req.files.coverImage[0].path;

    if (!avatarLocalPath) {
        throw new ApiError(400, "Avatar file is required");
    }
    let uploadedImageList;
    try {
        //upload on cloudinary
        uploadedImageList = [
            avatarLocalPath ? avatarLocalPath : null,
            coverImageLocalPath ? coverImageLocalPath : null,
        ].filter(Boolean);

        const [avatar, coverImage] = await Promise.all(
            uploadedImageList.map((item) => uploadOnCloudinary(item))
        );

        // Create user
        const user = await User.create({
            fullName,
            avatar: {
                url: avatar.url,
                public_id: avatar.public_id,
            },
            coverImage: {
                url: coverImage?.url || "",
                public_id: coverImage?.public_id || "",
            },
            email,
            password,
            username,
        });

        if (!user) {
            throw new ApiError(500, "Failed to create user in database");
        }

        // let create user without sensitive fields
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
        if (uploadedImageList.length > 0) {
            try {
                await Promise.all(
                    uploadedImageList.map((publicId) =>
                        removeImageFromCloudinary(publicId)
                    )
                );
            } catch (cleanupError) {
                log.error("Failed to cleanup uploaded images:", cleanupError);
            }
        }
        throw error;
    }
});
export default registerUser;
