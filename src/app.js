import express from "express";
import generateDocumentRouter from "./routes/generateDocument.js";

const app = express();

app.use(express.json());

app.get("/health", (req, res) => {
  res.json({ ok: true });
});

app.use("/", generateDocumentRouter);

export default app;