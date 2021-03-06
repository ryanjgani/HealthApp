require("dotenv").config();
const express = require("express");
const path = require("path");
const mongoose = require("mongoose");
const ejsMate = require("ejs-mate");
const session = require("express-session");
const flash = require("connect-flash");
const passport = require("passport");
const localStrategy = require("passport-local");
const methodOverride = require("method-override");
const cookieParser = require("cookie-parser");
const favicon = require("serve-favicon");
const morgan = require("morgan");

const connectDB = require("./config/db");
const userRoutes = require("./routes/users");
const adminRoutes = require("./routes/admin");
const patientRoutes = require("./routes/patient");
const ExpressError = require("./utils/ExpressError");
const CatchAsync = require("./utils/CatchAsync");
const isAuth = require("./middleware/check-auth");

//MongoDB Connection
connectDB();

// View Engine
const app = express();

app.use(favicon(path.join(__dirname, "public", "favicon.ico")));
app.engine("ejs", ejsMate);
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.use(express.static(path.join(__dirname, "public"))); //to serve public assets in the "public" directory
app.use(express.urlencoded({ extended: true }));
app.use(methodOverride("_method"));
app.use(morgan("dev"));
app.use(cookieParser());

//session configuration
const sessionConfig = {
    // store,
    name: "session", //so we dont use the default name
    secret: "thisisasecret",
    resave: false,
    saveUninitialized: true,
    cookie: {
        httpOnly: true,
        expires: Date.now() + 604800000, //expires in a week
        maxAge: 604800000,
    },
};

app.use(session(sessionConfig));

//Flash Configuration
app.use(flash());
app.use((req, res, next) => {
    res.locals.currentUser = null;
    res.locals.success = req.flash("success");
    res.locals.error = req.flash("error");
    next();
});

//Authentication Middleware
app.use(isAuth);

app.get("/", (req, res) => {
    res.render("home");
});

//Routes
app.use("/", userRoutes); //for user routes

//Routes
app.use("/admin/appointments", adminRoutes); //for admin routes
app.use("/patient/appointments", patientRoutes); //for patient routes

app.all("*", (req, res, next) => {
    next(new ExpressError("Page Not Found", 404));
});

app.use((err, req, res, next) => {
    const { statusCode = 404 } = err;
    if (!err.message) err.message = "Something Went Wrong!";
    res.status(statusCode).render("error", { err });
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
    console.log(`Serving on Port ${port}...`);
});
