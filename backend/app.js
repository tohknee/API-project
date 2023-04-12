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

module.exports = app; //export app
