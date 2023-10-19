const port = 8000;
const express = require("express");
const app = express();
require("dotenv").config();
require("express-async-errors");
const bodyParser = require("body-parser");
const morgan = require("morgan");

//database connection
require("./Mongo");

//models
require("./Model/Users");

//middleware
app.use(bodyParser.json()).use(morgan("combined"));

//default route
app.get("/", (request, response) => {
    response.send("Server is running successfully.");
});

//userRoutes
app.use("/", require("./Routes/UserRoutes"));

//GOOGLE Login
app.use("/", require("./Routes/GoogleLogIn"));

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