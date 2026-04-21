/**
 * DOCUMENT RENDERING SERVICE
 * 
 * Service for generating Word documents (.docx files) from templates.
 * Uses the docxtemplater library to:
 * 1. Load Word template files
 * 2. Replace template variables with provided data
 * 3. Save the rendered document to disk
 * 
 * How it works:
 * - Template files are stored in the templates/ directory
 * - Each template contains variable placeholders (e.g., {{firstName}}, {{items}})
 * - Data is merged into templates using docxtemplater
 * - Generated documents are saved to the output/ directory with timestamps
 */

import fs from "fs";
import path from "path";
import PizZip from "pizzip";
import Docxtemplater from "docxtemplater";
import { outputDir, templatesDir } from "../config/env.js";

/**
 * Resolves the full filesystem path to a template file
 * @param {string} templateName - Template name without .docx extension
 * @returns {string} Absolute filesystem path to the template
 */
function getTemplatePath(templateName) {
  return path.resolve(process.cwd(), templatesDir, `${templateName}.docx`);
}

/**
 * Ensures the output directory exists, creating it if necessary
 * @returns {string} Absolute path to the output directory
 */
function ensureOutputDirExists() {
  const resolvedOutputDir = path.resolve(process.cwd(), outputDir);

  if (!fs.existsSync(resolvedOutputDir)) {
    fs.mkdirSync(resolvedOutputDir, { recursive: true });
  }

  return resolvedOutputDir;
}

/**
 * Renders a Word template with provided data and returns the result as a Buffer
 * 
 * Process:
 * 1. Locate and load the template file
 * 2. Create a PizZip instance to read the .docx structure
 * 3. Initialize docxtemplater with the template
 * 4. Merge data into template variables
 * 5. Return the rendered document as a Buffer
 * 
 * @param {string} templateName - Name of the template file (without .docx extension)
 * @param {object} data - Object containing data to fill template variables
 *                        Supports both scalar values and nested loops
 * @returns {Buffer} The rendered document as a binary buffer
 * @throws {Error} If template not found (404), parsing fails (500), or rendering fails (400)
 */
export function renderTemplateToBuffer(templateName, data) {
  const templatePath = getTemplatePath(templateName);

  // Check if template file exists
  if (!fs.existsSync(templatePath)) {
    const error = new Error(`Template not found: ${templateName}`);
    error.statusCode = 404;
    throw error;
  }

  // Read template file in binary format (required for .docx processing)
  const content = fs.readFileSync(templatePath, "binary");
  const zip = new PizZip(content);

  // Initialize docxtemplater with template
  let doc;
  try {
    doc = new Docxtemplater(zip, {
      paragraphLoop: true, // Enables looping over paragraph-level blocks
      linebreaks: true,    // Preserves line breaks in merged data
    });
  } catch (error) {
    const wrapped = new Error(`Failed to parse template: ${error.message}`);
    wrapped.statusCode = 500;
    throw wrapped;
  }

  // Merge data into template and render
  try {
    doc.render(data);
  } catch (error) {
    const wrapped = new Error(`Failed to render template: ${error.message}`);
    wrapped.statusCode = 400; // 400 indicates invalid data for this template
    throw wrapped;
  }

  return doc.toBuffer();
}

/**
 * Saves a document buffer to disk in the output directory
 * 
 * @param {string} filename - Filename to save as (should include .docx extension)
 * @param {Buffer} buffer - The document buffer to save
 * @returns {object} Object containing:
 *   - filename: The filename saved
 *   - absolutePath: Full filesystem path
 *   - relativePath: Relative path from project root (for API responses)
 */
export function saveBufferToFile(filename, buffer) {
  const resolvedOutputDir = ensureOutputDirExists();
  const absolutePath = path.resolve(resolvedOutputDir, filename);

  fs.writeFileSync(absolutePath, buffer);

  return {
    filename,
    absolutePath,
    relativePath: path.join("output", filename),
  };
}