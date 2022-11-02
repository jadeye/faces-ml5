require("dotenv").config();
const express = require("express");
const morgan = require("morgan");
const cors = require("cors");
const helmet = require("helmet");

const app = express();
const PORT = process.env.PORT || 5000;

app.use(express.static(__dirname + "/public"));

//cors & helmet => for security
app.use(cors());
app.use(helmet());

// used to log requests
if (process.env.NODE_ENV === "development") {
  app.use(morgan("dev"));
}

app.use(
  express.json({
    extended: false,
  })
);

app.get("/", (req, res) => {
  // res.json("API running.");
  res.render("index.html");
});

app.listen(PORT, () =>
  console.log("Server is running at http://127.0.0.1:" + PORT)
);
