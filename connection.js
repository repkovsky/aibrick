

function setConnButtonState(new_state) {
    // console.log(new_state)
    document.getElementById("clientConnectButton").innerHTML = new_state;
}

class Connection {
    constructor() {
		this.rx_buffer = "";
		console.log("connect!" + this.tx_buffer);
	}

	setTxBuffer(bleDevice, rxCharacteristic){
		this.tx_buffer = new BufferedNUS(bleDevice, rxCharacteristic);
	}

	sendCommand(command, value) {
		console.log("sendCommand");
		this.tx_buffer.pushString(command + '=' + value + '\n');
	}

	sendText(text) {
		//.replace('\t', '\\t').replace('\n', '\\n').replace('\r', '\\r')
		this.tx_buffer.pushString(text + '\n');
	}

	onConnected(){
		console.log("onConnected");
		setConnButtonState("setup");
		this.sendCommand('setup', '?');
		setTimeout(() => {
			console.log('Model loading timeout.');
			if (!model_loaded){
				modelInit(value);
				setConnButtonState("connected");
			}
		}, 5000);
	}

	onMsgReceived(event){
		let payload = event.target.value;
		console.log("onMsgReceived");
		let s = "";
		for (let i = 0; i < payload.byteLength; i++) {
			s += String.fromCharCode(payload.getUint8(i));
		}
		console.log(s);
		this.rx_buffer += s;
		if (this.rx_buffer.includes('\n')) {
			let command, value;
			let message = this.rx_buffer.slice(0, this.rx_buffer.indexOf('\n'));
			if (message.includes('=')) {
				const parts = message.split('=', 2);
				command = parts[0];
				value = parts[1];
			} else {
				command = '';
				value = message;
			}
			console.log("command:" + command);
			console.log("value:" + value);
			this.rx_buffer = this.rx_buffer.slice(this.rx_buffer.indexOf('\n')+1);
			if (command == 'setup'){
				console.log(JSON.parse(value))
				modelInit(JSON.parse(value));
				setConnButtonState("connected");
			} else {
				console.log(message)
			}
			//  else if (command in this.channels){
			// 	this.channels[command] = value.toLowerCase() == 'true';
			// }
			// console.log(state)
		}
	}

	onDisconnected(){
		// state = State.BLE_disconnected;
		setConnButtonState("BLE_disconnected");
	}

	/*	
		sendNotificationToHub(text) {
			if (this.channels.has('notify')){
				this.sendText(text);
			}
		}
	
		sendLabelsToHub(model_labels){
			console.log('sendLabelsToHub')
			this.sendCommand('ready', JSON.stringify(model_labels))
		}
	
		sendProbility(model_scores){
			let response = '';
			for (let i = 0; i < model_scores.length; i++) {
				response += String.fromCharCode(Math.round(100*model_scores[i]) + ' '.charCodeAt(0))
			}
			this.sendCommand('P', response)
		}
	*/

}

let connection;
function connectionInit(){
    // bleOnConnected = onConnected;
    // bleOnMsgReceived = onMsgReceived;
    // bleOnDisconnected = onDisconnected;
	// connect();
	connection = new Connection()
	connect(connection);
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
