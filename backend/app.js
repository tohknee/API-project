//import the packages below
const express = require("express");
require("express-async-errors");
const morgan = require("morgan");
const cors = require("cors");
const csurf = require("csurf");
const helmet = require("helmet");
const cookieParser = require("cookie-parser");
const routes = require("./routes");

//isProduction will be true if environment is in production
const { environment } = require("./config");
const isProduction = environment === "production";
//initialize express application
const app = express();

//import ValidationError class from sequelize libray. this is a ORM
const { ValidationError } = require("sequelize");
//connect morgan middleware for logging req and res information
app.use(morgan("dev"));
//cookie parser middleware
app.use(cookieParser());
//json body parser
app.use(express.json());

// Security Middleware
if (!isProduction) {
  // enable cors only in development
  app.use(cors());
}

// helmet helps set a variety of headers to better secure your app. see documentation for default headers
app.use(
  helmet.crossOriginResourcePolicy({
    //middlewaresets the cross-origin resource policy in http response
    policy: "cross-origin",
  })
);

// Set the _csrf token and create req.csrfToken method
app.use(
  csurf({
    cookie: {
      secure: isProduction,
      sameSite: isProduction && "Lax",
      httpOnly: true,
    },
  })
);

app.use(routes); // Connect all the routes

// Catch unhandled requests and forward to error handler.
app.use((_req, _res, next) => {
  const err = new Error("The requested resource couldn't be found.");
  err.title = "Resource Not Found";
  err.errors = { message: "The requested resource couldn't be found." };
  err.status = 404;
  next(err);
});

// Process sequelize errors
app.use((err, _req, _res, next) => {
  // check if error is a Sequelize error:
  if (err instanceof ValidationError) {
    let errors = {};
    for (let error of err.errors) {
      errors[error.path] = error.message;
    }
    err.title = "Validation error";
    err.errors = errors;
  }
  next(err);
});

// Error formatter
app.use((err, _req, res, _next) => {
  res.status(err.status || 500);
  console.error(err);
  res.json({
    title: err.title || "Server Error", //remove this to remove title
    message: err.message,
    errors: err.errors,
    stack: isProduction ? null : err.stack, //remove this to remove stack
  });
});

module.exports = app; //export app
