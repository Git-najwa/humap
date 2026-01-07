import express from "express";
import Activity from "../models/Activity.js";
import auth from "../middlewares/auth.js";

const router = express.Router();

const normalizeLimit = (value) => {
  const limit = parseInt(value, 10);
  if (Number.isNaN(limit)) return 25;
  return Math.min(Math.max(limit, 1), 100);
};

router.get("/opentripmap", auth, async (req, res, next) => {
  try {
    const { lat, lon, radius = "1000", kinds = "", limit, save = "false" } = req.query;

    if (!lat || !lon) {
      return res.status(400).json({ message: "lat and lon are required" });
    }

    if (!process.env.RAPIDAPI_KEY || !process.env.RAPIDAPI_HOST) {
      return res.status(500).json({ message: "RapidAPI credentials are not configured" });
    }

    const baseUrl = process.env.RAPIDAPI_BASE_URL || "https://places1.p.rapidapi.com";
    const path = process.env.RAPIDAPI_PATH || "/en/places/radius";
    const url = new URL(`${baseUrl}${path}`);
    url.searchParams.set("lat", lat);
    url.searchParams.set("lon", lon);
    url.searchParams.set("radius", radius);
    url.searchParams.set("limit", normalizeLimit(limit).toString());
    if (kinds) url.searchParams.set("kinds", kinds);

    const response = await fetch(url.toString(), {
      method: "GET",
      headers: {
        "X-RapidAPI-Key": process.env.RAPIDAPI_KEY,
        "X-RapidAPI-Host": process.env.RAPIDAPI_HOST,
      },
    });

    if (!response.ok) {
      const text = await response.text();
      return res.status(response.status).json({ message: text });
    }

    const data = await response.json();
    const features = Array.isArray(data?.features) ? data.features : [];

    const mapped = features.map((feature) => ({
      external_id: feature?.properties?.xid || null,
      source: "opentripmap",
      title: feature?.properties?.name || "Lieu sans nom",
      description: feature?.properties?.kinds || "Activité importée",
      location: feature?.properties?.name || "Lieu",
      coordinates: {
        type: "Point",
        coordinates: [
          feature?.geometry?.coordinates?.[0],
          feature?.geometry?.coordinates?.[1],
        ],
      },
    }));

    const shouldSave = String(save).toLowerCase() === "true";
    if (!shouldSave) {
      return res.json({ items: mapped });
    }

    const created = [];
    for (const item of mapped) {
      if (!item.external_id || !Array.isArray(item.coordinates.coordinates)) {
        continue;
      }
      const existing = await Activity.findOne({
        external_id: item.external_id,
        source: "opentripmap",
      });
      if (existing) {
        created.push(existing);
        continue;
      }
      const activity = await Activity.create({
        ...item,
        user_id: req.currentUserId,
      });
      created.push(activity);
    }

    return res.json({ items: created });
  } catch (error) {
    next(error);
  }
});

export default router;
