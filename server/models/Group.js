import mongoose from "mongoose";
export const MAX_GROUP_MEMBERS = 20;

const memberSchema = new mongoose.Schema(
  {
    user_id: { type: String, ref: "User", required: true },
    role: { type: String, enum: ["admin", "member"], default: "member" },
    joined_at: { type: Date, default: Date.now },
  },
  { _id: false },
);

const groupSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    photo: { type: String, default: "" },
    members: [memberSchema],
    created_by: { type: String, ref: "User", required: true },
  },
  { timestamps: true, minimize: false },
);

const Group = mongoose.model("Group", groupSchema);
export default Group;