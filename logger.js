import pino from "pino";
import { dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));

const logger =
  process.env.NODE_ENV === "development"
    ? pino()
    : pino(
        {
          level: "info",
        },
        pino.destination(`${__dirname}/combined.log`)
      );

export default logger;
