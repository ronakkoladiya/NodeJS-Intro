const express = require("express");
const app = express();
const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
const secretKey = "node-js-intro";

const User = mongoose.model("users");

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

    const post = new User({
        name,
        email,
        password,
        confirmPassword,
        token: null
    });

    await post.save();
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
app.post("/refreshApi", async (request, response) => {
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
    const user = await User.findOne({ token });

    if (!user) {
        return response.status(404).send("Token not found.");
    }

    user.token = null;
    await user.save();

    response.send("Logout successful.");

});

module.exports = app;