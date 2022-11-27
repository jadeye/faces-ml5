const Expressions = {
  Sad: "sad",
  Angry: "angry",
  Disgusted: "disgusted",
  Fearful: "fearful",
  Happy: "happy",
  Neutral: "neutral",
  Surprised: "surprised",
}

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
// const cameraSwitch = document.getElementById("switchRoundedDefault");
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

/* 
prelimanary - capture descriptors on person screenshot
1. stale face - max expression is persistant
2. descriptors - compare to multiple captures of descriptors
3. right/ left eye - check if ew can create a circle and detect eye color
*/


cancelFormBtn.addEventListener('click', function () {
  document.getElementById('userImageCapture').src = '';
})


function setup() {
  loadFacesFromDB().then(async (res) => {
    // console.log("faces:", res);
    dbPeopleData = await (res.json());
    // console.log(dbPeopleData);
  }).catch((erro) => {
    // console.error(erro);
  })
  initUploadNewFaceButton();

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

/*
* <!-- end of Setup -->
*/
// console.log(imagesObject);
/*
 * CheckBox toggle between face recognition and
 * Snapshot of a new user
*/
cameraSwitch.addEventListener('change', function () {
  if (this.checked) {
    // console.log(`${this.checked} Checkbox is checked..`);
    document.getElementById('canvas').style.visibility = 'visible';
    // document.getElementById('canvas').style.display = 'block';
    document.getElementById('personId').disabled = true;
    document.getElementById('personName').disabled = true;
    document.getElementById('submitBtn').disabled = true;
    document.getElementById('cancelFormBtn').disabled = true;

  } else {
    // console.log(`${this.checked} Checkbox is not checked..`);
    document.getElementById('canvas').style.visibility = 'hidden';
    // document.getElementById('canvas').style.display = 'none';
    document.getElementById('personId').disabled = false;
    document.getElementById('personName').disabled = false;
    document.getElementById('submitBtn').disabled = false;
    document.getElementById('cancelFormBtn').disabled = false;
  }
  cameraSwitchValue = this.checked;
});

const imagesOfPeople = {};
async function getLabelFaceDescriptions() {
  // const images = await getImageNames();
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
      let personName = label.slice(0, formatIndex);
      let name = extractNameWithoutID(personName);
      const personId = extractID(personName);
      imagesOfPeople[personId] = img;

      return new faceapi.model.LabeledFaceDescriptors(name, faceDescriptors)
    })
  )
}

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

function extractNameWithoutID(name) {
  const idIndex = name.indexOf('-');
  return name.slice(0, idIndex);
}

function extractID(name) {
  const idIndex = name.indexOf('-');
  return name.slice(idIndex + 1);
}

function getPersonInfoByName(facesList, name) {

  person = facesList.find((face) => face.name === name);
  return person;
}

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

function getColorfulEmotion(baseEmoji, expression) {
  return `<h1> ${baseEmoji} ${expression.toUpperCase()}</h1>`;
}

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

let counterId = 0;
const timeCounter = (start, timerHtml) => setInterval(function () {
  let delta = Date.now() - start; // milliseconds elapsed since start
  if (Math.floor(delta / 1000) === 6) {
    clearInterval(counterId);
    return;
  };

  timerHtml.innerHTML = Math.floor(delta / 1000)
}, 1000); // update about every second

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
      // console.log(userImageCapture.src);
      imgInput.value = userImageCapture.src;
      // console.log(imgInput.value);
      const formData = new FormData(form);
    }

  form.addEventListener("formdata", async (e) => {
    // console.log("formdata fired");
    // Get the form data from the event object
    const data = e.formData;
    let json = {};

    for (const key of data.keys()) {
      json[key] = data.get(key);
    }
    //console.log(json['img'])
    
    // const fullFaceDescription = [await faceapi.model.detectSingleFace(json['img']).withFaceLandmarks().withFaceDescriptor()]
    // console.log(fullFaceDescription);
    // json['descriptors'] = fullFaceDescription;

    // console.log(json);
    sendPostRequest("/user-data", json).then((res) => console.log(res))
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
    sendPostRequest("/btn", json).then((res)=> console.log(res))
    .catch((err)=> console.error(err));
  });
}

function faceReady() {
  getLabelFaceDescriptions().then((data) => {
    faces = data;
    // console.log(faces)
  })
  faceapi.detect(gotFaces);// Start detecting faces
}
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

let count = 0;

async function gotFaces(error, result) {
  if (error) {
    console.error(error);
    return;
  }

  detections = result;　//Now all the data in this detections
  face = detections.length ? detections[0] : null; //if there is at least one detection

  if (faces) {
    const maxDescriptorDistance = 0.4; // 0.6 is the current maximum distance 15.11
    const faceMatcher = new faceapi.model.FaceMatcher(faces, maxDescriptorDistance);
    const recognitionResults = detections.map(fd => faceMatcher.findBestMatch(fd.descriptor));
    
    // console.log(recognitionResults)
    for (let i = 0; i < recognitionResults.length; i++) {
      detections[i]['label'] = recognitionResults[i]['_label'];
      let facesList = dbPeopleData.faces;
      // console.log(facesList);
      const person = getPersonInfoByName(facesList, detections[i]['label'])
      // console.log(person)
      if (person){
        count+=1;
        const recognizeData = detections[i];
        const highestEmotionScore = Object.keys(recognizeData.expressions).reduce(function (a, b) { return recognizeData.expressions[a] > recognizeData.expressions[b] ? a : b });
        // console.log(`highestEmotionScore ${highestEmotionScore}`);
        (emo ==='') ? emo = highestEmotionScore : emo === highestEmotionScore ? emo : (emo = highestEmotionScore, falsePositiveEmoCounter++);
        console.log(`EMO ${emo}`);
        if (falsePositiveEmoCounter <= FALSE_POSITIVE_EMO_COUNTER_THRESHHOLD ) {
          isLivePerson = false;
          // console.log(`PIC ${falsePositiveEmoCounter}`);
        } else {
          isLivePerson = true;
          console.log(`isLivePerson ${isLivePerson}`);
        }
        console.log(count)
        // console.log(typeof recognizeData.parts["rightEye"][0])
        // console.log(recognizeData.label , highestEmotionScore ,  recognizeData.expressions);
        // console.log(`BEFORE 10 ${count}`);

        if(isLivePerson){
          console.log("live person detected!");
          falsePositiveEmoCounter = 0;
          const detectedPersonResponse = await sendPostRequest('/detectPeople', { id: person.id, name: person.name , recognizeData : recognizeData });
          console.log(`detectedPersonResponse: ${detectedPersonResponse['success']}`);

          if (detectedPersonResponse['success']) {
            console.log(`10 ${count}`);
            let json = {doorPulse: "1"};
            count = 0;
            sendPostRequest("/btn", json).then((res)=> {
              console.log(res)
            })
            .catch((err)=> console.error(err));
            
            addToTable({
              name: detectedPersonResponse.payload.name,
              img: imagesOfPeople[person.id],
              date: new Date()
            });
            console.log(recognizeData)
  
          }
        } else if(count >= MAX_EMOTION_COUNT && !isLivePerson) count = 0;
        }

    }
  }

  clear();//Draw transparent background
  drawBoxs(detections);//Draw detection box
  drawLandmarks(detections);//// Draw all the face points
  drawExpressions(detections, 20, 250, 14);//Draw face expression
  faceapi.detect(gotFaces);// Call the function again at here
}

function drawBoxs(detections) {
  if (detections.length > 0) {//If at least 1 face is detected: もし1つ以上の顔が検知されていたら
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

function drawLandmarks(detections) {
  if (detections.length > 0) {//If at least 1 face is detected: もし1つ以上の顔が検知されていたら
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

function drawExpressions(detections, x, y, textYSpace) {
  if (detections.length > 0) {   //If at least 1 face is detected
    let expressionsArr = detections.map((detect) => { return { label: detect.label, expressions: detect.expressions } });
    updateThrottleText(expressionsArr)
  }
}



function addToTable({ name, img, date }) {
  // console.log({ name, img, date })
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