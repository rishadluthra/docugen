import fs from "fs";
import path from "path";
import PizZip from "pizzip";
import Docxtemplater from "docxtemplater";
import InspectModule from "docxtemplater/js/inspect-module.js";
import { templatesDir } from "../config/env.js";

function getTemplatesRoot() {
  return path.resolve(process.cwd(), templatesDir);
}

function getTemplatePath(templateName) {
  return path.resolve(getTemplatesRoot(), `${templateName}.docx`);
}

function assertSafeTemplateName(templateName) {
  if (typeof templateName !== "string" || !templateName.trim()) {
    const error = new Error("template must be a non-empty string");
    error.statusCode = 400;
    throw error;
  }

  const normalized = templateName.trim();

  if (!/^[a-zA-Z0-9_-]+$/.test(normalized)) {
    const error = new Error(
      "template may only contain letters, numbers, underscores, and hyphens"
    );
    error.statusCode = 400;
    throw error;
  }

  return normalized;
}

function buildSummaryFromAllTags(allTags) {
  const scalars = [];
  const loops = [];

  for (const [key, value] of Object.entries(allTags || {})) {
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
      scalars.push(key);
    }
  }

  return {
    scalars: scalars.sort(),
    loops: loops.sort((a, b) => a.name.localeCompare(b.name)),
  };
}

export function listTemplates() {
  const root = getTemplatesRoot();

  if (!fs.existsSync(root)) {
    return [];
  }

  return fs
    .readdirSync(root, { withFileTypes: true })
    .filter((entry) => entry.isFile() && entry.name.toLowerCase().endsWith(".docx"))
    .map((entry) => ({
      name: entry.name.replace(/\.docx$/i, ""),
      filename: entry.name,
    }))
    .sort((a, b) => a.name.localeCompare(b.name));
}

export function getTemplateTags(templateName, options = {}) {
  const safeTemplateName = assertSafeTemplateName(templateName);
  const templatePath = getTemplatePath(safeTemplateName);

  if (!fs.existsSync(templatePath)) {
    const error = new Error(`Template not found: ${safeTemplateName}`);
    error.statusCode = 404;
    throw error;
  }

  const content = fs.readFileSync(templatePath, "binary");
  const zip = new PizZip(content);
  const inspectModule = InspectModule();

  try {
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

  const allTags = inspectModule.getAllTags();
  const structuredTags =
    typeof inspectModule.getAllStructuredTags === "function"
      ? inspectModule.getAllStructuredTags()
      : inspectModule.getStructuredTags();

  const response = {
    template: safeTemplateName,
    summary: buildSummaryFromAllTags(allTags),
  };

  if (options.raw) {
    response.raw = {
      allTags,
      structuredTags,
    };
  }

  return response;
}