const port = 8000;
const express = require("express");
require("express-async-errors");
const app = express();
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const morgan = require("morgan");

//database connection
require("./Mongo");

//models
require("./Model/Post");

//middleware
app.use(bodyParser.json()).use(morgan());

const Post = mongoose.model("post");

app.get("/user", async (request, response) => {
    const user = await Post.find({});
    response.send(user);
});

app.post("/user", async (request, response) => {
    const post = new Post();
    post.name = request.body.name;
    post.email = request.body.email;
    post.password = request.body.password;

    await post.save();
    response.send("User added successfully.");
});

app.get("/userById", async (request, response) => {
    const _id = request.query._id;
    const user = await Post.findOne({_id: _id});
    response.send(user);
});

app.put("/updateUser", async (request, response) => {
    const _id = request.query._id;
    await Post.findByIdAndUpdate({_id: _id}, request.body, {
        new: true,
        runValidators: true
    });
    response.send("User updated successfully.");
});

app.delete("/deleteUser", async (request, response) => {
    const _id = request.query._id;
    await Post.findByIdAndDelete({_id: _id}, request.body);
    response.send("User deleted successfully.");
});

//routes not found
app.use((req, res, next) => {
    req.status = 404;
    const error = new Error("Routes not found");
    next(error);
});

//error handler
if (app.get("env") === "production") {
    app.use((error, req, res, next) => {
        res.status(req.status || 500).send({
            message: error.message
        });
    });
}

app.use((error, req, res, next) => {
    res.status(req.status || 500).send({
        message: error.message,
        stack: error.stack
    });
});

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});