import { log } from "../utils/logger.js";
const errorHandler = (err, req, res, next) => {
    const statusCode = err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    // Only log server-side errors (status 500 and above)
    if (statusCode >= 500) {
        log.error(err, "Internal Server Error");
    }

    res.status(statusCode).json({
        success: false,
        message,
        errors: err.errors || [],
        stack: process.env.NODE_ENV === "development" ? err.stack : undefined,
    });
};

export default errorHandler;
