var express = require("express");
var router = express.Router();
const tipController = require("../controllers/tips");
const challengeController = require("../controllers/challenge");
const blogController = require("../controllers/blog");
const Blog = require("../models/Blog");
const Tip = require("../models/Tip");
const Challenge = require("../models/Challenge");
const Community = require("../models/Community");

const checkAdmin = function (req, res, next) {
  if (req.session.admin) {
    next();
  } else {
    res.redirect("/adminLogin?error=Please login as admin");
  }
};

/* GET users listing. */
router.get("/", checkAdmin, async function (req, res, next) {
  const totalTip = await Tip.countDocuments({ isDeleted: false });
  const totalChallenge = await Challenge.countDocuments({ isDeleted: false });
  const totalBlog = await Blog.countDocuments({ isDeleted: false });
  const recentTips = await Tip.find({ isDeleted: false })
    .sort({ createdAt: -1 })
    .limit(5);
  const recentChallenges = await Challenge.find({ isDeleted: false })
    .sort({ createdAt: -1 })
    .limit(5);
  const recentBlogs = await Blog.find({ isDeleted: false })
    .sort({ createdAt: -1 })
    .limit(5);
  const recentCommunities = await Community.find({ isDeleted: false })
    .sort({ createdAt: -1 })
    .limit(5);
  res.render("admin/index", {
    totalTip,
    totalChallenge,
    totalBlog,
    recentTips,
    recentChallenges,
    recentBlogs,
    recentCommunities,
  });
});

router.use("/tips", checkAdmin, tipController);
router.use("/challenges", checkAdmin, challengeController);
router.use("/blog", checkAdmin, blogController);

module.exports = router;
