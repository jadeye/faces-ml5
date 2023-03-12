
// const Expressions = {
//   Sad: "sad",
//   Angry: "angry",
//   Disgusted: "disgusted",
//   Fearful: "fearful",
//   Happy: "happy",
//   Neutral: "neutral",
//   Surprised: "surprised",
// }


const iconsClassNames = {
  happy: "fas fa-smile",
  sad: "fa-solid fa-face-sad-tear",
  angry: "fa-solid fa-face-angry",
  disgusted: "fa-solid fa-face-dizzy",
  fearful: "fa-solid fa-face-frown-open",
  neutral: "fa-solid fa-face-meh",
  surprised: "fa-solid fa-face-surprise"
}


const MAX_EMOTION_COUNT = 6;
const port = 5000;
let faceapi;
let detections = [];
let faces;
let video;
let canvas;
let face;
let expressions;
let cameraSwitchValue;
let count = 0;
let faceMatcher;
const cameraSwitch = document.querySelector("input[name=cameraSwitch]");;
const tableBody = document.getElementById('content-table');
const BASE_API = `http://localhost:${port}`
const cancelFormBtn = document.getElementById('cancelFormBtn');
let dbPeopleData;
let emo = '';
let falsePositiveEmoCounter = 0;
let isLivePerson = false;
const FALSE_POSITIVE_EMO_COUNTER_THRESHHOLD = 2;
const IMAGES_PER_PERSON = {};
const MAX_DESCRIPTORS_DISTANCE = 0.4 // 0.6 is the current maximum distance 15.11
const imagesOfPeople = {};



initDomFunction();

/**
 * Setup function responsible to init the canvas , no need to call the function it uses p5.js
 */
function setup() {
  loadFacesFromDB().then(async (res) => {
    dbPeopleData = await (res.json());
  }).catch((erro) => {
    console.error(erro);
  });


  canvas = createCanvas(640, 480);
  canvas.style('display', 'block');
  canvas.id("canvas");

  const sketchHolder = document.getElementsByClassName("sketch-holder")[0];
  sketchHolder.appendChild(document.querySelector("canvas"));

  video = createCapture(VIDEO);// Creat the video
  video.id("video");

  const faceOptions = {
    withLandmarks: true,
    withExpressions: true,
    withDescriptors: true,
    minConfidence: 0.5
  };

  sketchHolder.appendChild(document.querySelector("video"));
  faceapi = ml5.faceApi(video, faceOptions, faceReady);

  cameraSwitch.checked = true;
}

async function getImageNames() {
  return await fetch(`${BASE_API}/getPhotosNames`);
}

/**
 * @uses images call the getImageNames() function to fetch all photos names in the directory and save them in the variable.
 * @param {string} imgUrl path to photos folder where there are all the images of people who saved in db.
 * @param {Float32Array} descriptor Computed array of the face.
 * @returns {Promiose} Array of labeled face descriptors of every person name and his image , using the faceapi library.
 */
async function getLabelFaceDescriptions() {
  let images = (await getImageNames());
  let promiseResult = await images;
  const photos = await promiseResult.json();

  return await Promise.all(
    photos.map(async label => {
      // fetch image data from urls and convert blob to HTMLImage element
      const imgUrl = `./photos/${label}`;
      const img = await faceapi.model.fetchImage(imgUrl);
      // detect the face with the highest score in the image and compute it's landmarks and face descriptor
      const fullFaceDescription = await faceapi.model.detectSingleFace(img).withFaceLandmarks().withFaceDescriptor()

      if (!fullFaceDescription) {
        throw new Error(`no faces detected for ${label}`)
      }

      const faceDescriptors = [fullFaceDescription.descriptor]

      let formatIndex = label.indexOf('.');
      let personName = label.slice(0, formatIndex); // get person name+id format from the image file name
      let name = extractNameWithoutID(personName);
      const personId = extractID(personName);
      imagesOfPeople[personId] = img; // capture every person's id and img url 

      return new faceapi.model.LabeledFaceDescriptors(name, faceDescriptors)
    })
  )
}

function extractNameWithoutID(name) {
  const idIndex = name.indexOf('-');
  return name.slice(0, idIndex);
}

function extractID(name) {
  const idIndex = name.indexOf('-');
  return name.slice(idIndex + 1);
}

function getPersonInfoByName(facesList, name) {
  return facesList.find((face) => face.name === name);
}

/**
 * @uses getLabelFaceDescriptions return promise that contains array of all people who saved in db and their face descriptors.
 * @uses faceapi.detect(gotFaces) This method responsible to start the detection. gotFaces is another function.
 * @uses faceMatcher global variable use to find match between person in frame to recognize him live. It get the faces from getLabelFaceDescriptions. 
 */
function faceReady() {
  getLabelFaceDescriptions()
    .then((data) => {
      faces = data;
      faceMatcher = new faceapi.model.FaceMatcher(faces, MAX_DESCRIPTORS_DISTANCE);
    })
  faceapi.detect(gotFaces);// Start detecting faces
}

/**
 *  @uses faces golbal array that have all the faces from the db.
 *  @uses faceMatcher use to find the best match and recognize the entered person.
 *  @param {Object} result the result of the detection per frame. this object contains all the detected people it captured in this frame.
 *  @description for every frame faceMatcher find all recognized people for a match it send post request to server and for the next 15s it not gonna allow him
 *               to enter again. for every recognize person the function send puls to server in order to open the door.
 * 
 */
async function gotFaces(error, result) {
  if (error) {
    console.error(error);
    return;
  }

  detections = result;　//Now all the data in this detections
  face = detections.length ? detections[0] : null; //if there is at least one detection

  if (faces) {
    // const faceMatcher = new faceapi.model.FaceMatcher(faces, MAX_DESCRIPTORS_DISTANCE);
    const recognitionResults = detections.map(fd => faceMatcher.findBestMatch(fd.descriptor));

    for (let i = 0; i < recognitionResults.length; i++) {

      detections[i]['label'] = recognitionResults[i]['_label'];
      const person = getPersonInfoByName(dbPeopleData.faces, detections[i]['label']);

      if (person) {
        const recognizeData = detections[i];
        const detectedPersonResponse = await sendPostRequest('/detectPeople', { id: person.id, name: person.name, recognizeData: recognizeData });

        if (detectedPersonResponse['success']) { // check if person has been detect.
          let json = { doorPulse: "1" };

          sendPostRequest("/btn", json).then((res) => { // post request which send pulse to open the door.
            console.log(res)
          }).catch((err) => console.error(err));

          addToTable({
            name: detectedPersonResponse.payload.name,
            img: imagesOfPeople[person.id],
            date: new Date()
          });
        }
      }
    }
  }


  clear();//Draw transparent background
  drawBoxs(detections);//Draw detection box
  drawLandmarks(detections);//// Draw all the face points
  drawExpressions(detections);//Draw face expression
  faceapi.detect(gotFaces);// Call the function again at here
}

/**
 * 
 * @param {*} detections detected people
 * @description draw box boundaries around for each person face
 */
function drawBoxs(detections) {
  if (detections && detections.length > 0) {//If at least 1 face is detected
    for (f = 0; f < detections.length; f++) {
      let { _x, _y, _width, _height } = detections[f].alignedRect._box;
      stroke(44, 169, 225);
      strokeWeight(1);
      noFill();
      rect(_x, _y, _width, _height);
      textSize(24);
      text(detections[f]['label'], _x, _y);
      fill(0, 153);
    }
  }
}

/**
 * 
 * @param {*} detections detected people
 * @description draw landmarks on every detect person
 */
function drawLandmarks(detections) {
  if (detections && detections.length > 0) {//If at least 1 face is detected
    for (f = 0; f < detections.length; f++) {
      let points = detections[f].landmarks.positions;
      for (let i = 0; i < points.length; i++) {
        stroke(44, 169, 225);
        strokeWeight(3);
        point(points[i]._x, points[i]._y);
      }
    }
  }
}

/**
 * 
 * @param {*} expressionsArr expressions of all detected people
 * @description responsible to draw all face expressions on grid. match color to expression.
 */
function displayExpressions(expressionsArr) {
  document.getElementsByClassName("expressions")[0].innerHTML = "";
  expressionsArr.forEach(expression => {
    const expressions = expression.expressions;
    const name = expression.label;
    if (name !== 'unknown') {
      const highestEmotionScore = Object.keys(expressions).reduce(function (a, b) { return expressions[a] > expressions[b] ? a : b });
      const baseEmoji = `<div class='column'> <i class='${iconsClassNames[highestEmotionScore]} ${highestEmotionScore} fa-8x'></i> </div>`

      document.getElementsByClassName("expressions")[0].innerHTML += `${name} ${getColorfulEmotion(baseEmoji, highestEmotionScore)}`
    }
  });
}

function drawExpressions(detections) {
  if (detections && detections.length > 0) {   //If at least 1 face is detected
    let expressionsArr = detections.map((detect) => { return { label: detect.label, expressions: detect.expressions } });
    updateThrottleText(expressionsArr)
  }
}

/**
 * 
 * @param {*} baseEmoji html wrapper for color to draw face expression
 * @param {string} expression the expression name
 * @returns 
 */
function getColorfulEmotion(baseEmoji, expression) {
  return `<h1> ${baseEmoji} ${expression.toUpperCase()}</h1>`;
}

/**
 * this function use throttle mechanisem to draw on the dom the expressions , in efficient way.
 */
const updateThrottleText = throttle((expressions) => {
  displayExpressions(expressions)
}, 1000)

function throttle(cb, delay = 1000) {
  let shouldWait = false
  let waitingArgs
  const timeoutFunc = () => {
    if (waitingArgs == null) {
      shouldWait = false
    } else {
      cb(...waitingArgs)
      waitingArgs = null
      setTimeout(timeoutFunc, delay)
    }
  }

  return (...args) => {
    if (shouldWait) {
      waitingArgs = args
      return
    }

    cb(...args)
    shouldWait = true

    setTimeout(timeoutFunc, delay)
  }
}



function addToTable({ name, img, date }) {
  if (name && img && date) {
    let table = document.getElementById("content-table");
    let row = table.insertRow(1);
    let new_name = row.insertCell(0);
    let new_time = row.insertCell(1);
    let new_image = row.insertCell(1);
    // console.log(typeof img);
    const imgDt = document.createElement('img');
    imgDt.style.width = '25px';
    imgDt.style.height = '25px';
    imgDt.src = img.src;
    new_name.appendChild(imgDt);
    new_time.innerHTML = date;
    new_image.innerHTML = name;
  }
}

/**
 * Calls all other function that involve in DOM manipulation 
 */
function initDomFunction() {
  initFunctionalityToCameraSwitchButton();
  initUploadNewFaceButton();
  initCancelFormButton();
}

/**
 * CheckBox toggle between face recognition and 
 * Snapshot of a new user
 */
function initFunctionalityToCameraSwitchButton() {
  cameraSwitch.addEventListener('change', function () {
    if (this.checked) {
      document.getElementById('canvas').style.visibility = 'visible';
      document.getElementById('personId').disabled = true;
      document.getElementById('personName').disabled = true;
      document.getElementById('submitBtn').disabled = true;
      document.getElementById('cancelFormBtn').disabled = true;

    } else {
      document.getElementById('canvas').style.visibility = 'hidden';
      document.getElementById('personId').disabled = false;
      document.getElementById('personName').disabled = false;
      document.getElementById('submitBtn').disabled = false;
      document.getElementById('cancelFormBtn').disabled = false;
    }
    cameraSwitchValue = this.checked;
  });
}

/***
 * Add all the functionlaity and validation of adding new face person to the DB.
 * It responsible to the form behavior.
 */
function initUploadNewFaceButton() {

  const userId = document.getElementById('personId');
  const userName = document.getElementById('personName');
  let imageCaptured = false;
  let idValue;
  let nameValue;
  const form = document.getElementById("userDetails");
  const captureImageBtn = document.getElementById('new-person-btn');
  captureImageBtn.disabled = true;

  captureImageBtn.addEventListener("click", () => {
    const snapedImage = image(video, 0, 0);

    let userImageCapture = document.getElementById("userImageCapture");
    saveFrames(`${nameValue}`, 'png', 1, 25, data => {
      userImageCapture.src = `${data[0]["imageData"]}`;
    });
  }) // replaced paranthesis commented under submitForm func
  form.addEventListener("submit", submitForm);

  function submitForm(e) {
    e.preventDefault();
    const imgInput = document.getElementById("imageUpload");
    imgInput.value = userImageCapture.src;
    const formData = new FormData(form);
  }

  form.addEventListener("formdata", async (e) => {
    const data = e.formData;
    let json = {};

    for (const key of data.keys()) {
      json[key] = data.get(key);
    }

    sendPostRequest("/user-data", json).
      then((res) => {
        console.log(res);
      })
      .catch((err) => console.error(err));
  });

  userName.addEventListener('focusout', (event) => {
    idValue = userId.value;
    nameValue = userName.value;
    if ((nameValue.length >= 2) && (idValue.length >= 8)) {
      captureImageBtn.disabled = false;
    } else {
      captureImageBtn.disabled = true;
    }
  });

  const doorPulseForm = document.getElementById("doorPulseForm");

  doorPulseForm.addEventListener("submit", submitDoorForm);

  function submitDoorForm(e) {
    e.preventDefault();
    const doorFormData = new FormData(doorPulseForm);
  }

  doorPulseForm.addEventListener("formdata", (e) => {
    // console.log("doorPulseForm formdata fired");
    // Get the form data from the event object
    const data = e.formData;
    let json = {};

    for (const key of data.keys()) {
      json[key] = data.get(key);
    }
    sendPostRequest("/btn", json).then((res) => console.log(res))
      .catch((err) => console.error(err));
  });
}

function initCancelFormButton() {
  cancelFormBtn.addEventListener('click', function () {
    document.getElementById('userImageCapture').src = '';
  })
}

//======== API Functions ===========
async function loadFacesFromDB() {
  return new Promise(async (resolve, reject) => {
    const faces = await fetch(`${BASE_API}/getFaces`);
    if (!faces && !faces.length) {
      reject({ message: "Can't find faces" });
    } else {
      resolve(faces);
    }
  })
}

/**
 * 
 * @param {string} route url to specific request.
 * @param {JSON} json  the data to send in post request.
 * @returns 
 */
async function sendPostRequest(route, json) {
  const rawResponse = await fetch(`${BASE_API}${route}`, {
    method: 'POST',
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(json)
  });
  return await rawResponse.json();
}
