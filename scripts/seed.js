import path from "node:path";
import { fileURLToPath } from "node:url";
import dotenv from "dotenv";
import mongoose from "mongoose";
import User from "../humap-backend/src/models/User.js";
import Activity from "../humap-backend/src/models/Activity.js";
import Review from "../humap-backend/src/models/Review.js";
import UserActivityList from "../humap-backend/src/models/UserActivityList.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, "../humap-backend/.env") });

const GEO_DEFAULT = { lat: 46.5197, lon: 6.6323, radius: 4000, limit: 30 };

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

const mapGeoapifyFeature = (feature, ownerId) => {
  const rawCategories = Array.isArray(feature?.properties?.categories) ? feature.properties.categories : [];
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

  const description = feature?.properties?.description || (cleanCategories.length ? cleanCategories.join(" - ") : null);

  return {
    external_id: feature?.properties?.place_id || null,
    source: "geoapify",
    user_id: ownerId || null,
    title: feature?.properties?.name || "Lieu sans nom",
    description,
    location: feature?.properties?.address_line1 || feature?.properties?.formatted || "Lieu",
    mood: pickMood(rawCategories),
    price_range: pickBudget(rawCategories),
    nb_people_min: 1,
    nb_people_max: 8,
    categories: cleanCategories,
    photos: image ? [image] : [],
    coordinates: {
      type: "Point",
      coordinates: [feature?.geometry?.coordinates?.[0], feature?.geometry?.coordinates?.[1]],
    },
  };
};

async function fetchGeoapifyPlaces(ownerId) {
  if (!global.fetch) {
    throw new Error("Global fetch is not available. Use Node >= 18.");
  }
  if (!process.env.GEOAPIFY_API_KEY) {
    console.warn("GEOAPIFY_API_KEY is missing. Skipping remote import.");
    return [];
  }

  const categorySets = [
    "tourism,leisure,entertainment,education,commercial,service,accommodation,catering,natural,public_transport",
    "catering,entertainment,tourism,leisure,commercial",
    "catering.cafe,catering.restaurant,leisure.park,tourism.attraction",
  ];

  for (const categories of categorySets) {
    const url = new URL("https://api.geoapify.com/v2/places");
    url.searchParams.set("categories", categories);
    url.searchParams.set("filter", `circle:${GEO_DEFAULT.lon},${GEO_DEFAULT.lat},${GEO_DEFAULT.radius}`);
    url.searchParams.set("limit", GEO_DEFAULT.limit.toString());
    url.searchParams.set("apiKey", process.env.GEOAPIFY_API_KEY);

    const response = await fetch(url.toString(), { method: "GET" });
    if (!response.ok) {
      const text = await response.text();
      throw new Error(`Geoapify responded with ${response.status}: ${text}`);
    }

    const data = await response.json();
    const features = Array.isArray(data?.features) ? data.features : [];
    if (!features.length) {
      continue;
    }

    const mapped = features
      .map((feature) => mapGeoapifyFeature(feature, ownerId))
      .filter((item) => item.external_id && Array.isArray(item.coordinates?.coordinates));

    const unique = new Map();
    mapped.forEach((item) => {
      if (!unique.has(item.external_id)) unique.set(item.external_id, item);
    });
    if (unique.size > 0) {
      return Array.from(unique.values());
    }
  }

  return [];
}

const curatedActivities = [
  {
    title: "Chateau de Chillon",
    description: "Forteresse au bord du Leman avec visites guidees",
    location: "Veytaux, Suisse",
    coordinates: { type: "Point", coordinates: [6.9273, 46.4095] },
    mood: "calm",
    price_range: 1,
    nb_people_min: 2,
    nb_people_max: 6,
    age_range: "8+",
    hours: 2.5,
    day: "dimanche",
    photos: ["https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800"],
    categories: ["history", "landmark", "culture"],
    source: "user",
  },
  {
    title: "Lavaux Terraces",
    description: "Randonnee douce a travers les vignobles inscrits UNESCO",
    location: "Lavaux, Suisse",
    coordinates: { type: "Point", coordinates: [6.7357, 46.4473] },
    mood: "energetic",
    price_range: 0,
    nb_people_min: 2,
    nb_people_max: 6,
    age_range: "12+",
    hours: 3,
    day: "samedi",
    photos: ["https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=800"],
    categories: ["hiking", "nature", "wine"],
    source: "user",
  },
  {
    title: "Ouchy Lakeside Walk",
    description: "Promenade en bord de lac avec vue sur les Alpes",
    location: "Lausanne, Suisse",
    coordinates: { type: "Point", coordinates: [6.6207, 46.5095] },
    mood: "calm",
    price_range: 0,
    nb_people_min: 1,
    nb_people_max: 4,
    age_range: "all",
    hours: 1.5,
    day: "samedi",
    photos: ["https://images.unsplash.com/photo-1505761671935-60b3a7427bad?w=800"],
    categories: ["outdoor", "nature", "scenic"],
    source: "user",
  },
  {
    title: "Bois de Sauvabelin",
    description: "Tour en bois et balade en foret sur les hauteurs de Lausanne",
    location: "Lausanne, Suisse",
    coordinates: { type: "Point", coordinates: [6.632, 46.535] },
    mood: "calm",
    price_range: 0,
    nb_people_min: 1,
    nb_people_max: 5,
    age_range: "all",
    hours: 2,
    day: "dimanche",
    photos: ["https://images.unsplash.com/photo-1470246973918-29a93221c455?w=800"],
    categories: ["forest", "viewpoint", "outdoor"],
    source: "user",
  },
  {
    title: "Gourmet Brunch",
    description: "Brunch local avec produits du terroir et vue sur le lac",
    location: "Pully, Suisse",
    coordinates: { type: "Point", coordinates: [6.661, 46.508] },
    mood: "social",
    price_range: 2,
    nb_people_min: 2,
    nb_people_max: 6,
    age_range: "12+",
    hours: 2,
    day: "dimanche",
    photos: ["https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=800"],
    categories: ["food", "brunch", "local"],
    source: "user",
  },
];

async function seed() {
  try {
    const dbUrl = process.env.DATABASE_URL || "mongodb://127.0.0.1:27017/humap";
    console.log("[seed] Start -", dbUrl);

    await mongoose.connect(dbUrl);
    console.log("[seed] Connected");

    console.log("[seed] Cleaning collections...");
    await Promise.all([
      User.deleteMany(),
      Activity.deleteMany(),
      Review.deleteMany(),
      UserActivityList.deleteMany(),
    ]);

    console.log("[seed] Inserting users...");
    const users = await User.create([
      { username: "superadmin", email: "superadmin@humap.dev", password: "SuperAdmin123!", role: "superadmin" },
      { username: "admin", email: "admin@humap.dev", password: "Admin123!", role: "admin" },
      { username: "alice", email: "alice@humap.dev", password: "Alice123!" },
      { username: "bob", email: "bob@humap.dev", password: "Bob123!" },
    ]);

    const ownerId = users[0]._id;

    console.log("[seed] Fetching Geoapify places...");
    let importedActivities = [];
    try {
      importedActivities = await fetchGeoapifyPlaces(ownerId);
      console.log(`[seed] Imported ${importedActivities.length} activities from Geoapify.`);
    } catch (error) {
      console.warn("[seed] Geoapify import skipped:", error.message);
    }

    console.log("[seed] Inserting curated and imported activities...");
    const activities = await Activity.create([
      ...curatedActivities.map((item) => ({ ...item, user_id: ownerId })),
      ...importedActivities,
    ]);

    console.log("[seed] Inserting reviews...");
    const reviewsSeed = [
      { activityIndex: 0, userIndex: 2, ranking: 5, comment: "Super moment" },
      { activityIndex: 1, userIndex: 3, ranking: 4, comment: "A refaire" },
      { activityIndex: 2, userIndex: 2, ranking: 4, comment: "Belle balade" },
      { activityIndex: 3, userIndex: 3, ranking: 5, comment: "Vue incroyable" },
      { activityIndex: 4, userIndex: 2, ranking: 4, comment: "Brunch top" },
    ];

    const reviewDocs = reviewsSeed
      .filter((r) => activities[r.activityIndex] && users[r.userIndex])
      .map((r) => ({
        activity_id: activities[r.activityIndex]._id,
        user_id: users[r.userIndex]._id,
        ranking: r.ranking,
        comment: r.comment,
      }));

    if (reviewDocs.length) {
      await Review.create(reviewDocs);
    }

    console.log("[seed] Inserting lists...");
    const listsSeed = [
      { userIndex: 2, activityIndex: 0, list_type: "liked" },
      { userIndex: 2, activityIndex: 1, list_type: "history" },
      { userIndex: 3, activityIndex: 2, list_type: "liked" },
      { userIndex: 3, activityIndex: 3, list_type: "custom", custom_name: "Weekend" },
    ];

    const listDocs = listsSeed
      .filter((l) => activities[l.activityIndex] && users[l.userIndex])
      .map((l) => ({
        user_id: users[l.userIndex]._id,
        activity_id: activities[l.activityIndex]._id,
        list_type: l.list_type,
        custom_name: l.custom_name,
      }));

    if (listDocs.length) {
      await UserActivityList.create(listDocs);
    }

    console.log("[seed] Done");
    console.log(` - Users: ${users.length}`);
    console.log(` - Activities: ${activities.length} (curated ${curatedActivities.length} + imported ${importedActivities.length})`);
    console.log(` - Reviews: ${reviewDocs.length}`);
    console.log(` - Lists: ${listDocs.length}`);
  } catch (error) {
    console.error("[seed] Error:", error);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect().catch(() => {});
    console.log("[seed] Connection closed");
  }
}

seed();
