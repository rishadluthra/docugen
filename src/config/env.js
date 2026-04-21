import dotenv from "dotenv";

// Load environment variables from .env file
dotenv.config();

// HTTP server port - can be overridden via environment variable
export const port = process.env.PORT || 8000;

// Path to directory containing Word template files (.docx)
export const templatesDir = process.env.TEMPLATES_DIR || "./templates";

// Path to directory where generated documents will be saved
export const outputDir = process.env.OUTPUT_DIR || "./output";