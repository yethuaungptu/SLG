const mongoose = require("mongoose");
const Schema = mongoose.Schema;
var moment = require("moment-timezone");

const dailyTaskSchema = new Schema({
  day: {
    type: Number,
    required: true,
  },
  title: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  completedBy: [{ type: Schema.Types.ObjectId, ref: "User" }],
});

const participantSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: "User" },
  currentDay: {
    type: Number,
    required: true,
  },
  completedDays: [Number],
  status: {
    type: String,
    enum: ["in_progress", "completed"],
    default: "in_progress",
  },
});

const ChallengeSchema = new Schema({
  name: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  startDate: {
    type: Date,
    required: true,
  },
  endDate: {
    type: Date,
    required: true,
  },
  category: {
    type: String,
    required: true,
  },
  difficulty: {
    type: String,
    required: true,
  },
  point: {
    type: Number,
    required: true,
  },
  image: {
    type: String,
  },
  benefit: {
    type: String,
    required: true,
  },
  isFeatured: {
    type: Boolean,
    default: false,
  },
  isDeleted: {
    type: Boolean,
    default: false,
  },
  dailyTasks: [dailyTaskSchema],
  participants: [participantSchema],

  created: {
    type: Date,
    default: moment.utc(Date.now()).tz("Asia/Yangon").format(),
  },
  updated: {
    type: Date,
    default: moment.utc(Date.now()).tz("Asia/Yangon").format(),
  },
});

module.exports = mongoose.model("Challenge", ChallengeSchema);
