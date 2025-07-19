var express = require("express");
var router = express.Router();
var multer = require("multer");
var moment = require("moment-timezone");
const fs = require("fs");
var Blog = require("../models/Blog");
const upload = multer({ dest: "public/images/uploads" });

router.get("/", async function (req, res) {
  var query = { isDeleted: false };
  var filterValue = "";
  if (req.query.search) {
    filterValue = req.query.search;
    query = { category: filterValue, isDeleted: false };
  }
  const blogs = await Blog.find(query).sort({ createdAt: -1 });
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
      try {
        fs.unlinkSync("public" + blogData.image);
        update.image = "/images/uploads/" + req.file.filename;
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

module.exports = router;
