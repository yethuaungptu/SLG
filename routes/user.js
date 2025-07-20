var express = require("express");
var router = express.Router();
var User = require("../models/User");
var Tip = require("../models/Tip");
var Challenge = require("../models/Challenge");
var Blog = require("../models/Blog");
var moment = require("moment-timezone");
const mongoose = require("mongoose");

const checkUser = function (req, res, next) {
  if (req.session.user) {
    next();
  } else {
    res.redirect("/login?error=Please login");
  }
};

/* GET users listing. */
router.get("/", checkUser, async function (req, res, next) {
  const user = await User.findById(req.session.user.id);
  const likes = await Blog.aggregate([
    {
      $match: {
        like: { $in: [new mongoose.Types.ObjectId(req.session.user.id)] },
      },
    },
    { $group: { _id: null, count: { $sum: 1 } } },
  ]);
  const likeCount = likes.length > 0 ? likes[0].count : 0;
  res.render("user/index", { user: user, likeCount: likeCount });
});

router.post("/bookmarkTip", checkUser, async (req, res) => {
  try {
    const newObject = [
      {
        id: req.body.id,
        created: moment.utc(Date.now()).tz("Asia/Yangon").format(),
      },
    ];
    if (req.body.type == "true") {
      await User.findByIdAndUpdate(req.session.user.id, {
        $push: { bookmarkList: { $each: newObject } },
      });
      const user = await User.findById(req.session.user.id);
      req.session.user = {
        id: user.id,
        name: user.name,
        email: user.email,
        bookmarkList: user.bookmarkList,
        challengeList: user.challengeList,
      };
    } else {
      await User.findByIdAndUpdate(
        req.session.user.id,
        {
          $pull: { bookmarkList: { id: req.body.id } },
        },
        { new: true }
      );
      const user = await User.findById(req.session.user.id);
      req.session.user = {
        id: user.id,
        name: user.name,
        email: user.email,
        bookmarkList: user.bookmarkList,
        challengeList: user.challengeList,
      };
    }
    res.json({ status: true, message: "Bookmark Feature change success" });
  } catch (e) {
    console.log(e);
    res.json({
      status: false,
      message: "Somethings was wrong",
    });
  }
});

router.get("/bookmarkedTip", checkUser, async function (req, res, next) {
  const bookmarkList = req.session.user.bookmarkList.map((item) => item.id);
  console.log(bookmarkList);
  const tips = await Tip.find({ _id: { $in: bookmarkList } });
  res.render("user/bookmarkedTip", { tips: tips });
});

router.post("/joinChallenge", checkUser, async (req, res) => {
  try {
    const newObject = [
      {
        id: req.body.id,
        created: moment.utc(Date.now()).tz("Asia/Yangon").format(),
      },
    ];
    await User.findByIdAndUpdate(req.session.user.id, {
      $push: { challengeList: { $each: newObject } },
    });
    const user = await User.findById(req.session.user.id);
    req.session.user = {
      id: user.id,
      name: user.name,
      email: user.email,
      bookmarkList: user.bookmarkList,
      challengeList: user.challengeList,
    };

    res.json({ status: true, message: "Bookmark Feature change success" });
  } catch (e) {
    console.log(e);
    res.json({
      status: false,
      message: "Somethings was wrong",
    });
  }
});

router.get("/joinedChallenge", checkUser, async function (req, res) {
  const challengeList = req.session.user.challengeList.map((item) => item.id);
  console.log(challengeList);
  const challenges = await Challenge.find({ _id: { $in: challengeList } });
  res.render("user/joinedChallenge", { challenges: challenges });
});

router.get("/challenge/:id", checkUser, async function (req, res) {
  const checkingChallenge = req.session.user.challengeList.filter(
    (item) => item.id == req.params.id
  );
  if (checkingChallenge.length == 0) {
    res.redirect("/user/joinedChallenge");
  }
  let isCompletedToday = false;
  let myCompletedDay = [];
  const challenge = await Challenge.findById(req.params.id);
  if (challenge.status == "ongoing") {
    const res = challenge.participants.filter(
      (item) =>
        item.userId == req.session.user.id &&
        item.currentDay == challenge.currentDay
    );
    if (res.length > 0) isCompletedToday = true;
    const completedDay = challenge.participants.filter(
      (item) => item.userId == req.session.user.id
    );
    console.log(completedDay);
    if (completedDay.length > 0) myCompletedDay = completedDay[0].completedDays;
  }
  res.render("user/challenge", {
    challenge: challenge,
    isCompletedToday: isCompletedToday,
    myCompletedDay: myCompletedDay,
  });
});

router.post("/challengeTaskComplete", checkUser, async function (req, res) {
  try {
    console.log(req.body, req.session.user.id);
    const cid = new mongoose.Types.ObjectId(req.body.cid);
    const uid = new mongoose.Types.ObjectId(req.session.user.id);
    console.log(cid, uid);
    const challenge = await Challenge.findById(cid).lean();
    console.log(challenge.participants);

    const resData = challenge.participants.filter(
      (item) => item.userId == req.session.user.id
    );
    if (resData.length == 0) {
      await Challenge.updateOne(
        { _id: cid, "participants.userId": { $ne: uid } },
        {
          $push: {
            participants: {
              userId: uid,
              currentDay: 1,
              completedDays: [],
              status: "in_progress",
            },
          },
        }
      );
    }
    await Challenge.updateOne(
      {
        _id: cid,
        "dailyTasks.day": Number(req.body.currentDay),
      },
      {
        $addToSet: {
          "dailyTasks.$.completedBy": uid,
        },
        $set: {
          "participants.$[elem].status": "in_progress",
        },
        $addToSet: {
          "participants.$[elem].completedDays": Number(req.body.currentDay),
        },
        $inc: {
          "participants.$[elem].currentDay": 1,
        },
      },
      {
        arrayFilters: [{ "elem.userId": uid }],
      }
    );
    const incrementPoint =
      challenge.dailyTasks.length > 0
        ? challenge.point / challenge.dailyTasks.length
        : challenge.point;
    await User.findByIdAndUpdate(req.session.user.id, {
      $inc: { point: incrementPoint },
    });
    res.json({ status: "success" });
  } catch (e) {
    console.log(e);
    res.json({
      status: false,
      message: "Somethings was wrong",
    });
  }
});

router.post("/likeActionForBlog", checkUser, async (req, res) => {
  try {
    if (req.body.type == "like") {
      await Blog.findByIdAndUpdate(req.body.id, {
        $push: { like: req.session.user.id },
      });
    } else {
      await Blog.findByIdAndUpdate(
        req.body.id,
        {
          $pull: { like: req.session.user.id },
        },
        { new: true }
      );
    }
    res.json({ status: true, message: "Blog like change success" });
  } catch (e) {
    console.log(e);
    res.json({
      status: false,
      message: "Somethings was wrong",
    });
  }
});

router.post("/giveCommentForBlog", checkUser, async (req, res) => {
  try {
    const blog = await Blog.findById(req.body.id);
    if (!blog) {
      return res.json({ status: false, message: "Blog not found" });
    }
    const newComment = {
      userId: req.session.user.id,
      name: req.session.user.name,
      message: req.body.comment,
      created: moment.utc(Date.now()).tz("Asia/Yangon").format(),
    };
    await Blog.findByIdAndUpdate(req.body.id, {
      $push: { comments: newComment },
    });
    res.json({ status: true, message: "Comment added successfully" });
  } catch (e) {
    console.log(e);
    res.json({
      status: false,
      message: "Somethings was wrong",
    });
  }
});

router.get("/logout", checkUser, async function (req, res) {
  req.session.destroy();
  res.redirect("/");
});

module.exports = router;
