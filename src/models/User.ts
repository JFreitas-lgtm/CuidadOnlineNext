import { Schema, model, models } from "mongoose";

const userSchema = new Schema({
  name: { type: String, required: true, trim: true, minlength: 2, maxlength: 120 },
  email: { type: String, required: true, lowercase: true, trim: true, unique: true, index: true },
  passwordHash: { type: String, required: true, select: false },
  role: { type: String, enum: ["user", "admin"], default: "user" },
  status: { type: String, enum: ["active", "disabled"], default: "active", index: true },
  theme: { type: String, enum: ["light", "dark"], default: "light" },
  lastLoginAt: Date,
}, { timestamps: true });

export const UserModel = models.User ?? model("User", userSchema);
