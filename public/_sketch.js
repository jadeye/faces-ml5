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

const port = 5000;
let faceapi;
let detections = [];
let faces;
let video;
let canvas;
let face;
let expressions;
const tableBody = document.getElementById('content-table');
const BASE_API = `http://localhost:${port}`

const HARD_CODED_IMG = "https://www.simplilearn.com/ice9/free_resources_article_thumb/Advantages_and_Disadvantages_of_artificial_intelligence.jpg";
let dbPeopleData;

function setup() {
  loadFacesFromDB().then((res) => {
    console.log("faces:", res);
    dbPeopleData = res;
  }).catch((erro) => {
    console.error(erro);
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
}

async function getLabelFaceDescriptions(labels = ['Matan', 'Yehuda', 'Yoni_Open', 'Yoni_Closed']) {
  return await Promise.all(
    labels.map(async label => {
      // fetch image data from urls and convert blob to HTMLImage element
      const imgUrl = `./photos/${label}.jpg`
      const img = await faceapi.model.fetchImage(imgUrl)
      // detect the face with the highest score in the image and compute it's landmarks and face descriptor
      const fullFaceDescription = await faceapi.model.detectSingleFace(img).withFaceLandmarks().withFaceDescriptor()
      if (!fullFaceDescription) {
        throw new Error(`no faces detected for ${label}`)
      }

      const faceDescriptors = [fullFaceDescription.descriptor];

      return new faceapi.model.LabeledFaceDescriptors(label, faceDescriptors)
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

async function savePerson(video) {

  // console.log(video);
  // const rawResponse = await fetch(`http://localhost:${port}/uploadFace`, {
  //   method: 'POST',
  //   headers: {
  //     'Accept': 'application/json',
  //     'Content-Type': 'application/json'
  //   },
  //   body: JSON.stringify({
  //     id: id,
  //     name: name,
  //     descriptors: face.descriptor,
  //     parts: face.parts,
  //   })
  // });

  // const content = await rawResponse.json();
  // console.log(content);

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

  const id = document.getElementById('personId');
  const name = document.getElementById('personName');
  const idValue = id.value;
  const nameValue = name.value;

  const captureImageBtn = document.getElementById('new-person-btn');
  captureImageBtn.disabled = true;

  captureImageBtn.addEventListener("click", () => {
    const snapedImage = image(video, 0, 0);
    console.log(`snapedImage ${snapedImage}.png`);
    save(`${snapedImage}.png`)
  })

  name.addEventListener('focusout', (event) => {
    // if id noEmpty && name.length > 2
    // then Btn enambled
    // on BtnClick capture image
    if ((name.length >= 2) && (id.length >= 8)) {
      captureImageBtn.disabled = false;
    }
  });

  console.log(captureImageBtn);
  captureImageBtn.addEventListener('click', async (e) => {
    e.preventDefault();
    await savePerson(video);
  })
}


function addToTable({ name, img, date }) {
  let table = document.getElementById("content-table");
  let row = table.insertRow(1);
  let new_name = row.insertCell(0);
  let new_time = row.insertCell(1);
  let new_image = row.insertCell(1);
  const imgDt = document.createElement('img');
  imgDt.style.width = '25px';
  imgDt.style.height = '25px';
  imgDt.src = img
  new_name.appendChild(imgDt);
  new_time.innerHTML = date;
  new_image.innerHTML = name;
}


function faceReady() {
  getLabelFaceDescriptions().then((data) => {
    faces = data;
    console.log(faces)
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

async function gotFaces(error, result) {
  if (error) {
    console.log(error);
    return;
  }

  detections = result;　//Now all the data in this detections
  face = detections.length ? detections[0] : null; //if there is at least one detection

  if (faces) {
    const maxDescriptorDistance = 0.6;
    const faceMatcher = new faceapi.model.FaceMatcher(faces, maxDescriptorDistance);
    const recognitionResults = detections.map(fd => faceMatcher.findBestMatch(fd.descriptor));

    for (let i = 0; i < recognitionResults.length; i++) {
      detections[i]['label'] = recognitionResults[i]['_label'];

      const detectedPersonResponse = await sendPostRequest('/detectPeople', { id: '322525999', name: detections[i]['label'], img: HARD_CODED_IMG });
      console.log(detectedPersonResponse)
      if (detectedPersonResponse['success']) {
        addToTable({
          name: detectedPersonResponse.payload.name,
          img: detectedPersonResponse.payload.imagePath,
          date: new Date()
        });
      }

    }
  }


  clear();//Draw transparent background;: 
  drawBoxs(detections);//Draw detection box: 
  drawLandmarks(detections);//// Draw all the face points: 全ての顔のポイントの描画
  drawExpressions(detections, 20, 250, 14);//Draw face expression: 
  faceapi.detect(gotFaces);// Call the function again at here: 
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
  } else text('no face detected');    //If no faces is detected
}
