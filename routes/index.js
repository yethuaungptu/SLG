var express = require("express");
var router = express.Router();
var User = require("../models/User");
var Tip = require("../models/Tip");
var Challenge = require("../models/Challenge");
var Blog = require("../models/Blog");

/* GET home page. */

router.get("/register", (req, res, next) => {
  res.render("register");
});

router.post("/register", async (req, res, next) => {
  try {
    const exitingUser = await User.findOne({ email: req.body.email });
    if (exitingUser) {
      res.json({ status: false, message: "Exit user with this email" });
      return;
    }
    const user = new User();
    user.name = req.body.name;
    user.email = req.body.email;
    user.password = req.body.password;
    await user.save();
    res.json({ status: "true", message: "User registered successfully" });
  } catch (error) {
    console.error("Error during registration:", error);
    res.json({ status: false, message: "Registration failed" });
  }
});

router.get("/login", (req, res, next) => {
  res.render("login");
});

router.post("/login", async (req, res) => {
  const user = await User.findOne({ email: req.body.email });

  if (user != null && User.compare(req.body.password, user.password)) {
    console.log(user);
    req.session.user = {
      id: user.id,
      name: user.name,
      email: user.email,
      bookmarkList: user.bookmarkList,
      challengeList: user.challengeList,
    };
    res.json({ status: true, message: "Login successful" });
  } else {
    res.json({
      status: false,
      message: "Email not found or password not match",
    });
  }
});

router.get("/adminLogin", (req, res) => {
  res.render("adminLogin", { error: req.query.error ? req.query.error : null });
});

router.post("/adminLogin", (req, res) => {
  console.log(req.body);
  if (
    req.body.email === "slg@admin.com" &&
    req.body.password === "slgadmin2025"
  ) {
    req.session.admin = {
      email: req.body.email,
    };
    res.redirect("/admin");
  } else {
    res.redirect("/adminLogin?error=Invalid credentials");
  }
});

router.get("/", async (req, res, next) => {
  const featuredTips = await Tip.find({ isFeatured: true, isDeleted: false });
  const featuredChallenges = await Challenge.find({
    isFeatured: true,
    isDeleted: false,
  });
  res.render("index", {
    featuredTips: featuredTips,
    featuredChallenges: featuredChallenges,
  });
});

router.get("/tips", async (req, res, next) => {
  const tips = await Tip.find({ isDeleted: false }).sort({
    created: -1,
    isFeatured: 1,
  });
  res.render("tips", { title: "Sustainable Tips", tips: tips });
});

router.get("/tips/:id", async function (req, res) {
  const tip = await Tip.findById(req.params.id);
  res.render("tipDetail", { title: "Sustainable Tip Detail", tip: tip });
});

router.get("/challenges", async (req, res, next) => {
  const challenges = await Challenge.find({ isDeleted: false }).sort({
    created: -1,
    isFeatured: 1,
  });
  res.render("challenges", { title: "Eco Challenges", challenges: challenges });
});

router.get("/challenges/:id", async (req, res, next) => {
  const challenge = await Challenge.findById(req.params.id);
  console.log(challenge.updated_startDate);
  res.render("challengeDetail", {
    title: "Eco Challenges",
    challenge: challenge,
  });
});

router.get("/calculator", (req, res, next) => {
  res.render("calculator", { title: "Eco Calculator" });
});

router.get("/blogs", async (req, res, next) => {
  const blogs = await Blog.find({ isDeleted: false }).sort({
    created: -1,
    isFeatured: 1,
  });
  res.render("blogs", { title: "Blog", blogs: blogs });
});

router.get("/blogs/:id", async (req, res, next) => {
  const blog = await Blog.findById(req.params.id);
  await Blog.findByIdAndUpdate(req.params.id, { $inc: { views: 1 } });
  res.render("blogDetail", { title: "Blog", blog: blog });
});

router.get("/community", (req, res, next) => {
  res.render("community", { title: "Community" });
});

router.get("/aboutus", (req, res, next) => {
  res.render("aboutus", { title: "About Us" });
});

module.exports = router;
