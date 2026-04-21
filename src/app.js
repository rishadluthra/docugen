import express from "express";
import generateDocumentRouter from "./routes/generateDocument.js";
import templatesRouter from "./routes/templates.js";

const app = express();

app.set("json spaces", 2);
app.use(express.json());

app.get("/health", (req, res) => {
  res.json({ ok: true });
});

app.use("/", generateDocumentRouter);
app.use("/", templatesRouter);

export default app;