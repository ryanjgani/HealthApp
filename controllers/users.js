const User = require("../models/users");
const jwt = require("jsonwebtoken");

const maxAge = 24 * 60 * 60;
const cookieMaxAge = maxAge * 1000;
const createToken = (id, role) => {
    return jwt.sign({ id, role }, process.env.JWT_KEY, {
        expiresIn: maxAge,
    });
};

module.exports.getRegisterForm = (req, res) => {
    res.render("users/register");
};
module.exports.postRegisterForm = async (req, res) => {
    const { firstName, lastName, age, email, password, username } = req.body;
    try {
        const user = await User.create({
            email,
            username,
            firstName,
            lastName,
            age,
            password,
            role: "patient",
        });
        const token = createToken(user._id, user.role);
        res.cookie("jwt", token, { httpOnly: true, maxAge: cookieMaxAge });

        req.flash("success", "Welcome to Health!");
        if (user.role === "admin") {
            res.redirect("/admin/appointments");
        } else {
            res.redirect("/patient/appointments");
        }
    } catch (e) {
        req.flash("error", e.message);
        res.redirect("/");
    }
};

module.exports.getLoginForm = (req, res) => {
    res.render("users/login");
};

module.exports.postLoginForm = async (req, res) => {
    const { username, password } = req.body;
    try {
        const user = await User.login(username, password);
        const token = createToken(user._id, user.role);
        res.cookie("jwt", token, { httpOnly: true, maxAge: cookieMaxAge });

        req.flash("success", "Welcome Back!");

        if (user.role === "admin") {
            res.redirect("/admin/appointments");
        } else {
            res.redirect("/patient/appointments");
        }
    } catch (e) {
        console.error(e);
        req.flash("error", "Wrong Username or Password");
        res.redirect("/");
    }
};

module.exports.logout = (req, res) => {
    res.clearCookie("jwt", { httpOnly: true });
    res.redirect("/");
};
