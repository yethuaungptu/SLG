var express = require("express");
var router = express.Router();
var multer = require("multer");
var moment = require("moment-timezone");
const fs = require("fs");
var Challenge = require("../models/Challenge");
const User = require("../models/User");
const nodemailer = require("nodemailer");
const upload = multer({ dest: "public/images/uploads" });

router.get("/", async function (req, res) {
  var query = { isDeleted: false };
  var filterValue = "";
  if (req.query.search) {
    filterValue = req.query.search;
    query = { category: filterValue, isDeleted: false };
  }
  const challenges = await Challenge.find(query).sort({ created: -1 });
  res.render("admin/challenge/index", {
    challenges: challenges,
    filterValue: filterValue,
  });
});

router.get("/create", function (req, res) {
  res.render("admin/challenge/create");
});

router.post("/create", upload.single("image"), async function (req, res) {
  try {
    const challenge = new Challenge();
    challenge.name = req.body.name;
    challenge.category = req.body.category;
    challenge.description = req.body.description;
    challenge.point = req.body.point;
    challenge.startDate = req.body.startDate;
    challenge.endDate = req.body.endDate;
    challenge.benefit = req.body.benefit;
    challenge.difficulty = req.body.difficulty;
    challenge.dailyTasks = req.body.dailyTasks ? req.body.dailyTasks : [];
    if (req.file) challenge.image = "/images/uploads/" + req.file.filename;
    await challenge.save();
    res.redirect("/admin/challenges");
  } catch (e) {
    console.error("Error creating challenges:", e);
    return;
  }
});

router.get("/detail/:id", async function (req, res) {
  const challenge = await Challenge.findById(req.params.id);
  res.render("admin/challenge/detail", { challenge: challenge });
});

router.post("/feature", async function (req, res) {
  try {
    const update = {
      isFeatured: req.body.isFeatured,
      updated: moment.utc(Date.now()).tz("Asia/Yangon").format(),
    };
    await Challenge.findByIdAndUpdate(req.body.challengeId, { $set: update });
    res.json({ status: "success" });
  } catch (e) {
    console.error("Error updating challenge:", e);
    res.json({ status: "error" });
  }
});

router.post("/delete", async function (req, res) {
  try {
    const update = {
      isDeleted: true,
      updated: moment.utc(Date.now()).tz("Asia/Yangon").format(),
    };
    await Challenge.findByIdAndUpdate(req.body.challengeId, { $set: update });
    res.json({ status: "success" });
  } catch (e) {
    console.error("Error deleting Challenge:", e);
    res.json({ status: "error" });
  }
});

router.get("/update/:id", async function (req, res) {
  const challenge = await Challenge.findById(req.params.id);
  res.render("admin/challenge/update", { challenge: challenge });
});

router.post("/update", upload.single("image"), async function (req, res) {
  try {
    const challengeData = await Challenge.findById(req.body.id);
    const update = {
      name: req.body.name,
      category: req.body.category,
      description: req.body.description,
      point: req.body.point,
      difficulty: req.body.difficulty,
      startDate: req.body.startDate,
      endDate: req.body.endDate,
      benefit: req.body.benefit,
      dailyTasks: req.body.dailyTasks ? req.body.dailyTasks : [],
      updated: moment.utc(Date.now()).tz("Asia/Yangon").format(),
    };
    if (req.file) {
      try {
        fs.unlinkSync("public" + challengeData.image);
        update.image = "/images/uploads/" + req.file.filename;
      } catch (e) {
        console.log("Image error");
      }
    }
    await Challenge.findByIdAndUpdate(req.body.id, { $set: update });
    res.redirect("/admin/challenges");
  } catch (e) {
    console.error("Error updating tip:", e);
    return;
  }
});

router.post("/sendMailChallenge", async function (req, res) {
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
      html: `<div><p>Hello life saver, please visit again our website. There are many new challenge you will also like. For example </p> <a href='https://www.slg.onrender.com/challenges/${req.body.challengeId}'>Challenge Details</a></div>`,
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
