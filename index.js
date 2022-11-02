require("dotenv").config();
const express = require("express");
const morgan = require("morgan");
const cors = require("cors");
const helmet = require("helmet");
const mongoose = require("mongoose");
const app = express();
const PORT = process.env.PORT || 5000;
const { FaceModel } = require("./models/face.js")

app.use(express.static(__dirname + "/public"));

mongoose.connect('mongodb://localhost/recognized_faces')
  .then(() => {
    console.log('DB Connection eastablished');
  }).catch((err) => {
    console.error(err);
  });

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


app.post('/uploadFace', async (req, res) => {
  const { id } = req.body

  // await writeToJsonFile(jsonObj, path.join(__dirname, '../data/people.json'));
  const recognizedPerson = await FaceModel.findOne({ id });
  if (!recognizedPerson) {
    await FaceModel.create(req.body);
    res.status(200).send({ sucess: true });
  } else {
    res.status(400).send({ success: false });
  }
})


app.listen(PORT, () =>
  console.log("Server is running at http://127.0.0.1:" + PORT)
);
