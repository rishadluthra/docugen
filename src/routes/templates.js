/**
 * TEMPLATE DISCOVERY ROUTES
 * 
 * Endpoints:
 * 1. GET /templates - Lists all available templates
 * 2. GET /templates/:template/tags - Inspects template variables and loops
 * 
 */

import express from "express";
import { listTemplates, getTemplateTags } from "../services/templateService.js";

const router = express.Router();

/**
 * GET /templates
 * 
 * Returns a list of all available Word templates in the templates directory.
 * Each template can be used with the /generate-document endpoint.
 * 
 * Response: { "success": true, "templates": [{"name": "...", "filename": "..."}, ...] }
 */
router.get("/templates", (_req, res) => {
  try {
    const templates = listTemplates();

    return res.status(200).json({
      success: true,
      templates,
    });
  } catch (error) {
    return res.status(error.statusCode || 500).json({
      success: false,
      error: error.message || "Internal server error",
    });
  }
});

/**
 * GET /templates/:template/tags
 * 
 * Inspects a specific template and returns all the variable placeholders it contains.
 * 
 * Query Parameters:
 * - raw: If set to "1", "true", or "yes", returns the raw template structure
 * 
 * Response: { "success": true, "scalars": [...], "loops": [...] }
 * - scalars: Simple variable fields (strings, numbers, etc.)
 * - loops: Repeating sections with nested fields
 */
router.get("/templates/:template/tags", (req, res) => {
  try {
    // Parse raw query parameter
    const raw =
      req.query.raw === "1" ||
      req.query.raw === "true" ||
      req.query.raw === "yes";

    // Get template tags/variables
    const result = getTemplateTags(req.params.template, { raw });

    return res.status(200).json({
      success: true,
      ...result,
    });
  } catch (error) {
    return res.status(error.statusCode || 500).json({
      success: false,
      error: error.message || "Internal server error",
    });
  }
});

export default router;