export function buildOutputFilename(templateName) {
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  return `${templateName}_${timestamp}.docx`;
}