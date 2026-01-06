import mongoose from "mongoose";

const { Schema } = mongoose;

const activitySchema = new Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, trim: true },
    location: { type: String, required: true, trim: true },
    coordinates: {
      type: {
        type: String,
        enum: ["Point"],
        required: true,
        default: "Point",
      },
      coordinates: {
        type: [Number], // [lng, lat]
        required: true,
        validate: {
          validator: (arr) => Array.isArray(arr) && arr.length === 2,
          message: "coordinates.coordinates must be [lng, lat]",
        },
      },
    },
    mood: { type: String, trim: true },
    nb_people: { type: Number },
    // Budget libre côté frontend : aucune restriction maximale côté modèle
    price_range: { type: Number, min: 0 },
    age_range: { type: String, trim: true },
    hours: { type: Number },
    day: { type: String, trim: true },
    user_id: { type: Schema.Types.ObjectId, ref: "User" },
    source: { type: String, enum: ["user", "google"], default: "user" },
  },
  { timestamps: { createdAt: "created_at", updatedAt: "updated_at" } }
);

// Index texte pour recherche
activitySchema.index({ title: "text", description: "text" });

// Index géospatial pour les recherches "near"
activitySchema.index({ coordinates: "2dsphere" });

export default mongoose.model("Activity", activitySchema);
