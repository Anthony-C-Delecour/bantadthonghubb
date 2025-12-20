import express from "express";
import { callGemini } from "../services/gemini.js";

const router = express.Router();

router.post("/", async (req, res) => {
  const { messages } = req.body;
  const reply = await callGemini(messages);
  res.json({ reply });
});

export default router;