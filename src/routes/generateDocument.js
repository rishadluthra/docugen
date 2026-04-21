import express from "express";
import {
  renderTemplateToBuffer,
  saveBufferToFile,
} from "../services/documentService.js";
import { buildOutputFilename } from "../utils/filename.js";

const router = express.Router();

router.post("/generate-document", (req, res) => {
  try {
    const { template, data } = req.body || {};

    if (typeof template !== "string" || !template.trim()) {
      return res.status(400).json({
        success: false,
        error: "template must be a non-empty string",
      });
    }

    if (!data || typeof data !== "object" || Array.isArray(data)) {
      return res.status(400).json({
        success: false,
        error: "data must be an object",
      });
    }

    const safeTemplateName = template.trim();
    const buffer = renderTemplateToBuffer(safeTemplateName, data);
    const filename = buildOutputFilename(safeTemplateName);
    const savedFile = saveBufferToFile(filename, buffer);

    return res.status(200).json({
      success: true,
      filename: savedFile.filename,
      path: savedFile.relativePath,
    });
  } catch (error) {
    return res.status(error.statusCode || 500).json({
      success: false,
      error: error.message || "Internal server error",
    });
  }
});

export default router;