import { v2 as cloudinary } from "cloudinary";
import fs from "fs";
import { log } from "./logger.js";
import dotenv from "dotenv";
import ApiError from "./apiError.js";

dotenv.config();

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

const uploadOnCloudinary = async (localFilePath) => {
    try {
        if (!localFilePath) return null;

        const response = await cloudinary.uploader.upload(localFilePath, {
            resource_type: "auto", // Changed from "image" to "auto" for better flexibility
            folder: "user_uploads", // Optional: organize uploads in folders
        });

        log.success(
            `File uploaded successfully: ${response.secure_url}`,
            "CLOUDINARY SUCCESS"
        );
        return {
            url: response.secure_url,
            public_id: response.public_id,
        };
    } catch (error) {
        log.error("Cloudinary upload error:", "CLOUDINARY ERROR");
        throw new ApiError(
            500,
            "Cloudinary upload failed",
            error?.errors || [],
            error.stack
        );
    } finally {
        // Clean up local file
        if (localFilePath && fs.existsSync(localFilePath)) {
            try {
                fs.unlinkSync(localFilePath);
                log.info(`Local file deleted: ${localFilePath}`, "FILE DELETE");
            } catch (unlinkError) {
                log.fatal("Failed to delete local file:", "DELETE FAILED");
            }
        }
    }
};

const removeImageFromCloudinary = async (publicId) => {
    try {
        if (!publicId) {
            log.warn(
                "No public ID provided for deletion",
                "CLOUDINARY WARNING"
            );
            return null;
        }

        const result = await cloudinary.uploader.destroy(publicId);
        log.info(`Cloudinary image deleted: ${publicId}`, "CLOUDINARY SUCCESS");
        return result;
    } catch (error) {
        log.error(
            `Cloudinary deletion error for ${publicId}:`,
            "CLOUDINARY ERROR"
        );
        throw new ApiError(
            500,
            "Failed to delete image from Cloudinary",
            [],
            error.stack
        );
    }
};

export { uploadOnCloudinary, removeImageFromCloudinary };
