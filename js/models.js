let best_label_idx = -1;
let model_config = {};
let model_connection = null;
let frame_timer = 0;
let frame_period = 200;
let pose_cache = null;

async function modelType(url){
    if (url){
        const metadata = await (await fetch(url + "metadata.json")).json();
        if (metadata.hasOwnProperty('tfjsSpeechCommandsVersion')){
            return 'audio';
        } else if (metadata.hasOwnProperty('packageName')){
            if (metadata['packageName'] == '@teachablemachine/image') {
                return 'image';
            } else if (metadata['packageName'] == '@teachablemachine/pose') {
                return 'pose';
            }
        } else {
            return undefined;
        }
    } else {
        return 'audio';
    }
}

async function modelInit(connection, config) {
    model_config = config;
    model_connection = connection;
    if ('fps_limit' in config){
        frame_period = 1000/config['fps_limit'];
    }
    if (config['type'] == 'teachablemachine'){
        const model_type = await modelType(config['model']);
        switch (model_type) {
            case "audio":
                audioInit();
                break;
            case "image":
                imageInit();
                break;
            case "pose":
                poseInit();
                break;
            default:
                displayError('Unsupported Teachable Machine configuration ("' + model_type + '").');
                break;
        }
    } else {
        displayError('Unsupported model type (' + config['type'] + ').');
    }
}

function sendOnPrediction(classLabels, scores){
    let probabilities = Array(classLabels.length);
    let detection = false;
    for (let i = 0; i < classLabels.length; i++) {
        let probability = Math.round(scores[i]*100);
        if (probability > 0){
            probabilities[i] = Math.round(scores[i]*100);
        } else {
            probabilities[i] = '';
        }
        if (scores[i] > 0.5 && i != best_label_idx){
            // label which score exceeds 0.5 and it is different from previous best label
            best_label_idx = i;
            detection = true;
        }
    }
    if (model_config['probability']){
        model_connection.sendMessage('p', probabilities.join(), false);
    }
    if (detection && model_config['detection']){
        model_connection.sendMessage('d', best_label_idx.toString(), true);
    }
}

function sendLabelsToHub(model_labels){
	console.log('sendLabelsToHub')
	model_connection.sendMessage('labels', JSON.stringify(model_labels), true);
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
    return recognizer;
}

async function audioInit() {
    const recognizer = await audioModel(model_config['model']);
    showAudioContainer();
    const model_labels = recognizer.wordLabels();
	sendLabelsToHub(model_labels);
    createPredictionBars(model_labels);    

    recognizer.listen(result => {
        const model_scores = result.scores; 
        updatePredictionBars(model_labels, model_scores);
        sendOnPrediction(model_labels, model_scores);
    }, {
        includeSpectrogram: false, // in case listen should return result.spectrogram
        probabilityThreshold: 0.0,
        invokeCallbackOnNoiseAndUnknown: true,
        overlapFactor: 0.75 // probably want between 0.5 and 0.75. More info in README
    });
}


let model, webcam, flip, model_type, ctx;

// Load the image model and setup the webcam
async function imageInit() {
    const modelURL = model_config['model'] + "model.json";
    const metadataURL = model_config['model'] + "metadata.json";

    // load the model and metadata
    // Refer to tmImage.loadFromFiles() in the API to support files from a file picker
    // or files from your local hard drive
    // Note: the pose library adds "tmImage" object to your window (window.tmImage)
    model = await tmImage.load(modelURL, metadataURL);
    model_type = "image";
    showWebcamContainer();
    let model_labels = model.getClassLabels();
	sendLabelsToHub(model_labels);
    createPredictionBars(model_labels);
    webcamInit(!isMobile());
}

// Load the image model and setup the webcam
async function poseInit() {
    const modelURL = model_config['model'] + "model.json";
    const metadataURL = model_config['model'] + "metadata.json";

    // load the model and metadata
    // Refer to tmImage.loadFromFiles() in the API to support files from a file picker
    // or files from your local hard drive
    // Note: the pose library adds a tmPose object to your window (window.tmPose)
    model = await tmPose.load(modelURL, metadataURL);
    model_type = "pose";
    showWebcamContainer();
    let model_labels = model.getClassLabels();
	sendLabelsToHub(model_labels);
    createPredictionBars(model_labels);
    webcamInit(!isMobile());
}

async function webcamInit(new_flip){
    const size = 300;
    flip = new_flip;
    const webcam_container = document.getElementById("webcam-canvas-container");
    webcam_container.innerHTML = "Setting up camera...";
    if (model_type == "pose"){
        webcam = new tmPose.Webcam(size, size, flip); // width, height, flip
    } else if (model_type == "image"){
        webcam = new tmImage.Webcam(size, size, flip); // width, height, flip
    }
    if (flip) {
        await webcam.setup();
    } else {
        await webcam.setup({ facingMode: "environment" });
    }
    await webcam.play();
    frame_timer = performance.now();
    window.requestAnimationFrame(imageLoop);

    // append elements to the DOM
    webcam_container.innerHTML = "";
    const canvas = document.createElement("canvas");
    canvas.id = "webcam-canvas";
    canvas.width = webcam.canvas.width; canvas.height = webcam.canvas.height;
    webcam_container.appendChild(canvas);
    ctx = canvas.getContext("2d");

    rotate_button = document.getElementById("rotate")
    rotate_button.style.visibility = "visible";
}

function drawWebcam() {
    const minPartConfidence = 0.25;
    if (webcam.canvas) {
        ctx.drawImage(webcam.canvas, 0, 0);
        // draw the keypoints and skeleton
        if (pose_cache) {
            tmPose.drawKeypoints(pose_cache.keypoints, minPartConfidence, ctx);
            tmPose.drawSkeleton(pose_cache.keypoints, minPartConfidence, ctx);
        }
    }
}

async function imageLoop() {
    webcam.update(); // update the webcam frame
    if (performance.now() - frame_timer > frame_period){
        frame_timer = performance.now();
        let prediction;
        if (model_type == "pose"){
            // Prediction #1: run input through posenet
            // estimatePose can take in an image, video or canvas html element
            const { pose, posenetOutput } = await model.estimatePose(webcam.canvas);
            // Prediction 2: run input through teachable machine classification model
            prediction = await model.predict(posenetOutput);
            pose_cache = pose;
            drawWebcam();
        } else if (model_type == "image"){
            prediction = await model.predict(webcam.canvas);
        }
        let model_scores = Array(model.getTotalClasses());
        let model_labels = model.getClassLabels();
        for (let i = 0; i < model.getTotalClasses(); i++){
            model_scores[model_labels.indexOf(prediction[i].className)] = prediction[i].probability;
        }
        updatePredictionBars(model_labels, model_scores);
        sendOnPrediction(model_labels, model_scores);
    } else {
        drawWebcam();
    }
    window.requestAnimationFrame(imageLoop);
}

function toggleWebcam(){
    webcamInit(!flip);
}