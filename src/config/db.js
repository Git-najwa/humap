import mongoose from "mongoose";
import createDebugger from "debug";

const debug = createDebugger("humap:database");
const dbUrl = process.env.DATABASE_URL || "mongodb://localhost/humap";
export const port = process.env.PORT || 3000;

export async function connectDb() {
  try {
    await mongoose.connect(dbUrl);
    debug("✅ MongoDB connecté");
  } catch (error) {
    debug("❌ Erreur de connexion MongoDB :", error);
    throw error;
  }
}
