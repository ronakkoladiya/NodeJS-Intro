const express = require("express");
const app = express();
const mongoose = require("mongoose");
const nodemailer = require('nodemailer');
const jwt = require("jsonwebtoken");
const secretKey = "node-js-intro";
const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth20").Strategy;

const User = mongoose.model("users");

app.use(require("express-session")({
    secret: "Ronak's 1st Node",
    resave: false,
    saveUninitialized: true,
}));

app.use(passport.initialize());
app.use(passport.session());

passport.use(
    new GoogleStrategy(
        {
            clientID: process.env.GOOGLECLIENTID,
            clientSecret: process.env.GOOGLECLIENTSECRET,
            callbackURL: "http://localhost:8000/",
        },
        async (token, tokenSecret, profile, done) => {
            try{
                console.log("Google Profile:", profile);
                console.log("Google Token:", token);

                const user = await User.findOne({ email: profile.emails[0].value });

                if (user) {
                    return done(null, user);
                } else {
                    const newUser = new User({
                        name: profile.displayName,
                        email: profile.emails[0].value,
                        token: null
                    });

                    await newUser.save();
                    return done(null, newUser);
                }
            }
            catch (e) {
                console.error("Error in Google Strategy:", e);
            }
        }
    )
);

passport.serializeUser((user, done) => {
    done(null, user);
});

passport.deserializeUser((user, done) => {
    done(null, user);
});

app.get("/googleLogIn", passport.authenticate("google", {scope: ["profile", "email"]}));

//signUp user
app.post("/signUp", async (request, response) => {

    const {name, email, password, confirmPassword} = request.body;

    const emailRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,4}$/;
    if (!emailRegex.test(email)) {
        return response.status(400).send("Invalid email address.");
    }

    const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{6,}$/;
    if (!passwordRegex.test(password)) {
        return response.status(400).send("Password must contain at least 6 characters, including at least one letter, one number, and one special character.");
    }

    if (password !== confirmPassword) {
        return response.status(400).send("confirmPassword and password has to be same.");
    }

    const existingUser = await User.findOne({email});

    if (existingUser) {
        return response.status(400).send("An account with this email already exists.");
    }

    const newUser = new User({
        name,
        email,
        password,
        confirmPassword,
        token: null
    });

    await newUser.save();
    response.send("SignUp successful.");
});

//logIn user
app.post("/logIn", async (request, response) => {
    const {email, password} = request.body;

    const emailRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,4}$/;
    if (!emailRegex.test(email)) {
        return response.status(400).send("Invalid email address.");
    }

    const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{6,}$/;
    if (!passwordRegex.test(password)) {
        return response.status(400).send("Password must contain at least 6 characters, including at least one letter, one number, and one special character.");
    }

    const user = await User.findOne({email});

    if (user.password !== password) {
        return response.status(401).send("Incorrect password.");
    }

    if (!user) {
        return response.status(404).send("User not found.");
    }

    const token = jwt.sign({userId: user._id}, secretKey);

    user.token = token;
    await user.save();

    response.send({token});
});

//Refresh Api
app.get("/refreshApi", async (request, response) => {
    const token = request.query.token;
    const user = await User.findOne({token: token}, {confirmPassword: 0});

    if (!user) {
        return response.status(404).json({message: "Invalid token"});
    }

    response.send(user);
});

//get all the users
app.get("/getAllUsers", async (request, response) => {
    const users = await User.find({}, {confirmPassword: 0, token: 0});
    response.send(users);
});

//get user by id
app.get("/getUserById", async (request, response) => {
    const _id = request.query._id;
    const user = await User.findOne({_id: _id}, {confirmPassword: 0, token: 0});

    if (!user) {
        return response.status(404).send("User not found.");
    }

    response.send(user);
});

//update user
app.put("/updateUserById", async (request, response) => {
    const _id = request.query._id;
    const {name, email, password, confirmPassword} = request.body;

    const emailRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,4}$/;
    if (!emailRegex.test(email)) {
        return response.status(400).send("Invalid email address.");
    }

    const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{6,}$/;
    if (!passwordRegex.test(password)) {
        return response.status(400).send("Password must contain at least 6 characters, including at least one letter, one number, and one special character.");
    }

    if (password !== confirmPassword) {
        return response.status(400).send("confirmPassword and password has to be same.");
    }

    const user = await User.findById(_id);
    if (
        name === user.name &&
        email === user.email &&
        password === user.password &&
        confirmPassword === user.confirmPassword
    ) {
        return response.status(400).json({message: 'No changes detected'});
    }

    if (!user) {
        return response.status(404).json({message: 'User not found'});
    }

    await User.findByIdAndUpdate({_id: _id}, request.body, {
        new: true,
        runValidators: true
    });
    response.send("User updated successfully.");
});

//delete user
app.delete("/deleteUser", async (request, response) => {
    const _id = request.query._id;
    await User.findByIdAndDelete({_id: _id}, request.body);
    response.send("User deleted successfully.");
});

//logout user
app.post("/logOut", async (request, response) => {
    const token = request.query.token;
    const user = await User.findOne({token});

    if (!user) {
        return response.status(404).send("Token not found.");
    }

    user.token = null;
    await user.save();

    response.send("Logout successful.");
});

// Reset Password Email
app.post('/resetPasswordEmail', async (request, response) => {
    const email = request.query.email;
    const user = await User.findOne({email: email});

    if (!user) {
        return response.status(404).send("User not found.");
    }

    const transporter = nodemailer.createTransport({
        service: 'Gmail',
        auth: {
            user: process.env.MYEMAIL,
            pass: process.env.MYPASS,
        },
    });

    const mailOptions = {
        from: process.env.MYEMAIL,
        to: email,
        subject: 'Password Reset Request',
        text: `To reset your password, click on the following link: http://localhost:8000/updatePassword?_id=${user._id}`,
    };

    await transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
            console.error(error);
            response.status(500).json({message: 'Email sending failed'});
        } else {
            console.log('Email sent: ' + info.response);
            response.status(200).json({message: 'Password reset email sent successfully'});
        }
    });

});

//updatePassword
app.post('/updatePassword', async (request, response) => {
    const _id = request.query._id;
    const {password, confirmPassword} = request.body;
    const user = await User.findById(_id);

    if (!user) {
        return response.status(404).send("User not found.");
    }

    const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{6,}$/;
    if (!passwordRegex.test(password)) {
        return response.status(400).send("Password must contain at least 6 characters, including at least one letter, one number, and one special character.");
    }

    if (password !== confirmPassword) {
        return response.status(400).send("ConfirmPassword and password has to be same.");
    }

    if (
        password === user.password &&
        confirmPassword === user.confirmPassword
    ) {
        return response.status(400).json({message: 'No changes detected'});
    }

    user.password = password;
    user.confirmPassword = confirmPassword;
    await user.save();

    return response.status(200).send("Password updated successfully.");
});

module.exports = app;