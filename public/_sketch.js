const Expressions = {
  Sad: "sad",
  Angry: "angry",
  Disgusted: "disgusted",
  Fearful: "fearful",
  Happy: "happy",
  Neutral: "neutral",
  Surprised: "surprised",
}

const icosClassNames = {
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

function setup() {

  loadFacesFromDB().then((res) => {
    console.log("faces:", res);
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

      const faceDescriptors = [fullFaceDescription.descriptor]
      /* console.log(fullFaceDescription.descriptor);
      console.log(faceDescriptors); */

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

function displayExpressions(expressions) {
  const highestEmotionScore = Object.keys(expressions).reduce(function (a, b) { return expressions[a] > expressions[b] ? a : b });
  const baseEmoji = `<i class='${icosClassNames[highestEmotionScore]} ${highestEmotionScore} fa-8x'></i>`
  document.getElementsByClassName("expressions")[0].innerHTML = `${getColorfulEmotion(baseEmoji, highestEmotionScore)}`

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
  let idValue;
  let nameValue;

  const captureImageBtn = document.getElementById('new-person-btn');
  captureImageBtn.disabled = true;

  captureImageBtn.addEventListener("click", () => {
    const snapedImage = image(video, 0, 0);
    // saveCanvas(`${nameValue}.png`);
    /* saveFrames(`${nameValue}.png`, (data) => {
      console.log(data)
    }); */
    let userImageCapture = document.getElementById("userImageCapture");
    saveFrames(`${nameValue}`, 'png', 1, 25, data => {
      userImageCapture.src = `${data[0]["imageData"]}`;
      // console.log(data);
      console.log(data[0]["imageData"]);
    });

    const form = document.getElementById("userDetails");

      form.addEventListener("submit", submitForm);

      function submitForm(e) {
          e.preventDefault();
          const userImg = document.getElementById("userImageCapture").src;
          const formData = new FormData();
          formData.append("name", nameValue);
          formData.append("id", idValue);
          formData.append("img", userImg)
          // console.log(formData);
          console.log(`Request Body: \n\r
          ================================================================\n\r
          ${FormData.getAll()}`);
          
          fetch("http://localhost:5000/user-data", {
              method: 'POST',
              body: formData,
              headers: {
                "Content-Type": "multipart/form-data"
              }
          })
              .then((res) => console.log(res))
              .catch((err) => ("Error occured", err));
      }
  })

  userName.addEventListener('focusout', (event) => {
    idValue = userId.value;
    nameValue = userName.value;
    if((nameValue.length >= 2) && (idValue.length >= 8)){
      captureImageBtn.disabled = false;
    } else {
      captureImageBtn.disabled = true;
    }
  });

  console.log(captureImageBtn);
  captureImageBtn.addEventListener('click', async (e) => {
    // if (face !== null && face) {
    e.preventDefault();
    // counterId = timeCounter(Date.now(), timerHtml);
    await savePerson(video);
    // }
  })
}

function faceReady() {
  getLabelFaceDescriptions().then((data) => {
    faces = data;
    console.log(faces)
  })
  faceapi.detect(gotFaces);// Start detecting faces
}

function gotFaces(error, result) {
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



function takesnap() {
  image(video, 0, 0); //draw the image being captured on webcam onto the canvas at the position (0, 0) of the canvas
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
        // console.log(element);
      } // console.log("true")
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