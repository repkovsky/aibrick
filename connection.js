

const State = {
    NOT_CONNECTED: 'NOT_CONNECTED',
    SETUP: 'SETUP',
    LABELS: 'LABELS',
    NOTIFICATION: 'NOTIFICATION'
};

var state = State.NOT_CONNECTED;
var notifications = false;

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
	msg = '!labels=' + model_labels.join('\t')
	console.log(msg);
	sendMessage(msg);
}

function sendNotificationToHub(label){
	if (notifications){
		sendMessage(label);
	}
}


function onConnected(){
	state = State.SETUP;
    setConnButtonState(state);
	sendMessage('?setup');
	setTimeout(() => {
		console.log('Model loading timeout.');
		if (!model_loaded){
			onMsgReceived('\n');
		}
	}, 5000);
}

const Command = {
    MODEL: 'model',
    NOTIFY: 'notify',
    LABELS: 'labels',
	PROBABILITY: 'P'
};

var buffer = '';
function onMsgReceived(msg){
	console.log(msg)
	buffer += msg;
	if (buffer.endsWith('\n')){
		msg = buffer.trim();
		buffer = '';
		msg_type = msg[0];
		msg = msg.slice(1);
		switch (msg_type){
			case '!':
				idx = msg.indexOf("=");
				const command = msg.slice(0, idx);
				const value = msg.slice(idx+1);
				console.log('command=' + command)
				console.log('value=' + value)
				switch (command){
					case Command.MODEL:
						modelInit(value);
						setConnButtonState(state);
						break;
					case Command.NOTIFY:
						notifications = (value === 'true')
						break;
				}
				break;
			case '?':
				switch (msg){
					// case Command.LABELS:
					// 	if (label_counter < model_labels.length) {
					// 		sendMessage(model_labels[label_counter++])
					// 	} else {
					// 		label_counter = 0;
					// 		sendMessage('');
					// 	}
					// 	break;
					case Command.PROBABILITY:
						let response = '';
						for (let i = 0; i < model_scores.length; i++) {
							response += String.fromCharCode(Math.round(100*model_scores[i]) + ' '.charCodeAt(0))
						}
						sendMessage(response);
						break;
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
