let faceapi;
let detections = [];

let video;
let canvas;
let ctx;

function setup() {
  //   canvas = createCanvas(480, 360, WEBGL);
  //   let crc2d = new CanvasRenderingContext2D({ willReadFrequently: false });
  canvas = createCanvas(480, 360, P2D);

  const canvasHTMLElement = document.getElementById("canvas");
  const ctx = canvasHTMLElement.getContext("2d");
  //   ctx = drawingContext();
  // returns {alpha: false, colorSpace: 'srgb', desynchronized: false, willReadFrequently: false}
  /* 
  console.log(ctx.getContextAttributes());
  ctx.setAttributes("willReadFrequently", true);
   */
  //   const ctx = canvas.getContext("2d");
  //   console.log(ctx); // CanvasRenderingContext2D { /* … */ }
  canvas.id("canvas");

  video = createCapture(VIDEO); // Creat the video
  video.id("video");
  video.size(width, height);

  const faceOptions = {
    withLandmarks: true,
    withExpressions: true,
    withDescriptors: true,
    minConfidence: 0.5,
    MODEL_URLS: {
      Mobilenetv1Model:
        "https://raw.githubusercontent.com/ml5js/ml5-data-and-models/main/models/faceapi/ssd_mobilenetv1_model-weights_manifest.json",
      FaceLandmarkModel:
        "https://raw.githubusercontent.com/ml5js/ml5-data-and-models/main/models/faceapi/face_landmark_68_model-weights_manifest.json",
      FaceLandmark68TinyNet:
        "https://raw.githubusercontent.com/ml5js/ml5-data-and-models/main/models/faceapi/face_landmark_68_tiny_model-weights_manifest.json",
      FaceRecognitionModel:
        "https://raw.githubusercontent.com/ml5js/ml5-data-and-models/main/models/faceapi/face_recognition_model-weights_manifest.json",
    },
  };

  // Unfinished code , should do comparison with landmarks and descriptor of video and image
  // const maxDescriptorDistance = 0.6;
  // faceapi = ml5.faceApi(video, faceOptions, faceReady);
  // const faceMatcher = new faceapi.model.FaceMatcher();

  //Initialize the model
  faceapi = ml5.faceApi(video, faceOptions, faceReady);
  // context = canvas.getContext('2d' [, { [ alpha: true ] [, desynchronized: false ] [, colorSpace: 'srgb'] [, willReadFrequently: false ]} ])
}

let newPersonCameraCapture = false;

const timeCounter = (start) =>
  setInterval(function () {
    let delta = Date.now() - start; // milliseconds elapsed since start
    if (Math.floor(delta / 1000) === 5) {
      newPersonCameraCapture = false;
      return;
    }
    // timer.innerHTML = (Math.floor(delta / 1000)); // in seconds
    console.log(Math.floor(delta / 1000));
    // alternatively just show wall clock time:
    // timer.innerHTML = (new Date().toUTCString());
  }, 1000); // update about every second

function initUploadNewFaceButton() {
  const timer = document.getElementById("timer");
  const btn = document.getElementById("new-person-btn");
  btn.addEventListener("click", async (e) => {
    if (face !== null && face) {
      newPersonCameraCapture = true;
      e.preventDefault();

      timer.innerHTML = timeCounter(Date.now());
      if (newPersonCameraCapture) {
        clearInterval(timeCounter());
        return;
      }

      const rawResponse = await fetch(`http://localhost:${port}/uploadFace`, {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          descriptors: face.descriptors,
          parts: face.parts,
        }),
      });
      const content = await rawResponse.json();

      console.log(content);
    }
  });
}

function faceReady() {
  faceapi.detect(gotFaces); // Start detecting faces
  faceapi.c;
}

// Got faces
function gotFaces(error, result) {
  if (error) {
    console.log(error);
    return;
  }

  detections = result; //Now all the data in this detections
  // console.log(detections);

  clear(); //Draw transparent background;
  drawBoxs(detections); //Draw detection box
  drawLandmarks(detections); //// Draw all the face points
  drawExpressions(detections, 20, 250, 14); //Draw face expression

  faceapi.detect(gotFaces); // Call the function again at here
}

function drawBoxs(detections) {
  if (detections.length > 0) {
    //If at least 1 face is detected
    for (f = 0; f < detections.length; f++) {
      let { _x, _y, _width, _height } = detections[f].alignedRect._box;
      stroke(44, 169, 225);
      strokeWeight(1);
      noFill();
      rect(_x, _y, _width, _height);
    }
  }
}

function drawLandmarks(detections) {
  if (detections.length > 0) {
    //If at least 1 face is detected: もし1つ以上の顔が検知されていたら
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
  if (detections.length > 0) {
    //If at least 1 face is detected: もし1つ以上の顔が検知されていたら
    let { neutral, happy, angry, sad, disgusted, surprised, fearful } =
      detections[0].expressions;
    textFont("Helvetica Neue");
    textSize(14);
    noStroke();
    fill(44, 169, 225);

    text("neutral:       " + nf(neutral * 100, 2, 2) + "%", x, y);
    text("happiness: " + nf(happy * 100, 2, 2) + "%", x, y + textYSpace);
    text("anger:        " + nf(angry * 100, 2, 2) + "%", x, y + textYSpace * 2);
    text("sad:            " + nf(sad * 100, 2, 2) + "%", x, y + textYSpace * 3);
    text(
      "disgusted: " + nf(disgusted * 100, 2, 2) + "%",
      x,
      y + textYSpace * 4
    );
    text(
      "surprised:  " + nf(surprised * 100, 2, 2) + "%",
      x,
      y + textYSpace * 5
    );
    text(
      "fear:           " + nf(fearful * 100, 2, 2) + "%",
      x,
      y + textYSpace * 6
    );
  } else {
    //If no faces is detected: 顔が1つも検知されていなかったら
    text("neutral: ", x, y);
    text("happiness: ", x, y + textYSpace);
    text("anger: ", x, y + textYSpace * 2);
    text("sad: ", x, y + textYSpace * 3);
    text("disgusted: ", x, y + textYSpace * 4);
    text("surprised: ", x, y + textYSpace * 5);
    text("fear: ", x, y + textYSpace * 6);
  }
}
