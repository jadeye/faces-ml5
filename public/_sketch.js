const Expressions = {
  Sad: "sad",
  Angry: "angry",
  Disgusted: "disgusted",
  Fearful: "fearful",
  Happy: "happy",
  Neutral: "neutral",
  Surprised: "surprised",
}

const port = 5000;
// import * as FACE_API from '../dist/face-api.esm.js';


let faceapi;
let detections = [];
let faces;
let video;
let canvas;
let face;
let expressions;
// const 


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

      const faceDescriptors = [fullFaceDescription.descriptor]
      console.log(fullFaceDescription.descriptor);
      console.log(faceDescriptors);

      return new faceapi.model.LabeledFaceDescriptors(label, faceDescriptors)
    })
  )
}

async function loadFacesFromDB() {
  return new Promise(async (resolve, reject) => {
    const faces = await fetch(`http://localhost:${port}/getFaces`);
    if (!faces && !faces.length) {
      reject({ message: "Can't find faces" });
    } else {
      resolve(faces);
    }
  })
}

async function savePerson(face) {
  const id = document.getElementById('id').value;
  const name = document.getElementById('name').value;


  const rawResponse = await fetch(`http://localhost:${port}/uploadFace`, {
    method: 'POST',
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      id: id,
      name: name,
      descriptors: face.descriptor,
      parts: face.parts,
    })
  });
  const content = await rawResponse.json();
  console.log(content);

}

function displayExpressions(expressions) {
  const heightEmotionScroe = Object.keys(expressions).reduce(function (a, b) { return expressions[a] > expressions[b] ? a : b });
  document.getElementsByClassName("expressions")[0].innerHTML = `${JSON.stringify(getColorfulEmotion(heightEmotionScroe))}`;
}

function getColorfulEmotion(expression) {
  switch (expression) {
    case Expressions.Sad:
      return "<span class='sad'>" + expression.toUpperCase() + "</span>";
    case Expressions.Angry:
      return "<span class='angry'>" + expression.toUpperCase() + "</span>";
    case Expressions.Disgusted:
      return "<span class='disgusted'>" + expression.toUpperCase() + "</span>";
    case Expressions.Happy:
      return "<span class='happy'>" + expression.toUpperCase() + "</span>";
    case Expressions.Neutral:
      return "<span class='neutral'>" + expression.toUpperCase() + "</span>";
    case Expressions.Surprised:
      return "<span class='surprised'>" + expression.toUpperCase() + "</span>";
    case Expressions.Fearful:
      return "<span class='fearful'>" + expression.toUpperCase() + "</span>";
    default:
      return "<span> Error </span>";
  }
}

const updateThrottleText = throttle((expressions) => {
  console.log(expressions)
  displayExpressions(expressions)
}, 100)


/* > 0.39
*angry = RED - spectrum 0.3-1
: 
0.5850219130516052
* disgusted PRUPLE
: 
0.009359528310596943
* fearful - BLACK
: 
0.00000575954027226544
* happy - GREEN
: 
0.004009660799056292
* neutral - YELLOW
: 
0.39498046040534973
* sad - blue
: 
0.006038207095116377
* surprised - WHITE
: 
0.0005844676634296775
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><!--! Font Awesome Pro 6.2.0 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license (Commercial License) Copyright 2022 Fonticons, Inc. --><path d="M256 512c141.4 0 256-114.6 256-256S397.4 0 256 0S0 114.6 0 256S114.6 512 256 512zM164.1 325.5C182 346.2 212.6 368 256 368s74-21.8 91.9-42.5c5.8-6.7 15.9-7.4 22.6-1.6s7.4 15.9 1.6 22.6C349.8 372.1 311.1 400 256 400s-93.8-27.9-116.1-53.5c-5.8-6.7-5.1-16.8 1.6-22.6s16.8-5.1 22.6 1.6zM208.4 208c0 17.7-14.3 32-32 32s-32-14.3-32-32s14.3-32 32-32s32 14.3 32 32zm128 32c-17.7 0-32-14.3-32-32s14.3-32 32-32s32 14.3 32 32s-14.3 32-32 32z"/></svg>
*/

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

// let canvas;

function centerCanvas() {
  var x = (windowWidth - width) / 2;
  var y = (windowHeight - height) / 2;
  canvas.position(x, y);
  video.position(x, y);
}

function windowResized() {
  // centerCanvas();
}

function setup() {

  // initUploadNewFaceButton();
  loadFacesFromDB().then((res) => {
    console.log("faces:", res);
  }).catch((erro) => {
    console.error(erro);
  })
  //  createCanvas(720, 480);
  canvas = createCanvas(windowWidth / 2, windowHeight / 2);
  canvas.style('display', 'block');
  canvas.id("canvas");
  const sketchHolder = document.getElementsByClassName("sketch-holder")[0];

  sketchHolder.appendChild(document.querySelector("canvas"));
  // canvas.appendChild(sketchHolder);


  video = createCapture(VIDEO);// Creat the video: ビデオオブジェクトを作る
  console.log(canvas);
  video.id("video");
  video.size(windowWidth / 2, windowHeight / 2);

  const faceOptions = {
    withLandmarks: true,
    withExpressions: true,
    withDescriptors: true,
    minConfidence: 0.5
  };

  sketchHolder.appendChild(document.querySelector("video"));


  faceapi = ml5.faceApi(video, faceOptions, faceReady);
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
  const timerHtml = document.getElementById('timer');
  const btn = document.getElementById('new-person-btn');

  btn.addEventListener('click', async (e) => {
    if (face !== null && face) {
      e.preventDefault();
      counterId = timeCounter(Date.now(), timerHtml);
      await savePerson(face);
    }
  })
}


function faceReady() {
  getLabelFaceDescriptions().then((data) => {
    faces = data;
  })
  faceapi.detect(gotFaces);// Start detecting faces: 顔認識開始
}

// Got faces: 顔を検知
function gotFaces(error, result) {
  if (error) {
    console.log(error);
    return;
  }

  detections = result;　//Now all the data in this detections: 全ての検知されたデータがこのdetectionの中に
  face = detections.length ? detections[0] : null; //if there is at least one detection

  if (faces) {
    const maxDescriptorDistance = 0.6;
    const faceMatcher = new faceapi.model.FaceMatcher(faces, maxDescriptorDistance);
    const recognitionResults = detections.map(fd => faceMatcher.findBestMatch(fd.descriptor));

    for (let i = 0; i < recognitionResults.length; i++) {
      detections[i]['label'] = recognitionResults[i]['_label'];

    }
  }


  clear();//Draw transparent background;: 透明の背景を描く
  drawBoxs(detections);//Draw detection box: 顔の周りの四角の描画
  drawLandmarks(detections);//// Draw all the face points: 全ての顔のポイントの描画
  drawExpressions(detections, 20, 250, 14);//Draw face expression: 表情の描画
  faceapi.detect(gotFaces);// Call the function again at here: 認識実行の関数をここでまた呼び出す
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
  if (detections.length > 0) {//If at least 1 face is detected: もし1つ以上の顔が検知されていたら
    let { neutral, happy, angry, sad, disgusted, surprised, fearful } = detections[0].expressions;
    textFont('Helvetica Neue');
    textSize(14);
    noStroke();
    fill(44, 169, 225);
    // displayExpressions()
    updateThrottleText({ neutral, happy, angry, sad, disgusted, surprised, fearful })

    // text("neutral:       " + nf(neutral * 100, 2, 2) + "%", x, y);
    // text("happiness: " + nf(happy * 100, 2, 2) + "%", x, y + textYSpace);
    // text("anger:        " + nf(angry * 100, 2, 2) + "%", x, y + textYSpace * 2);
    // text("sad:            " + nf(sad * 100, 2, 2) + "%", x, y + textYSpace * 3);
    // text("disgusted: " + nf(disgusted * 100, 2, 2) + "%", x, y + textYSpace * 4);
    // text("surprised:  " + nf(surprised * 100, 2, 2) + "%", x, y + textYSpace * 5);
    // text("fear:           " + nf(fearful * 100, 2, 2) + "%", x, y + textYSpace * 6);
  } else {//If no faces is detected: 顔が1つも検知されていなかったら
    text("neutral: ", x, y);
    text("happiness: ", x, y + textYSpace);
    text("anger: ", x, y + textYSpace * 2);
    text("sad: ", x, y + textYSpace * 3);
    text("disgusted: ", x, y + textYSpace * 4);
    text("surprised: ", x, y + textYSpace * 5);
    text("fear: ", x, y + textYSpace * 6);
  }
}

// YONI ADD ONS
function add_to_table(index) {
  let table = document.getElementById("content-table");
  table.insertRow(1).id = index + 1;
  let row = document.getElementById(index + 1)
  let new_name = row.insertCell(0);
  let new_time = row.insertCell(1);
  let new_image = row.insertCell(1);
  new_name.innerHTML = index + 1;
  new_time.innerHTML = index;
  new_image.innerHTML = index * 2;

}

for (let index = 0; index < 15; index++) {
  add_to_table(index)
}


function add_class() {
  let x = document.getElementById("content-table").rows.length - 1;
  if (x % 2 == 0) {
    for (let index = 0; index < x; index++) {
      if (index % 2 != 0) {
        let element = document.getElementById(index)
        element.classList.add("active-row");
        console.log(element);
      } console.log("true")
    }

  }
  else {
    for (let index = 0; index < x; index++) {
      if (index % 2 == 0 && index != 0) {
        let element = document.getElementById(index)
        element.classList.add("active-row");

      }
    }
  }
}
add_class()