const mongoose = require("mongoose");

const post_schema = new mongoose.Schema({
    name: {
        type: String,
        required: "Name is Required!"
    },
    email: {
        type: String,
        required: "Email is Required!"
    },
    password: {
        type: String,
        required: false
    },
    confirmPassword: {
        type: String,
        required: false
    },
    token: {
        type: String,
        required: false
    }
});

module.exports = mongoose.model("users", post_schema);