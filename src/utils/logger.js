import chalk from "chalk";
import dayjs from "dayjs";

const timestamp = () =>
    chalk.gray(`[${dayjs().format("YYYY-MM-DD HH:mm:ss")}]`);

export const log = {
    info: (msg, label = "APP") =>
        console.log(
            `${timestamp()} ${chalk.blueBright(`[INFO - ${label}]`)} ${msg}`
        ),

    success: (msg, label = "APP") =>
        console.log(
            `${timestamp()} ${chalk.greenBright(`[SUCCESS - ${label}]`)} ${msg}`
        ),

    warn: (msg, label = "APP") =>
        console.warn(
            `${timestamp()} ${chalk.yellowBright(`[WARNING - ${label}]`)} ${msg}`
        ),

    error: (msg, label = "APP") =>
        console.error(
            `${timestamp()} ${chalk.redBright.bold(`[ERROR - ${label}]`)} ${msg}`
        ),

    debug: (msg, label = "DEBUG") =>
        console.debug(
            `${timestamp()} ${chalk.magentaBright(`[DEBUG - ${label}]`)} ${msg}`
        ),

    fatal: (msg, label = "SYSTEM") =>
        console.error(
            `${timestamp()} ${chalk.bgRed.white.bold(`[FATAL - ${label}]`)} ${msg}`
        ),

    custom: (msg, label = "CUSTOM", color = "cyan") => {
        const coloredLabel = chalk[color] ? chalk[color] : chalk.cyan;
        console.log(`${timestamp()} ${coloredLabel(`[${label}]`)} ${msg}`);
    },
};
