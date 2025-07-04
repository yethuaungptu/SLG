const mongoose = require("mongoose");
const Schema = mongoose.Schema;
var moment = require("moment-timezone");

const dailyTaskSchema = new Schema({
  day: Number,
  title: String,
  description: String,
  completedBy: [{ type: Schema.Types.ObjectId, ref: "User" }],
});

const participantSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: "User" },
  currentDay: Number,
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
  points: {
    type: Number,
    required: true,
  },
  image: {
    type: String,
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
