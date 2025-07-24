const mongoose = require("mongoose");
const Schema = mongoose.Schema;
var moment = require("moment-timezone");

const memberSchema = new Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  joinedAt: {
    type: Date,
    default: moment.utc(Date.now()).tz("Asia/Yangon").format(),
  },
  role: { type: String, enum: ["member", "admin"], default: "member" },
});

const CommunitySchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  description: { type: String },
  image: { type: String }, // URL to cover/logo

  createdBy: {
    type: Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  created: {
    type: Date,
    default: moment.utc(Date.now()).tz("Asia/Yangon").format(),
  },

  topics: [String],
  rules: [String],

  members: [memberSchema],

  stats: {
    conservationCount: { type: Number, default: 0 },
    membersCount: { type: Number, default: 0 },
    likesCount: { type: Number, default: 0 },
  },

  isPublic: { type: Boolean, default: true },
  status: {
    type: String,
    enum: ["active", "inactive", "archived"],
    default: "active",
  },
  isDeleted: {
    type: Boolean,
    default: false,
  },
});

// CommunitySchema.virtual("updated_createdDate").get(function () {
//   return moment.tz(this.created, "YYYY MM DD").format().split("T")[0];
// });

module.exports = mongoose.model("Community", CommunitySchema);
