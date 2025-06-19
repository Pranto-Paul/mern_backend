import express from "express";
import dotenv from "dotenv";
import { log } from "./utils/logger.js";
import connectDB from "./db/index.js";

dotenv.config();
const PORT = process.env.PORT || 3000;
connectDB()
    .then(() => {
        const app = express();
        app.listen(PORT, () => {
            log.info(
                `SERVER IS RUNNING ON PORT: http://localhost:${PORT}`,
                "SERVER"
            );
        });
    })
    .catch((err) => {
        log.fatal("Server startup aborted due to DB error", "INIT");
        process.exit(1);
    });
