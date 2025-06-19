import { DB_NAME } from "../constants.js";
import mongoose from "mongoose";
import { log } from "../utils/logger.js";

const connectDB = async () => {
    try {
        const connectionInstance = await mongoose.connect(
            `${process.env.MONGO_URI}/${DB_NAME}`
        );

        log.success(
            `✔ MONGODB CONNECTED: DB HOST -> ${connectionInstance.connection.host}`,
            "DATABASE"
        );
    } catch (error) {
        log.error(`✖ MONGODB CONNECTION ERROR:\n${error.message}`, "DATABASE");
        process.exit(1);
    }
};

export default connectDB;
