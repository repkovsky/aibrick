
function showAudioContainer(){
    const audio_visualizer = document.getElementById("audio-container");
    audio_visualizer.style.display = "block";
}

function showWebcamContainer(){
	const webcam_overlay = document.getElementById("webcam-container");
	webcam_overlay.style.display = "block";
}

const colors = ['#0072bd', '#d95319', '#edb120', '#7e2f8e', '#77ac30', '#4dbeee', '#a2142f'];
const bg_colors = ['#e6f5ff', '#fceee8', '#fdf7e7', '#f7ecf9', '#f3f9eb', '#e8f6fd', '#fce8ec']

function createPredictionBars(classLabels){
	const labelContainer = document.getElementById("label-container");
	labelContainer.style.display = "block";
	labelContainer.replaceChildren();
	for (let i = 0; i < classLabels.length; i++) {
		const output = document.createElement("div");
		output.className = "output";
		const label = document.createElement("div");
		label.className = "label";
		label.style.color = colors[i % 7]
		label.innerHTML = classLabels[i];
		const progress = document.createElement("div");
		progress.className = "progress";
		progress.style.backgroundColor = bg_colors[i % 7]
		const bar = document.createElement("div");
		bar.id = "__" + classLabels[i];
		bar.className = "bar";
		bar.style.backgroundColor = colors[i % 7]
		output.appendChild(label);
		output.appendChild(progress);
		progress.appendChild(bar);
		labelContainer.appendChild(output);
	}
}

function updatePredictionBars(classLabels, scores){
	for (let i = 0; i < classLabels.length; i++) {
		const classPrediction = Math.round(scores[i]*100) + "%";
		bar = document.getElementById("__" + classLabels[i]);
		bar.innerHTML = "&nbsp;" + classPrediction + "&nbsp;";
		bar.style.width = classPrediction;
	}
}

function setConnButtonState(state){
	console.log("setConnButtonState", state)
	switch (state){
		case "connected":
			document.getElementById("connect-button").style.display = "none";
			break;
		case "disconnected":
			document.getElementById("error-console").style.display = "block";
			break;
		case "setup":
			document.getElementById("connect-button-caption").innerHTML = "Initializing...";
			break;
	}

}