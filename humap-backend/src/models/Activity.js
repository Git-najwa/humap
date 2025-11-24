import mongoose from "mongoose";

const { Schema } = mongoose;

const activitySchema = new Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, trim: true },
    location: { type: String, required: true, trim: true },
    coordinates: {
      type: { type: String, enum: ["Point"], default: "Point" },
      coordinates: { type: [Number], index: "2dsphere" },
    },
    mood: { type: String, trim: true },
    nb_people: { type: Number },
    price_range: { type: Number, min: 0, max: 3 },
    age_range: { type: String, trim: true },
    hours: { type: Number },
    day: { type: String, trim: true },
    user_id: { type: Schema.Types.ObjectId, ref: "User" },
    source: { type: String, enum: ["user", "google"], default: "user" },
  },
  { timestamps: { createdAt: "created_at", updatedAt: "updated_at" } }
);

activitySchema.index({ title: "text", description: "text" });

export default mongoose.model("Activity", activitySchema);
