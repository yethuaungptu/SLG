const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const bcrypt = require("bcryptjs");
var moment = require("moment-timezone");

const UserSchema = new Schema({
  name: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
  },
  password: {
    type: String,
    required: true,
  },
  profile: {
    type: String,
  },
  point: {
    type: Number,
    default: 0,
  },
  bookmarkList: [
    {
      id: {
        type: Schema.Types.ObjectId,
        ref: "Tip",
      },
      created: {
        type: Date,
        default: moment.utc(Date.now()).tz("Asia/Yangon").format(),
      },
    },
  ],
  challengeList: [
    {
      id: {
        type: Schema.Types.ObjectId,
        ref: "Challenge",
      },
      created: {
        type: Date,
        default: moment.utc(Date.now()).tz("Asia/Yangon").format(),
      },
    },
  ],
  created: {
    type: Date,
    default: moment.utc(Date.now()).tz("Asia/Yangon").format(),
  },
});

UserSchema.pre("save", function (next) {
  this.password = bcrypt.hashSync(this.password, bcrypt.genSaltSync(8), null);
  next();
});

UserSchema.statics.compare = function (cleartext, encrypted) {
  return bcrypt.compareSync(cleartext, encrypted);
};

module.exports = mongoose.model("User", UserSchema);
