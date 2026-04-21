import express from "express";
import generateDocumentRouter from "./routes/generateDocument.js";
import templatesRouter from "./routes/templates.js";

const app = express();

app.set("json spaces", 2);
app.use(express.json());

/**
 * Health Check Endpoint
 * Endpoint: GET /health
 * Purpose: Monitor application availability
 * Response: { ok: true } if server is running
 */
app.get("/health", (req, res) => {
  res.json({ ok: true });
});

// Mount API routes
// - generateDocumentRouter: Handles document generation endpoint
// - templatesRouter: Handles template listing and inspection endpoints
app.use("/", generateDocumentRouter);
app.use("/", templatesRouter);

export default app;