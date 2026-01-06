import mongoose from "mongoose";

const { Schema } = mongoose;

const userActivityListSchema = new Schema(
  {
    user_id: { type: Schema.Types.ObjectId, ref: "User", required: true },
    activity_id: {
      type: Schema.Types.ObjectId,
      ref: "Activity",
      required: function () {
        return this.list_type !== "custom";
      },
    },
    list_type: { type: String, enum: ["history", "liked", "custom"], required: true },
    custom_name: { type: String, trim: true },
  },
  { timestamps: { createdAt: "created_at", updatedAt: "updated_at" } }
);

export default mongoose.model("UserActivityList", userActivityListSchema);
