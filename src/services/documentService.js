import fs from "fs";
import path from "path";
import PizZip from "pizzip";
import Docxtemplater from "docxtemplater";
import { outputDir, templatesDir } from "../config/env.js";

function getTemplatePath(templateName) {
  return path.resolve(process.cwd(), templatesDir, `${templateName}.docx`);
}

function ensureOutputDirExists() {
  const resolvedOutputDir = path.resolve(process.cwd(), outputDir);

  if (!fs.existsSync(resolvedOutputDir)) {
    fs.mkdirSync(resolvedOutputDir, { recursive: true });
  }

  return resolvedOutputDir;
}

export function renderTemplateToBuffer(templateName, data) {
  const templatePath = getTemplatePath(templateName);

  if (!fs.existsSync(templatePath)) {
    const error = new Error(`Template not found: ${templateName}`);
    error.statusCode = 404;
    throw error;
  }

  const content = fs.readFileSync(templatePath, "binary");
  const zip = new PizZip(content);

  let doc;
  try {
    doc = new Docxtemplater(zip, {
      paragraphLoop: true,
      linebreaks: true,
    });
  } catch (error) {
    const wrapped = new Error(`Failed to parse template: ${error.message}`);
    wrapped.statusCode = 500;
    throw wrapped;
  }

  try {
    doc.render(data);
  } catch (error) {
    const wrapped = new Error(`Failed to render template: ${error.message}`);
    wrapped.statusCode = 400;
    throw wrapped;
  }

  return doc.toBuffer();
}

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