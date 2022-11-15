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
const path = require('path');
const { RecognizedPeople } = require("./models/recognizedPeople.js");
let authorizedPeople = [];
const fs = require('fs');
const cp = require('child_process');

const getBase64StringFromDataURL = (dataURL) =>
dataURL.replace('data:', '').replace(/^.+,/, '');

app.use(bodyParser.urlencoded({
  limit: "50mb", 
  extended: true, 
  parameterLimit: 50000
}));
app.use(bodyParser.json({
  limit: "50mb",
}));
app.use(express.static(__dirname + "/public"));
// app.use('/static', express.static(path.join(__dirname, 'public')))

app.use(cors());
app.use(helmet());    

const IMG_PATH = "./images";

// used to log requests
if (process.env.NODE_ENV === "development") {
  app.use(morgan("dev"));
}

app.get("/", async (req, res) => {
  res.render("index.html");
});

app.get('/getFaces', async (req, res) => {
  const faces = await FaceModel.find({});
  if (!faces.length) return res.status(400).send({ success: false });
  res.status(200).json(faces);
})

app.post('/user-data', (req, res) => {
  console.log(req.body);
  const name = req.body.name;
  const imageBase64 = req.body.uploaded_file;
  const base64img = getBase64StringFromDataURL(imageBase64);
  // console.log(base64img);
  const buffer = Buffer.from(base64img, "base64");
  fs.writeFileSync(`${IMG_PATH}/${name}.png`,buffer);
  
  res.send({success:true , message:"ok"});
  // res.status();
}, (error, req, res, next) => {
  res.status(400).send({ error: error.message })
})

app.post('/btn', (req, res) => {
  // shell.exec('./path_to_your_file')
  // cp.spawn('./assets/doorPulse.sh', [args], function(err, stdout, stderr) {
  console.log(req.body);
  cp.exec('./assets/doorPulse.sh', (error, stdout, stderr) => {
    if (error) {
        console.log(`error: ${error.message}`);
        return;
    }
    if (stderr) {
        console.log(`stderr: ${stderr}`);
        return;
    }
    console.log(`stdout: ${stdout}`);
});
res.send({status: 200, message: "ok"});
})
app.post('/detectPeople', async (req, res) => {
  const { name, id } = req.body;
  // console.log({ name, id })
  const authPerson = authorizedPeople.find((person) => person.id === id); // get the authorized person
  
  if (authPerson) {
    authorizedPeople = authorizedPeople.filter((person) => person.id !== authPerson.id); // remove the auth person from the array
    const result = await RecognizedPeople.create({ id, name, imagePath: "hardcoded path" });
    setTimeout(() => {
      authorizedPeople.push(authPerson);
    }, 15 * 1000)

    res.status(200).json({ success: true, payload: result });
  } else if (!authPerson) {
    res.status(400).send({ success: false, message: "Unrecognized person" });
  }
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

mongoose.connect('mongodb://localhost/recognized_faces')
  .then(async () => {
    console.log('DB Connection eastablished');
    authorizedPeople = await FaceModel.find(); // get all authorized people
    // console.log(authorizedPeople)
  }).catch((err) => {
    console.error(err);
  });

// TODO: to check if person exists in the arr. if he's so remove him for 15s and send a response back to client. after 15s push him back.

app.listen(PORT, () =>
console.log("Server is running at http://127.0.0.1:" + PORT)
);
