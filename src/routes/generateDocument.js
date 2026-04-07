import express from "express";
import { renderTemplateToBuffer, saveBufferToFile } from "../services/documentService.js";
import { buildOutputFilename } from "../utils/filename.js";

const router = express.Router();

router.post("/generate-document", (req, res) => {
  try {
    const { template, fields, tables } = req.body;

    if (typeof template !== "string" || !template.trim()) {
      return res.status(400).json({
        success: false,
        error: "template must be a non-empty string",
      });
    }

    if (!fields || typeof fields !== "object" || Array.isArray(fields)) {
      return res.status(400).json({
        success: false,
        error: "fields must be an object",
      });
    }

    if (
      tables?.line_items?.rows &&
      (!Array.isArray(tables.line_items.rows) ||
        tables.line_items.rows.some((row) => typeof row !== "object" || Array.isArray(row)))
    ) {
      return res.status(400).json({
        success: false,
        error: "tables.line_items.rows must be an array of objects",
      });
    }

    const renderData = {
      ...fields,
      line_items: tables?.line_items?.rows || [],
    };

    const safeTemplateName = template.trim();
    const buffer = renderTemplateToBuffer(safeTemplateName, renderData);
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