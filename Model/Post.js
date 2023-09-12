const mongoose = require("mongoose");

const post_schema = mongoose.Schema({
   name: {
       type: String,
       required: true
   },
   email: {
       type: String,
       required: true
   },
   password: {
       type: String,
       required: true
   }
});

module.exports = mongoose.model("post", post_schema);