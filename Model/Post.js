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
       required: "Password is Required!"
   }
});

module.exports = mongoose.model("post", post_schema);