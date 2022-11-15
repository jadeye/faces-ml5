require("dotenv").config();
const express = require("express");
const morgan = require("morgan");
const cors = require("cors");
const helmet = require("helmet");
const mongoose = require("mongoose");
const app = express();
const PORT = process.env.PORT || 5000;
const { FaceModel } = require("./models/face.js");
const bodyParser = require('body-parser');
const { savePersonFace } = require("./services/person.js");
const { getAllFaces } = require("./services/profilePicture.js");
const fs = require('fs');
const { getImagesNames } = require("./utils/imagesHelper.js");
const { saveRecognizedPerson } = require("./services/recognition.js");
let authorizedPeople = [];

const getBase64StringFromDataURL = (dataURL) =>
  dataURL.replace('data:', '').replace(/^.+,/, '');

app.use(express.static(__dirname + "/public"));
app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({
  limit: "50mb",
  extended: true,
  parameterLimit: 50000
}));
app.use(cors());
app.use(helmet());

const IMG_PATH = "./public/photos";

// used to log requests
if (process.env.NODE_ENV === "development") {
  app.use(morgan("dev"));
}

app.get("/", async (req, res) => {
  res.render("index.html");
});


app.post('/user-data', async (req, res) => {
  const { name, id, uploaded_file } = req.body;

  const base64img = getBase64StringFromDataURL(uploaded_file);
  const buffer = Buffer.from(base64img, "base64");
  const imagePath = `${IMG_PATH}/${name}-${id}.png`;
  fs.writeFileSync(imagePath, buffer);

  try {
    await savePersonFace({ id, name, imagePath });
    res.send({ success: true, message: "ok" });
  } catch (err) {
    res.status(400).json({ error: err })
  }
})

// TODO: to check if person exists in the arr. if he's so remove him for 15s and send a response back to client. after 15s push him back.
app.post('/detectPeople', async (req, res) => {
  const { id } = req.body;
  const authPerson = authorizedPeople.find((person) => person.id === id); // get the authorized person

  try {
    if (authPerson) {
      authorizedPeople = authorizedPeople.filter((person) => person.id !== authPerson.id); // remove the auth person from the array
      const recognizedPerson = await saveRecognizedPerson(authPerson)
      setTimeout(() => {
        authorizedPeople.push(authPerson);
      }, 15 * 1000)

      res.status(200).json({ success: true, payload: recognizedPerson });
    } else if (!authPerson) {
      res.status(400).send({ success: false, message: "Unrecognized person" });
    }
  } catch (err) {
    res.status(500).send({ success: false, message: err });
  }
});


app.get('/getFaces', async (req, res) => {
  try {
    const faces = await getAllFaces()
    res.status(200).json({ success: true, faces });
  } catch (error) {
    res.status(400).send({ success: false, message: error });
  }
})

app.get('/getPhotosNames', (req, res) => {
  const images = getImagesNames();
  if (images.length) res.status(200).json(images);
  else res.status(400).json({ success: false, message: "no images in directory" });
})

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

mongoose.connect('mongodb://localhost/recognized_faces')
  .then(async () => {
    console.log('DB Connection eastablished');
    authorizedPeople = await FaceModel.find(); // get all authorized people
  }).catch((err) => {
    console.error(err);
  });

// TODO: to check if person exists in the arr. if he's so remove him for 15s and send a response back to client. after 15s push him back.

app.listen(PORT, () =>
  console.log("Server is running at http://127.0.0.1:" + PORT)
);
