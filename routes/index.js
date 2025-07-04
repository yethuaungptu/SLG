var express = require("express");
var router = express.Router();
var User = require("../models/User");
var Tip = require("../models/Tip");

/* GET home page. */

router.get("/register", (req, res, next) => {
  res.render("register");
});

router.post("/register", async (req, res, next) => {
  try {
    const exitingUser = await User.findOne({ email: req.body.email });
    if (exitingUser) {
      res.json({ status: "false", message: "Exit user with this email" });
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
    res.json({ status: "false", message: "Registration failed" });
  }
});

router.get("/login", (req, res, next) => {
  res.render("login");
});

router.post("/login", async (req, res) => {
  const user = await User.findOne({ email: req.body.email });

  if (user != null && User.compare(req.body.password, user.password)) {
    req.session.donor = {
      id: user.id,
      name: user.name,
      email: user.email,
    };
    res.json({ status: "true", message: "Login successful" });
  } else {
    res.json({
      status: "false",
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
  res.render("index", { featuredTips: featuredTips });
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

router.get("/challenges", (req, res, next) => {
  res.render("challenges", { title: "Eco Challenges" });
});

router.get("/calculator", (req, res, next) => {
  res.render("calculator", { title: "Eco Calculator" });
});

router.get("/blogs", (req, res, next) => {
  res.render("blogs", { title: "Blog" });
});

router.get("/community", (req, res, next) => {
  res.render("community", { title: "Community" });
});

router.get("/aboutus", (req, res, next) => {
  res.render("aboutus", { title: "About Us" });
});

module.exports = router;
