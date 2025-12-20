import express from "express";
import { callGemini } from "../services/gemini.js";

const router = express.Router();

router.post("/", async (req, res) => {
  const { location, days, preferences } = req.body;

  const prompt = `
Create a ${days}-day itinerary for ${location}.
Preferences: ${preferences}.
Return JSON.
`;

  const plan = await callGemini([{ role: "user", content: prompt }]);
  res.json(JSON.parse(plan));
});

export default router;