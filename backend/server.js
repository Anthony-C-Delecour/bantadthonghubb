import express from "express";
import cors from "cors";
import chatRoute from "./routes/chat.js";
import itineraryRoute from "./routes/itinerary.js";
import polaroidRoute from "./routes/polaroid.js";

const app = express();
app.use(cors());
app.use(express.json({ limit: "10mb" }));

app.use("/api/chat", chatRoute);
app.use("/api/itinerary", itineraryRoute);
app.use("/api/polaroid", polaroidRoute);

app.listen(3001, () => console.log("Backend running on http://localhost:3001"));