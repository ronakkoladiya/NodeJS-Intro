const express = require("express");
const app = express();
const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
const secretKey = "node-js-intro";
const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth20").Strategy;

const User = mongoose.model("users");

//GOOGLE Login
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
            callbackURL: "http://localhost:8000/googleCallback" || "https://node-js-intro.vercel.app/googleCallback",
        },
        async (token, tokenSecret, profile, done) => {
            try{
                console.log("Google Profile:", profile);

                const user = await User.findOne({ email: profile.emails[0].value });

                if (user) {
                    const jwtToken = jwt.sign({ userId: user._id }, secretKey);

                    user.token = jwtToken;
                    await user.save();

                    return done(null, user);
                } else {
                    const newUser = new User({
                        name: profile.displayName,
                        email: profile.emails[0].value,
                        token: null
                    });

                    await newUser.save();

                    const jwtToken = jwt.sign({ userId: newUser._id }, secretKey);

                    newUser.token = jwtToken;
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

app.get("/googleCallback", (req, res, next) => {
    passport.authenticate("google", (err, user) => {
        if (err) {
            return res.status(401).json({ error: "Authentication failed" });
        }

        if (user && user.token) {
            res.status(200).json({ token: user.token });
        }
    })(req, res, next);
});

app.get('/googleLogOut', (request, response) => {
    request.logout(function(err) {
        if (err) {
            console.error('Error during logout:', err);
        }
        delete request.session;
        response.redirect('/googleLogIn');
    });
});

module.exports = app;