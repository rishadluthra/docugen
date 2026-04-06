import dotenv from "dotenv";

dotenv.config();

export const port = process.env.PORT || 8000;
export const templatesDir = process.env.TEMPLATES_DIR || "./templates";
export const outputDir = process.env.OUTPUT_DIR || "./output";