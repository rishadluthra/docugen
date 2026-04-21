/*
 * Builds a unique output filename for a generated document
 * 
 * Format: {templateName}_{ISO_TIMESTAMP}.docx
 * Example: invoice_2026-04-20T14-30-45-125Z.docx
 * 
 * @param {string} templateName - The name of the template used to generate the document
 * @returns {string} A unique filename with timestamp
 */
export function buildOutputFilename(templateName) {
  // Convert ISO timestamp to filesystem-safe format by replacing colons and dots with hyphens
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  return `${templateName}_${timestamp}.docx`;
}