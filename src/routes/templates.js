import express from "express";
import { listTemplates, getTemplateTags } from "../services/templateService.js";

const router = express.Router();

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

router.get("/templates/:template/tags", (req, res) => {
  try {
    const raw =
      req.query.raw === "1" ||
      req.query.raw === "true" ||
      req.query.raw === "yes";

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