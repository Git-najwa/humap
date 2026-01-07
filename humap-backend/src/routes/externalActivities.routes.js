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
  return res.status(410).json({ message: "OpenTripMap import is deprecated. Use /external-activities/geoapify instead." });
});

router.get("/geoapify", auth, async (req, res, next) => {
  try {
    const {
      lat,
      lon,
      radius = "2000",
      categories = "tourism.sights,natural,leisure,entertainment",
      limit,
      save = "false",
    } = req.query;

    if (!lat || !lon) {
      return res.status(400).json({ message: "lat and lon are required" });
    }

    if (!process.env.GEOAPIFY_API_KEY) {
      return res.status(500).json({ message: "Geoapify API key is not configured" });
    }

    const url = new URL("https://api.geoapify.com/v2/places");
    url.searchParams.set("categories", categories);
    url.searchParams.set("filter", `circle:${lon},${lat},${radius}`);
    url.searchParams.set("limit", normalizeLimit(limit).toString());
    url.searchParams.set("apiKey", process.env.GEOAPIFY_API_KEY);

    const response = await fetch(url.toString(), { method: "GET" });
    if (!response.ok) {
      const text = await response.text();
      return res.status(response.status).json({ message: text });
    }

    const data = await response.json();
    const features = Array.isArray(data?.features) ? data.features : [];

    const mapped = features.map((feature) => ({
      external_id: feature?.properties?.place_id || null,
      source: "geoapify",
      title: feature?.properties?.name || "Lieu sans nom",
      description: Array.isArray(feature?.properties?.categories)
        ? feature.properties.categories.join(", ")
        : "Activité importée",
      location:
        feature?.properties?.address_line1 ||
        feature?.properties?.formatted ||
        "Lieu",
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
        source: "geoapify",
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
