var express = require("express");
var router = express.Router();
var multer = require("multer");
var moment = require("moment-timezone");
const nodemailer = require("nodemailer");
const fs = require("fs");
var Blog = require("../models/Blog");
const User = require("../models/User");
const upload = multer({ dest: "public/images/uploads" });

router.get("/", async function (req, res) {
  var query = { isDeleted: false };
  var filterValue = "";
  if (req.query.search) {
    filterValue = req.query.search;
    query = { category: filterValue, isDeleted: false };
  }
  const blogs = await Blog.find(query).sort({ created: -1 });
  res.render("admin/blog/index", { blogs: blogs, filterValue: filterValue });
});

router.get("/create", function (req, res) {
  res.render("admin/blog/create");
});

router.post("/create", upload.single("image"), async function (req, res) {
  try {
    const blog = new Blog();
    blog.title = req.body.title;
    blog.category = req.body.category;
    blog.content = req.body.content;
    blog.tags = req.body.tags ? req.body.tags.split(",") : [];
    if (req.file) blog.image = "/images/uploads/" + req.file.filename;
    await blog.save();
    res.redirect("/admin/blog");
  } catch (e) {
    console.error("Error creating tip:", e);
    return;
  }
});

router.get("/detail/:id", async function (req, res) {
  const blog = await Blog.findById(req.params.id);
  res.render("admin/blog/detail", { blog: blog });
});

router.post("/delete", async function (req, res) {
  try {
    const update = {
      isDeleted: true,
      updated: moment.utc(Date.now()).tz("Asia/Yangon").format(),
    };
    await Blog.findByIdAndUpdate(req.body.blogId, { $set: update });
    res.json({ status: "success" });
  } catch (e) {
    console.error("Error deleting tip:", e);
    res.json({ status: "error" });
  }
});

router.get("/update/:id", async function (req, res) {
  const blog = await Blog.findById(req.params.id);
  res.render("admin/blog/update", { blog: blog });
});

router.post("/update", upload.single("image"), async function (req, res) {
  try {
    const blogData = await Blog.findById(req.body.id);
    const update = {
      title: req.body.title,
      category: req.body.category,
      content: req.body.content,
      tags: req.body.tags ? req.body.tags.split(",") : [],
      updated: moment.utc(Date.now()).tz("Asia/Yangon").format(),
    };
    if (req.file) {
      update.image = "/images/uploads/" + req.file.filename;
      try {
        fs.unlinkSync("public" + blogData.image);
      } catch (e) {
        console.log("Image error");
      }
    }
    await Blog.findByIdAndUpdate(req.body.id, { $set: update });
    res.redirect("/admin/blog");
  } catch (e) {
    console.error("Error updating tip:", e);
    return;
  }
});

router.post("/sendMailBlog", async function (req, res) {
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
      html: `<div><p>Hello life saver, please visit again our website. There are many new blogs you will also like. For example </p> <a href='https://www.slg.onrender.com/blogs/${req.body.blogId}'>Blog Details</a></div>`,
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
