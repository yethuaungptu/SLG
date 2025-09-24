var express = require("express");
var router = express.Router();
var multer = require("multer");
const nodemailer = require("nodemailer");
var moment = require("moment-timezone");
const fs = require("fs");
var Tip = require("../models/Tip");
var User = require("../models/User");
const upload = multer({ dest: "public/images/uploads" });

router.get("/", async function (req, res) {
  var query = { isDeleted: false };
  var filterValue = "";
  if (req.query.search) {
    filterValue = req.query.search;
    query = { category: filterValue, isDeleted: false };
  }
  const tips = await Tip.find(query).sort({ created: -1 });
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
    // tip.estimated_savings = req.body.estimated_savings;
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
      // estimated_savings: req.body.estimated_savings,
      steps: req.body.steps ? req.body.steps : [],
      daily_habits: req.body.habits ? req.body.habits : [],
      updated: moment.utc(Date.now()).tz("Asia/Yangon").format(),
    };
    if (req.file) {
      update.image = "/images/uploads/" + req.file.filename;
      try {
        fs.unlinkSync("public" + tipData.image);
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

router.post("/sendMailTip", async function (req, res) {
  try {
    const user = await User.find();
    var mailList = [];
    for (var i = 0; i < user.length; i++) {
      if (user[i].email) {
        mailList.push(user[i].email);
      }
    }
    if (mailList.length === 0) {
      return res.json({
        status: false,
        message: "No email found",
      });
    }
    const mailOptions = {
      from: "sustainablelivingguide.2025@gmail.com",
      to: mailList.join(","),
      subject: "Alert Message from Sustainable Living Guide",
      html: `<div><p>Hello life saver, please visit again our website. There are many new content you will also like. For example </p> <a href='https://www.slg.onrender.com/tips/${req.body.tipId}'>Tip Details</a></div>`,
    };
    let resp = await sendMail(mailOptions);
    res.json({ status: true, message: "Mail Sent successfully" });
  } catch (e) {
    console.log(e);
    res.json({
      status: false,
      message: "Something went wrong",
    });
  }
});

async function sendMail(mailOptions) {
  return new Promise((resolve, reject) => {
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: "sustainablelivingguide.2025@gmail.com", // Your email
        pass: "orhq pbuw uhow yrvu", // Your email password or app-specific password
      },
    });

    transporter.sendMail(mailOptions, function (error, info) {
      if (error) {
        console.log("error is " + error);
        resolve(false); // or use rejcet(false) but then you will have to handle errors
      } else {
        console.log("Email sent: " + info.response);
        resolve(true);
      }
    });
  });
}

module.exports = router;
