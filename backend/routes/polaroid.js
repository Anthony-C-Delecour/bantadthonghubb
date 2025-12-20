import express from "express";
import sharp from "sharp";

const router = express.Router();

router.post("/", async (req, res) => {
  const image = Buffer.from(req.body.image, "base64");

  const output = await sharp(image)
    .resize(800, 800)
    .extend({
      top: 40,
      bottom: 140,
      left: 40,
      right: 40,
      background: "white"
    })
    .modulate({ brightness: 1.05, saturation: 0.9 })
    .jpeg()
    .toBuffer();

  res.type("image/jpeg").send(output);
});

export default router;