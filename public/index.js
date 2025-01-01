const express = require("express");
const cors = require("cors");
const path = require("path");
const fs = require("fs");
const https = require("https");
require("dotenv").config();

const app = express();
const ip = process.env.APP_IP;
const port = process.env.HTTP_PORT;
const httpsPort = process.env.HTTPS_PORT; // Port cho HTTPS

// Middleware
app.use(cors());
app.use(express.json()); // Đọc JSON từ request body
app.use(express.urlencoded({ extended: true })); // Đọc dữ liệu từ form

// Routes
const apiRoute = require("../routes/kaizen/apiRoute");
app.use("/api/kaizen", apiRoute);

// Default route
app.get("/", (req, res) => {
  res.status(200).send("Hello, World!");
});

// Error Handling Middleware
app.use(logErrors);
app.use(clientErrorHandler);
app.use(errorHandler);

function logErrors(err, req, res, next) {
  console.error(err.stack);
  next(err);
}

function clientErrorHandler(err, req, res, next) {
  if (req.xhr) {
    res.status(500).send({ error: "Something failed!" });
  } else {
    next(err);
  }
}
function errorHandler(err, req, res, next) {
  if (res.headersSent) {
    return next(err);
  }
  res.status(500);
  res.render("error", { error: err });
}

// Start HTTP server
app.listen(port, ip, () => {
  console.log(`HTTP server running at http://${ip}:${port}/`);
});

// HTTPS options (Đảm bảo tệp key và certificate tồn tại)
const httpsOptions = {
  key: fs.readFileSync(path.join(__dirname, "../ssl/private-key.pem")),
  cert: fs.readFileSync(path.join(__dirname, "../ssl/certificate.pem")),
};

// Start HTTPS server
https.createServer(httpsOptions, app).listen(httpsPort, () => {
  console.log(`HTTPS server running at https://${ip}:${httpsPort}/`);
});
