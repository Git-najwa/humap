import bcrypt from "bcrypt";
import mongoose from "mongoose";

const { Schema } = mongoose;
const BCRYPT_COST_FACTOR = 10;

const userSchema = new Schema(
  {
    username: { type: String, required: true, trim: true },
    gender: { type: String, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    avatar: { type: String, trim: true },
    password: { type: String, required: true },
    nb_reviews: { type: Number, default: 0 },
    role: { type: String, enum: ["user", "admin"], default: "user" },
  },
  {
    timestamps: { createdAt: "created_at", updatedAt: "updated_at" },
  }
);

userSchema.pre("save", async function hashPassword(next) {
  if (!this.isModified("password")) return next();
  try {
    this.password = await bcrypt.hash(this.password, BCRYPT_COST_FACTOR);
    next();
  } catch (error) {
    next(error);
  }
});

userSchema.methods.comparePassword = function comparePassword(plainPassword) {
  return bcrypt.compare(plainPassword, this.password);
};

userSchema.set("toJSON", {
  versionKey: false,
  transform: function removePassword(doc, json) {
    delete json.password;
    return json;
  },
});

export default mongoose.model("User", userSchema);
