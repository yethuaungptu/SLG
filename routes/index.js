var express = require("express");
var router = express.Router();

/* GET home page. */

router.get("/register", function (req, res, next) {
  res.render("register");
});

router.get("/login", function (req, res, next) {
  res.render("login");
});

router.get("/", function (req, res, next) {
  res.render("index", { title: "Express" });
});

router.get("/tips", function (req, res, next) {
  res.render("tips", { title: "Sustainable Tips" });
});

router.get("/challenges", function (req, res, next) {
  res.render("challenges", { title: "Eco Challenges" });
});

router.get("/calculator", function (req, res, next) {
  res.render("calculator", { title: "Eco Calculator" });
});

router.get("/blogs", function (req, res, next) {
  res.render("blogs", { title: "Blog" });
});

router.get("/community", function (req, res, next) {
  res.render("community", { title: "Community" });
});

router.get("/aboutus", function (req, res, next) {
  res.render("aboutus", { title: "About Us" });
});

module.exports = router;
