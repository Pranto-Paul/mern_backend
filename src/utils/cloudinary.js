import { v2 as cloudinary } from "cloudinary";
import fs from "fs";
import { log } from "./logger.js";
import dotenv from "dotenv";
dotenv.config();
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});
const uploadOnCloudinary = async (localFilePath) => {
    try {
        if (!localFilePath) return null;
        //upload the file on cloudinary
        const response = await cloudinary.uploader.upload(localFilePath, {
            resource_type: "image",
        });
        //file has been uploaded successfully
        log.success(
            `File uploaded successfully: ${response.url}`,
            "CLOUDINARY"
        );
        fs.unlinkSync(localFilePath);
        return response;
    } catch (error) {
        fs.unlinkSync(localFilePath);
        return null;
    }
};
export { uploadOnCloudinary };
