var express = require("express");
var router = express.Router();
var multer = require("multer");
var User = require("../models/User");
var Tip = require("../models/Tip");
var Challenge = require("../models/Challenge");
var Community = require("../models/Community");
var CommunityPost = require("../models/CommunityPost");
var Blog = require("../models/Blog");
var moment = require("moment-timezone");
const mongoose = require("mongoose");
const upload = multer({ dest: "public/images/uploads" });
const fs = require("fs");

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
  const joinedCommunities = await Community.find({
    "members.userId": req.session.user.id,
  }).countDocuments();
  const postCount = await CommunityPost.countDocuments({
    userId: req.session.user.id,
  });
  const likeCount = likes.length > 0 ? likes[0].count : 0;
  res.render("user/index", {
    user: user,
    likeCount: likeCount,
    joinedCommunities: joinedCommunities,
    postCount: postCount,
  });
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
  if (challenge.status != "not start") {
    const res = challenge.participants.filter(
      (item) =>
        item.userId == req.session.user.id &&
        item.currentDay == challenge.currentDay
    );
    if (res.length > 0) isCompletedToday = true;
    const completedDay = challenge.participants.filter(
      (item) => item.userId == req.session.user.id
    );
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

router.get("/community/create", checkUser, async (req, res) => {
  res.render("user/createCommunity");
});

router.post(
  "/community/create",
  checkUser,
  upload.single("image"),
  async (req, res) => {
    try {
      const community = new Community();
      community.name = req.body.name;
      community.description = req.body.description;
      community.topics = req.body.topics
        ? req.body.topics.split(",").map((t) => t.trim())
        : [];
      community.rules = req.body.rules
        ? req.body.rules.split(",").map((r) => r.trim())
        : [];
      community.isPublic =
        req.body.isPublic === "on" || req.body.isPublic === true;
      community.createdBy = req.session.user.id;
      community.members = [
        {
          userId: req.session.user.id,
          role: "admin", // creator is admin
        },
      ];
      community.stats = { membersCount: 1 };
      if (req.file) community.image = "/images/uploads/" + req.file.filename;
      await community.save();
      res.redirect("/community");
    } catch (e) {
      console.log(e);
      res.redirect("/user/community/create");
    }
  }
);

router.post("/joinCommunity", checkUser, async function (req, res) {
  try {
    const community = await Community.findById(req.body.id);
    if (!community) {
      return res.json({ status: false, message: "Community not found" });
    }
    const newMember = {
      userId: req.session.user.id,
      role: "member",
    };
    await Community.findByIdAndUpdate(req.body.id, {
      $push: { members: newMember },
      $inc: { "stats.membersCount": 1 },
    });
    res.json({ status: true, message: "Community joined successfully" });
  } catch (e) {
    console.log(e);
    res.json({
      status: false,
      message: "Somethings was wrong",
    });
  }
});

router.get("/myCommunity", checkUser, async function (req, res) {
  const communities = await Community.find({
    "members.userId": req.session.user.id,
  });
  res.render("user/myCommunity", { communities: communities });
});

router.get("/community/edit/:id", checkUser, async function (req, res) {
  const community = await Community.findById(req.params.id);
  if (!community) {
    return res.redirect("/user/myCommunity");
  }
  if (!community.createdBy === req.session.user.id) {
    return res.redirect("/user/myCommunity");
  }
  res.render("user/editCommunity", { community: community });
});

router.post(
  "/community/update",
  checkUser,
  upload.single("image"),
  async function (req, res) {
    try {
      const community = await Community.findById(req.body.id);
      if (!community) {
        return res.redirect("/user/myCommunity");
      }
      if (community.createdBy.toString() !== req.session.user.id) {
        return res.redirect("/user/myCommunity");
      }
      const updateData = {
        name: req.body.name,
        description: req.body.description,
        topics: req.body.topics
          ? req.body.topics.split(",").map((t) => t.trim())
          : [],
        rules: req.body.rules
          ? req.body.rules.split(",").map((r) => r.trim())
          : [],
        isPublic: req.body.isPublic === "on" || req.body.isPublic === true,
        updated: moment.utc(Date.now()).tz("Asia/Yangon").format(),
      };
      if (req.file) {
        try {
          fs.unlinkSync("public" + community.image);
          updateData.image = "/images/uploads/" + req.file.filename;
        } catch (e) {
          console.log("Image error");
        }
      }
      await Community.findByIdAndUpdate(req.body.id, {
        $set: updateData,
      });
      res.redirect("/user/myCommunity");
    } catch (e) {
      console.log(e);
      return res.redirect("/user/myCommunity");
    }
  }
);

router.get("/community/:id", checkUser, async function (req, res) {
  const community = await Community.findById(req.params.id)
    .populate("members.userId", "name email")
    .populate("createdBy", "name");
  if (!community) {
    return res.redirect("/user/myCommunity");
  }
  const isAdmin =
    community.members.filter(
      (item) =>
        item.userId._id.toString() == req.session.user.id &&
        item.role == "admin"
    ).length > 0
      ? true
      : false;
  const posts = await CommunityPost.find({ communityId: community._id })
    .populate("userId", "name email")
    .populate("comments.userId", "name email")
    .sort({ created: -1 });
  res.render("user/communityDetail", {
    community: community,
    isAdmin: isAdmin,
    posts: posts,
  });
});

router.post("/createCommunityPost", checkUser, async function (req, res) {
  try {
    const communityPost = new CommunityPost({
      communityId: req.body.communityId,
      userId: req.session.user.id,
      post: req.body.content,
    });
    await communityPost.save();
    await Community.updateOne(
      { _id: req.body.communityId },
      { $inc: { "stats.conservationCount": 1 } }
    );
    res.json({ status: true, message: "Post created successfully" });
  } catch (e) {
    console.log(e);
    res.json({
      status: false,
      message: "Something went wrong",
    });
  }
});

router.post("/likeCommunityPost", checkUser, async function (req, res) {
  try {
    const post = await CommunityPost.findById(req.body.postId);
    if (!post) {
      return res.json({ status: false, message: "Post not found" });
    }
    if (req.body.action === "like") {
      await Community.updateOne(
        { _id: post.communityId },
        { $inc: { "stats.likesCount": 1 } }
      );
      if (post.likes.length == 0) {
        await CommunityPost.findByIdAndUpdate(req.body.postId, {
          $push: { likes: req.session.user.id },
        });

        console.log("Post liked push", res);
      } else {
        await CommunityPost.findByIdAndUpdate(req.body.postId, {
          $addToSet: { likes: req.session.user.id },
        });
      }
    } else {
      await Community.updateOne(
        { _id: post.communityId },
        { $inc: { "stats.likesCount": -1 } }
      );
      await CommunityPost.findByIdAndUpdate(
        req.body.postId,
        {
          $pull: { likes: req.session.user.id },
        },
        { new: true }
      );
    }
    res.json({ status: true, message: "Post like updated successfully" });
  } catch (e) {
    console.log(e);
    res.json({
      status: false,
      message: "Something went wrong",
    });
  }
});

router.post("/commentCommunityPost", checkUser, async function (req, res) {
  try {
    const post = await CommunityPost.findById(req.body.postId);
    if (!post) {
      return res.json({ status: false, message: "Post not found" });
    }
    const newComment = {
      userId: req.session.user.id,
      content: req.body.content,
      created: moment.utc(Date.now()).tz("Asia/Yangon").format(),
    };
    await CommunityPost.findByIdAndUpdate(req.body.postId, {
      $push: { comments: newComment },
    });
    res.json({ status: true, message: "Comment added successfully" });
  } catch (e) {
    console.log(e);
    res.json({
      status: false,
      message: "Something went wrong",
    });
  }
});

router.post("/changeCommunityAdmin", checkUser, async function (req, res) {
  try {
    const community = await Community.findById(req.body.communityId).lean();
    if (!community) {
      return res.json({ status: false, message: "Community not found" });
    }
    const newAdminId = req.body.adminId;
    const isMember = community.members.some(
      (member) => member.userId._id.toString() == newAdminId
    );
    if (!isMember) {
      return res.json({
        status: false,
        message: "Selected user is not a member of this community",
      });
    }
    const modifiedMembers = community.members.map((member) => {
      console.log("loop member", member);
      if (member.userId._id.toString() == newAdminId) {
        return { ...member, role: "admin" };
      } else if (member.userId._id.toString() == req.session.user.id) {
        return { ...member, role: "member" };
      }
      return member;
    });
    await Community.findByIdAndUpdate(req.body.communityId, {
      $set: { members: modifiedMembers },
    });

    res.json({ status: true, message: "Community admin changed successfully" });
  } catch (e) {
    console.log(e);
    res.json({
      status: false,
      message: "Something went wrong",
    });
  }
});

router.post("/leaveCommunity", checkUser, async function (req, res) {
  try {
    const community = await Community.findById(req.body.communityId).lean();
    if (!community) {
      return res.json({ status: false, message: "Community not found" });
    }
    await Community.findByIdAndUpdate(community._id, {
      $inc: { "stats.membersCount": -1 },
      $pull: { members: { userId: req.session.user.id } },
    });

    res.json({ status: true, message: "Community leaving is successfully" });
  } catch (e) {
    console.log(e);
    res.json({
      status: false,
      message: "Something went wrong",
    });
  }
});

router.get("/logout", checkUser, async function (req, res) {
  req.session.destroy();
  res.redirect("/");
});

module.exports = router;
