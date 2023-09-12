const port = 8000;
const express = require("express");
const app = express();
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const morgan = require("morgan");

//database connection
require("./Mongo");

//models
require("./Model/Post");

//middleware
app.use(bodyParser.json())
    .use(morgan());

const Post = mongoose.model("post");

app.get("/user", async (request, response) => {
   try{
       const user = await Post.find({});
       response.send(user);
   }
   catch{
        response.status(500);
   }
});

app.post("/user", async (request, response) => {
    try{
        const post = new Post();
        post.name = request.body.name;
        post.email = request.body.email;
        post.password = request.body.password;

        await post.save();
        response.send("User added successfully.");
    }
    catch{
        response.status(500);
    }
});

app.get("/userById", async (request, response) => {
    try{
        const _id = request.query._id;
        const user = await Post.findOne({_id: _id});
        response.send(user);
    }
    catch{
        response.status(500);
    }
});

app.put("/updateUser", async (request, response) => {
    try{
        const _id = request.query._id;
        await Post.findByIdAndUpdate({_id: _id}, request.body, {
            new: true,
            runValidators: true
        });
        response.send("User updated successfully.");
    }
    catch{
        response.status(500);
    }
});

app.delete("/deleteUser", async (request, response) => {
    try{
        const _id = request.query._id;
        await Post.findByIdAndDelete({_id: _id}, request.body);
        response.send("User deleted successfully.");
    }
    catch{
        response.status(500);
    }
});

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});