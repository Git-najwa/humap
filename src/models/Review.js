import mongoose from "mongoose";

const { Schema } = mongoose;

const reviewSchema = new Schema(
  {
    activity_id: { type: Schema.Types.ObjectId, ref: "Activity", required: true },
    user_id: { type: Schema.Types.ObjectId, ref: "User", required: true },
    comment: { type: String, trim: true },
    ranking: { type: Number, min: 1, max: 5, required: true },
    pictures: [{ type: String }],
  },
  { timestamps: { createdAt: "created_at", updatedAt: "updated_at" } }
);

export default mongoose.model("Review", reviewSchema);
