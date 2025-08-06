var createError = require("http-errors");
var express = require("express");
var path = require("path");
var cookieParser = require("cookie-parser");
var logger = require("morgan");
var session = require("express-session");
var mongoose = require("mongoose");

var indexRouter = require("./routes/index");
var userRouter = require("./routes/user");
var adminRouter = require("./routes/admin");

var app = express();

// view engine setup
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "ejs");

app.use(logger("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, "public")));

// mongoose.connect("mongodb://127.0.0.1/slgdb");
// const db = mongoose.connection;
// db.on("error", console.error.bind("mongodb connection error at slgdb"));

mongoose.connect(
  "mongodb+srv://slg:slg2025@slg.59yvemi.mongodb.net/?retryWrites=true&w=majority&appName=slg"
);
const db = mongoose.connection;
db.on("error", console.error.bind("mongodb connection error at slgdb"));

app.use(
  session({
    secret: "Sustainable@SLG2025",
    resave: false,
    saveUninitialized: true,
  })
);

app.use(function (req, res, next) {
  res.locals.user = req.session.user;
  res.locals.admin = req.session.admin;
  next();
});

app.use("/", indexRouter);
app.use("/user", userRouter);
app.use("/admin", adminRouter);

// catch 404 and forward to error handler
app.use(function (req, res, next) {
  next(createError(404));
});

// error handler
app.use(function (err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get("env") === "development" ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render("error");
});

module.exports = app;
