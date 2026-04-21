/**
 * TEMPLATE DISCOVERY SERVICE
 * 
 * Service for:
 * 1. Listing all available templates in the templates directory
 * 2. Inspecting template structure and variable requirements
 * 3. Validating template names for security
 * 
 * These endpoints users discover:
 * - What templates are available
 * - What variables (placeholders) each template requires
 */

import fs from "fs";
import path from "path";
import PizZip from "pizzip";
import Docxtemplater from "docxtemplater";
import InspectModule from "docxtemplater/js/inspect-module.js";
import { templatesDir } from "../config/env.js";

/**
 * Gets the absolute path to the templates directory
 * @returns {string} Absolute path to templates folder
 */
function getTemplatesRoot() {
  return path.resolve(process.cwd(), templatesDir);
}

/**
 * Resolves the full path to a specific template file
 * @param {string} templateName - Template name without .docx extension
 * @returns {string} Absolute path to template file
 */
function getTemplatePath(templateName) {
  return path.resolve(getTemplatesRoot(), `${templateName}.docx`);
}

/**
 * Validates template names for security
 * 
 * Prevents directory traversal and special character exploits by restricting
 * template names to alphanumeric characters, underscores, and hyphens.
 * 
 * @param {string} templateName - Template name to validate
 * @returns {string} The normalized (trimmed) template name if valid
 * @throws {Error} If name is empty or contains invalid characters
 */
function assertSafeTemplateName(templateName) {
  if (typeof templateName !== "string" || !templateName.trim()) {
    const error = new Error("template must be a non-empty string");
    error.statusCode = 400;
    throw error;
  }

  const normalized = templateName.trim();

  // Only allow safe characters to prevent directory traversal attacks
  if (!/^[a-zA-Z0-9_-]+$/.test(normalized)) {
    const error = new Error(
      "template may only contain letters, numbers, underscores, and hyphens"
    );
    error.statusCode = 400;
    throw error;
  }

  return normalized;
}

/**
 * Organizes template variables into a user-friendly summary
 * 
 * Categories:
 * - scalars: Simple fields (strings, numbers, dates, etc.)
 * - loops: Repeating sections with nested fields
 * 
 * Example response:
 * {
 *   scalars: ["clientName", "invoiceDate"],
 *   loops: [
 *     { name: "items", fields: ["description", "quantity", "price"] },
 *     { name: "notes", fields: ["text"] }
 *   ]
 * }
 * 
 * @param {object} allTags - Raw tag structure from docxtemplater inspection
 * @returns {object} Organized summary with scalars and loops arrays
 */
function buildSummaryFromAllTags(allTags) {
  const scalars = [];
  const loops = [];

  // Iterate through all discovered tags/variables
  for (const [key, value] of Object.entries(allTags || {})) {
    // Check if this is a loop (object with nested structure)
    if (
      value &&
      typeof value === "object" &&
      !Array.isArray(value) &&
      Object.keys(value).length > 0
    ) {
      loops.push({
        name: key,
        fields: Object.keys(value).sort(),
      });
    } else {
      // Otherwise it's a scalar field
      scalars.push(key);
    }
  }

  // Return organized, alphabetically sorted results
  return {
    scalars: scalars.sort(),
    loops: loops.sort((a, b) => a.name.localeCompare(b.name)),
  };
}

/**
 * Lists all available .docx templates in the templates directory
 * 
 * @returns {array} Array of template objects with name and filename:
 *   [{ name: "invoice", filename: "invoice.docx" }, ...]
 */
export function listTemplates() {
  const root = getTemplatesRoot();

  // Return empty array if templates directory doesn't exist
  if (!fs.existsSync(root)) {
    return [];
  }

  // Read directory and filter for .docx files only
  return fs
    .readdirSync(root, { withFileTypes: true })
    .filter((entry) => entry.isFile() && entry.name.toLowerCase().endsWith(".docx"))
    .map((entry) => ({
      name: entry.name.replace(/\.docx$/i, ""),
      filename: entry.name,
    }))
    .sort((a, b) => a.name.localeCompare(b.name));
}

/**
 * Inspects a template and returns all variable placeholders it contains
 * 
 * This helps API consumers understand what data must be provided when
 * generating documents from this template.
 * 
 * Process:
 * 1. Validate template name
 * 2. Load template file
 * 3. Use docxtemplater's InspectModule to discover all variables
 * 4. Organize variables into scalars and loops
 * 5. Return organized summary
 * 
 * @param {string} templateName - Name of template to inspect
 * @param {object} options - Options object
 *   - raw: If true, returns raw allTags structure (for debugging)
 * @returns {object} Template structure:
 *   {
 *     allTags: {...},     // Raw tag structure (if raw=true)
 *     scalars: [...],     // Simple variable names
 *     loops: [...]        // Repeating sections with their fields
 *   }
 * @throws {Error} If template not found (404), parsing fails (500)
 */
export function getTemplateTags(templateName, options = {}) {
  const safeTemplateName = assertSafeTemplateName(templateName);
  const templatePath = getTemplatePath(safeTemplateName);

  // Verify template exists
  if (!fs.existsSync(templatePath)) {
    const error = new Error(`Template not found: ${safeTemplateName}`);
    error.statusCode = 404;
    throw error;
  }

  // Read template and set up inspection
  const content = fs.readFileSync(templatePath, "binary");
  const zip = new PizZip(content);
  const inspectModule = InspectModule();

  try {
    // Initialize docxtemplater with InspectModule to discover variables
    new Docxtemplater(zip, {
      modules: [inspectModule],
      paragraphLoop: true,
      linebreaks: true,
    });
  } catch (error) {
    const wrapped = new Error(`Failed to parse template: ${error.message}`);
    wrapped.statusCode = 500;
    throw wrapped;
  }

  // Extract all tags/variables discovered in the template
  const allTags = inspectModule.getAllTags();
  
  // Get structured tags - use getAllStructuredTags if available, fall back to getStructuredTags
  const structuredTags =
    typeof inspectModule.getAllStructuredTags === "function"
      ? inspectModule.getAllStructuredTags()
      : inspectModule.getStructuredTags();

  const response = {
    template: safeTemplateName,
    summary: buildSummaryFromAllTags(allTags),
  };

  // If raw option requested, include raw tag structure for debugging purposes
  if (options.raw) {
    response.raw = {
      allTags,
      structuredTags,
    };
  }

  return response;
}