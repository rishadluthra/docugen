/**
 * DOCUMENT GENERATION ROUTE
 * 
 * Endpoint: POST /generate-document
 * Purpose: Generates a Word document from a template with provided data
 * 
 * Request body:
 * {
 *   "template": "template_name",
 *   "data": { "field1": "value1", "field2": "value2", ... }
 * }
 * 
 * Response: { "success": true, "filename": "...", "path": "..." }
 */

import express from "express";
import {
  renderTemplateToBuffer,
  saveBufferToFile,
} from "../services/documentService.js";
import { buildOutputFilename } from "../utils/filename.js";

const router = express.Router();

/**
 * POST /generate-document
 * 
 * Generates a new Word document by:
 * 1. Validating input parameters (template name and data object)
 * 2. Loading and rendering the template with provided data
 * 3. Saving the rendered document to the output directory
 * 4. Returning the generated filename and path
 * 
 * Input validation:
 * - template: Must be a non-empty string
 * - data: Must be an object (not an array)
 * 
 * Error handling: Returns 400 for validation/rendering errors, 404 for missing templates, 500 for server errors
 */
router.post("/generate-document", (req, res) => {
  try {
    const { template, data } = req.body || {};

    // Validate template parameter
    if (typeof template !== "string" || !template.trim()) {
      return res.status(400).json({
        success: false,
        error: "template must be a non-empty string",
      });
    }

    // Validate data parameter - must be a non-array object
    if (!data || typeof data !== "object" || Array.isArray(data)) {
      return res.status(400).json({
        success: false,
        error: "data must be an object",
      });
    }

    // Clean template name and generate document
    const safeTemplateName = template.trim();
    const buffer = renderTemplateToBuffer(safeTemplateName, data);
    const filename = buildOutputFilename(safeTemplateName);
    const savedFile = saveBufferToFile(filename, buffer);

    // Return success response with file information
    return res.status(200).json({
      success: true,
      filename: savedFile.filename,
      path: savedFile.relativePath,
    });
  } catch (error) {
    // Return error response with appropriate HTTP status code
    return res.status(error.statusCode || 500).json({
      success: false,
      error: error.message || "Internal server error",
    });
  }
});

export default router;