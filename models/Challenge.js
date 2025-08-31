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

ChallengeSchema.virtual("updated_startDate").get(function () {
  return moment.tz(this.startDate, "YYYY MM DD").format().split("T")[0];
});

ChallengeSchema.virtual("updated_endDate").get(function () {
  return moment.tz(this.endDate, "YYYY MM DD").format().split("T")[0];
});

ChallengeSchema.virtual("status").get(function () {
  const currentDate = new Date();
  const startDate = new Date(this.startDate); // Example start date
  const endDate = new Date(this.endDate);
  endDate.setDate(endDate.getDate() + 1);
  if (currentDate >= startDate && currentDate < endDate) {
    return "ongoing";
  } else if (currentDate < startDate) {
    return "not start";
  } else {
    return "finished";
  }
});

ChallengeSchema.virtual("currentDay").get(function () {
  const currentDate = new Date();
  const startDate = new Date(this.startDate); // Example start date
  const endDate = new Date(this.endDate);
  endDate.setDate(endDate.getDate() + 1);
  if (currentDate >= endDate) return this.dailyTasks.length;
  if (currentDate >= startDate && currentDate < endDate) {
    return currentDate.getDate() - startDate.getDate() + 1;
  } else if (currentDate < startDate) {
    return 0;
  }
});

module.exports = mongoose.model("Challenge", ChallengeSchema);
