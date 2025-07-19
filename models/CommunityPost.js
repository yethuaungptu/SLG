const mongoose = require("mongoose");
const Schema = mongoose.Schema;
var moment = require("moment-timezone");

const CommunityPostSchema = new Schema({
  communityId: {
    type: Schema.Types.ObjectId,
    ref: "Community",
    required: true,
  },
  userId: {
    type: Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  post: {
    type: String,
    required: true,
  },
  comments: [
    {
      userId: {
        type: Schema.Types.ObjectId,
        ref: "User",
        required: true,
      },
      content: {
        type: String,
        required: true,
      },
      created: {
        type: Date,
        default: moment.utc(Date.now()).tz("Asia/Yangon").format(),
      },
    },
  ],

  isDeleted: {
    type: Boolean,
    default: false,
  },

  created: {
    type: Date,
    default: moment.utc(Date.now()).tz("Asia/Yangon").format(),
  },
  updated: {
    type: Date,
    default: moment.utc(Date.now()).tz("Asia/Yangon").format(),
  },
});

module.exports = mongoose.model("CommunityPost", CommunityPostSchema);
