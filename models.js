var best_label = "";
var model_url = "";
var model_loaded = false;
var model_labels = [];
var model_scores = [];

async function modelType(url){
    if (url){
        const metadata = await (await fetch(url + "metadata.json")).json();
        if (metadata.hasOwnProperty('tfjsSpeechCommandsVersion')){
            return 'audio';
        } else if (metadata.hasOwnProperty('tmVersion')){
            return 'image';
        } else {
            return undefined;
        }
    } else {
        return 'audio';
    }
}

async function modelInit(url) {
    const model_type = await modelType(url);
    switch (model_type) {
        case "audio":
            audioInit(url);
            const audio_visualizer = document.getElementById("audio-visualizer");
            audio_visualizer.style.display = "block";
            break;
        case "image":
            imageInit(url);
            const webcam_overlay = document.getElementById("webcam-container");
            webcam_overlay.style.display = "block";
            break;
    }
}

function sendOnPrediction(classLabels, scores){
    // send label over BLE only when its score exceeds 0.5 and it is different from previous sent
    for (let i = 0; i < classLabels.length; i++) {
        if (scores[i] > 0.5 && classLabels[i] != best_label){
            best_label = classLabels[i];
            sendNotificationToHub(best_label);
            break;
        }
    }
}

async function audioModel(url=""){
    if (url){
        const checkpointURL = url + "model.json"; // model topology
        const metadataURL = url + "metadata.json"; // model metadata
        var recognizer = speechCommands.create(
            "BROWSER_FFT", 
            undefined,
            checkpointURL,
            metadataURL);
    } else {
        var recognizer = speechCommands.create("BROWSER_FFT");
    }

    // check that model and metadata are loaded via HTTPS requests.
    await recognizer.ensureModelLoaded();
    model_loaded = true;

    return recognizer;
}

async function audioInit(url) {
    const recognizer = await audioModel(url);
    model_labels = recognizer.wordLabels();
	sendLabelsToHub();
    createPredictionBars(model_labels);

    recognizer.listen(result => {
        model_scores = result.scores; 
        updatePredictionBars(model_labels, model_scores);
        sendOnPrediction(model_labels, model_scores);
    }, {
        includeSpectrogram: false, // in case listen should return result.spectrogram
        probabilityThreshold: 0.0,
        invokeCallbackOnNoiseAndUnknown: true,
        overlapFactor: 0.75 // probably want between 0.5 and 0.75. More info in README
    });
}


let model, webcam, flip;

// Load the image model and setup the webcam
async function imageInit(url) {
    const modelURL = url + "model.json";
    const metadataURL = url + "metadata.json";

    // load the model and metadata
    // Refer to tmImage.loadFromFiles() in the API to support files from a file picker
    // or files from your local hard drive
    // Note: the pose library adds "tmImage" object to your window (window.tmImage)
    model = await tmImage.load(modelURL, metadataURL);
    model_loaded = true;
    model_labels = model.getClassLabels();
    model_scores = Array(model.getTotalClasses()).fill(0);
    createPredictionBars(model_labels);
    webcamInit(true);
}

async function webcamInit(new_flip){
    flip = new_flip;
    const webcam_container = document.getElementById("webcam-container");
    webcam_container.innerHTML = "Setting up camera...";
    webcam = new tmImage.Webcam(200, 200, flip); // width, height, flip
    await webcam.setup(); // request access to the webcam
    await webcam.play();
    window.requestAnimationFrame(imageLoop);

    // append elements to the DOM
    webcam.canvas.id = "webcam-canvas";
    webcam_container.innerHTML = "";
    webcam_container.appendChild(webcam.canvas);
    rotate_button = document.getElementById("rotate")
    rotate_button.style.visibility = "visible";
}

async function imageLoop() {
    webcam.update(); // update the webcam frame
    const prediction = await model.predict(webcam.canvas);
    for (let i = 0; i < model.getTotalClasses(); i++){
        model_scores[model_labels.indexOf(prediction[i].className)] = prediction[i].probability;
    }
    updatePredictionBars(model_labels, model_scores);
    sendOnPrediction(model_labels, model_scores);
    window.requestAnimationFrame(imageLoop);
}

function toggleWebcam(){
    webcamInit(!flip);
}