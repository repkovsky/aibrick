

const State = {
    NOT_CONNECTED: 'NOT_CONNECTED',
    SETUP: 'SETUP',
    LABELS: 'LABELS',
    NOTIFICATION: 'NOTIFICATION'
};

var state = State.NOT_CONNECTED;
var label_counter = 0;

function connectionInit(){
    bleOnConnected = onConnected;
    bleOnMsgReceived = onMsgReceived;
    bleOnDisconnected = onDisconnected;
	connect();
}

function setConnButtonState(new_state) {
    // console.log(new_state)
    document.getElementById("clientConnectButton").innerHTML = new_state;
}

function sendMessage(msg){
	nusSendString(msg + '\n');
}

function sendLabelsToHub(){
	console.log('sendLabelsToHub')
	state = State.LABELS;
	label_counter = 0;
	sendMessage(model_labels[label_counter++]);
}

function sendNotificationToHub(label){
	if (state == State.NOTIFICATION){
		sendMessage(label);
	}
}


function onConnected(){
	state = State.SETUP;
    setConnButtonState(state);
	sendMessage('setup?');
	setTimeout(() => {
		console.log('Model loading timeout.');
		if (!model_loaded){
			onMsgReceived('\n');
		}
	}, 5000);
}

var buffer = '';
function onMsgReceived(msg){
	console.log(msg)
	buffer += msg;
	if (buffer.endsWith('\n')){
		msg = buffer.trim();
		buffer = '';
		switch (state){
			case State.SETUP:
				const MODEL = 'model=';
				if (msg.startsWith(MODEL)){
					modelInit(msg.slice(MODEL));
					setConnButtonState(state);
				}
				break;
			case State.LABELS:
				if (msg == 'ack'){
					if (label_counter < model_labels.length) {
						sendMessage(model_labels[label_counter++])
					} else {
						sendMessage('');
						// communication = Communication.COM_active;
						state = State.NOTIFICATION;
					}
				}
				break;
			case State.NOTIFICATION:
				if (msg == 'prob?'){
					prob = '';
					for (let i = 0; i < model_scores.length; i++){
						prob += String.fromCharCode(Math.round(100*model_scores[i]) + ' '.charCodeAt(0))
					}
					sendMessage(prob);
				}
				break;
		}
		console.log(state)
	}
}

function onDisconnected(){
    // state = State.BLE_disconnected;
    setConnButtonState(state);
}
