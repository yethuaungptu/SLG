var express = require("express");
var router = express.Router();
var multer = require("multer");
var moment = require("moment-timezone");
const fs = require("fs");
var Tip = require("../models/Tip");
const upload = multer({ dest: "public/images/uploads" });

router.get("/", async function (req, res) {
  var query = { isDeleted: false };
  var filterValue = "";
  if (req.query.search) {
    filterValue = req.query.search;
    query = { category: filterValue, isDeleted: false };
  }
  const tips = await Tip.find(query).sort({ createdAt: -1 });
  res.render("admin/tip/index", { tips: tips, filterValue: filterValue });
});

router.get("/create", function (req, res) {
  res.render("admin/tip/create");
});

router.post("/create", upload.single("image"), async function (req, res) {
  try {
    const tip = new Tip();
    tip.title = req.body.title;
    tip.category = req.body.category;
    tip.description = req.body.description;
    tip.impact_level = req.body.impact_level;
    tip.difficulty_level = req.body.difficulty_level;
    tip.estimated_savings = req.body.estimated_savings;
    tip.steps = req.body.steps ? req.body.steps : [];
    tip.daily_habits = req.body.habits ? req.body.habits : [];
    if (req.file) tip.image = "/images/uploads/" + req.file.filename;
    await tip.save();
    res.redirect("/admin/tips");
  } catch (e) {
    console.error("Error creating tip:", e);
    return;
  }
});

router.get("/detail/:id", async function (req, res) {
  const tip = await Tip.findById(req.params.id);
  res.render("admin/tip/detail", { tip: tip });
});

router.post("/feature", async function (req, res) {
  try {
    const update = {
      isFeatured: req.body.isFeatured,
      updated: moment.utc(Date.now()).tz("Asia/Yangon").format(),
    };
    await Tip.findByIdAndUpdate(req.body.tipId, { $set: update });
    res.json({ status: "success" });
  } catch (e) {
    console.error("Error updating tip:", e);
    res.json({ status: "error" });
  }
});

router.post("/delete", async function (req, res) {
  try {
    const update = {
      isDeleted: true,
      updated: moment.utc(Date.now()).tz("Asia/Yangon").format(),
    };
    await Tip.findByIdAndUpdate(req.body.tipId, { $set: update });
    res.json({ status: "success" });
  } catch (e) {
    console.error("Error deleting tip:", e);
    res.json({ status: "error" });
  }
});

router.get("/update/:id", async function (req, res) {
  const tip = await Tip.findById(req.params.id);
  res.render("admin/tip/update", { tip: tip });
});

router.post("/update", upload.single("image"), async function (req, res) {
  try {
    const tipData = await Tip.findById(req.body.id);
    const update = {
      title: req.body.title,
      category: req.body.category,
      description: req.body.description,
      impact_level: req.body.impact_level,
      difficulty_level: req.body.difficulty_level,
      estimated_savings: req.body.estimated_savings,
      steps: req.body.steps ? req.body.steps : [],
      daily_habits: req.body.habits ? req.body.habits : [],
      updated: moment.utc(Date.now()).tz("Asia/Yangon").format(),
    };
    if (req.file) {
      try {
        fs.unlinkSync("public" + tipData.image);
        update.image = "/images/uploads/" + req.file.filename;
      } catch (e) {
        console.log("Image error");
      }
    }
    await Tip.findByIdAndUpdate(req.body.id, { $set: update });
    res.redirect("/admin/tips");
  } catch (e) {
    console.error("Error updating tip:", e);
    return;
  }
});

module.exports = router;
