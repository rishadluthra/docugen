import express from "express";

const router = express.Router();

router.post("/generate-document", (req, res) => {
  res.json({ message: "Route is wired up" });
});

export default router;