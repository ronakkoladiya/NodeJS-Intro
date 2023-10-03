const express = require("express");
const app = express();
const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
const secretKey = "bvm-node-js-intro";

const User = mongoose.model("users");

//signUp user
app.post("/signUp", async (request, response) => {

    const { name, email, password, confirmPassword } = request.body;

    const existingUser = await User.findOne({ email });

    if (existingUser) {
        return response.status(400).send("An account with this email already exists.");
    }

    if (password !== confirmPassword) {
        return response.status(400).send("confirmPassword and password has to be same.");
    }

    const post = new User({
        name,
        email,
        password,
        confirmPassword
    });

    await post.save();
    response.send("SignUp successful.");
});

//logIn user
app.post("/logIn", async (request, response) => {
    const { email, password } = request.body;

    const user = await User.findOne({ email });

    if (!user) {
        return response.status(404).send("User not found.");
    }

    if (user.password !== password) {
        return response.status(401).send("Incorrect password.");
    }

    const token = jwt.sign({ userId: user._id }, secretKey);

    response.send({token});
});

//get all the users
app.get("/getAllUsers", async (request, response) => {
    const users = await User.find({}, {password: 0, confirmPassword: 0});
    response.send(users);
});

//get user by id
app.get("/getUserById", async (request, response) => {
    const _id = request.query._id;
    const user = await User.findOne({_id: _id});
    response.send(user);
});

//update user
app.put("/updateUser", async (request, response) => {
    const _id = request.query._id;
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

module.exports = app;