var express = require("express");
var router = express.Router();
const tipController = require("../controllers/tips");
const challengeController = require("../controllers/challenge");

const checkAdmin = function (req, res, next) {
  //   if (req.session.admin) {
  //     next();
  //   } else {
  //     res.redirect("/adminLogin?error=Please login as admin");
  //   }
  next();
};

/* GET users listing. */
router.get("/", checkAdmin, function (req, res, next) {
  res.render("admin/index");
});

router.use("/tips", checkAdmin, tipController);
router.use("/challenges", checkAdmin, challengeController);

module.exports = router;
