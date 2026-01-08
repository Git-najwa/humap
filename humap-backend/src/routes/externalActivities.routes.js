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
      categories = "tourism,leisure,entertainment,education,commercial,service,accommodation,catering,natural,public_transport",
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

    const toLabel = (value) => {
      const last = String(value || "").split(".").pop() || "";
      return last.replace(/_/g, " ").replace(/\b\w/g, (m) => m.toUpperCase());
    };
    const pickBudget = (rawCategories) => {
      const haystack = rawCategories.join(" ").toLowerCase();
      if (haystack.includes("no_fee") || haystack.includes("free")) return 0;
      if (haystack.includes("accommodation") || haystack.includes("hotel")) return 3;
      if (
        haystack.includes("catering") ||
        haystack.includes("restaurant") ||
        haystack.includes("bar") ||
        haystack.includes("cafe")
      ) {
        return 2;
      }
      if (
        haystack.includes("museum") ||
        haystack.includes("gallery") ||
        haystack.includes("theatre") ||
        haystack.includes("cinema") ||
        haystack.includes("entertainment") ||
        haystack.includes("sport")
      ) {
        return 1;
      }
      if (haystack.includes("shopping") || haystack.includes("commercial")) return 2;
      return null;
    };
    const pickMood = (rawCategories) => {
      const haystack = rawCategories.join(" ").toLowerCase();
      if (
        haystack.includes("natural") ||
        haystack.includes("park") ||
        haystack.includes("garden") ||
        haystack.includes("beach") ||
        haystack.includes("forest") ||
        haystack.includes("mountain") ||
        haystack.includes("camp")
      ) {
        return "calm";
      }
      if (
        haystack.includes("sport") ||
        haystack.includes("fitness") ||
        haystack.includes("adventure") ||
        haystack.includes("hiking") ||
        haystack.includes("climbing") ||
        haystack.includes("water")
      ) {
        return "energetic";
      }
      if (
        haystack.includes("catering") ||
        haystack.includes("restaurant") ||
        haystack.includes("bar") ||
        haystack.includes("cafe") ||
        haystack.includes("nightlife") ||
        haystack.includes("entertainment") ||
        haystack.includes("cinema") ||
        haystack.includes("theatre") ||
        haystack.includes("music")
      ) {
        return "social";
      }
      if (haystack.includes("culture") || haystack.includes("museum") || haystack.includes("gallery")) return "calm";
      return null;
    };

    const mapped = features.map((feature) => {
      const rawCategories = Array.isArray(feature?.properties?.categories)
        ? feature.properties.categories
        : [];
      const cleanCategories = rawCategories
        .map(toLabel)
        .filter(Boolean)
        .filter((value, index, arr) => arr.indexOf(value) === index)
        .slice(0, 3);

      const image =
        feature?.properties?.wiki_and_media?.image ||
        feature?.properties?.datasource?.raw?.image ||
        feature?.properties?.datasource?.raw?.image_thumbnail ||
        null;

      const description =
        feature?.properties?.description ||
        (cleanCategories.length ? cleanCategories.join(" • ") : null);

      return {
        external_id: feature?.properties?.place_id || null,
        source: "geoapify",
        title: feature?.properties?.name || "Lieu sans nom",
        description,
        location:
          feature?.properties?.address_line1 ||
          feature?.properties?.formatted ||
          "Lieu",
        mood: pickMood(rawCategories),
        price_range: pickBudget(rawCategories),
        categories: cleanCategories,
        photos: image ? [image] : [],
        coordinates: {
          type: "Point",
          coordinates: [
            feature?.geometry?.coordinates?.[0],
            feature?.geometry?.coordinates?.[1],
          ],
        },
      };
    });

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
        let changed = false;
        if ((!existing.categories || existing.categories.length === 0) && item.categories?.length) {
          existing.categories = item.categories;
          changed = true;
        }
        if (existing.price_range === undefined || existing.price_range === null) {
          existing.price_range = item.price_range;
          changed = true;
        }
        if (!existing.mood && item.mood) {
          existing.mood = item.mood;
          changed = true;
        }
        if ((!existing.photos || existing.photos.length === 0) && item.photos?.length) {
          existing.photos = item.photos;
          changed = true;
        }
        if ((!existing.description || existing.description.trim() === "") && item.description) {
          existing.description = item.description;
          changed = true;
        }
        if (changed) {
          await existing.save();
        }
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
