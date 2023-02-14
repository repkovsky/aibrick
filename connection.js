

function setConnButtonState(new_state) {
    // console.log(new_state)
    document.getElementById("clientConnectButton").innerHTML = new_state;
}

class Connection {
    constructor() {
		this.rx_buffer = "";
	}

	setTxBuffer(bleDevice, rxCharacteristic){
		this.tx_buffer = new BufferedNUS(bleDevice, rxCharacteristic);
	}

	sendMessage(command, value) {
		console.log("sendMessage");
		this.tx_buffer.pushString(command + '=' + value + '\n');
		// this.tx_buffer.pushString(command + '=')
		// this.tx_buffer.pushString(value);
		// this.tx_buffer.pushString('\n');
	}

	sendText(text) {
		//.replace('\t', '\\t').replace('\n', '\\n').replace('\r', '\\r')
		this.tx_buffer.pushString(text + '\n');
	}

	onConnected(){
		console.log("onConnected");
		setConnButtonState("setup");
		this.sendMessage('setup', '?');
		// setTimeout(() => {
		// 	console.log('Model loading timeout.');
		// 	if (!model_loaded){
		// 		modelInit(this, value);
		// 		setConnButtonState("connected");
		// 	}
		// }, 5000);
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
			// console.log("command:" + command);
			// console.log("value:" + value);
			this.rx_buffer = this.rx_buffer.slice(this.rx_buffer.indexOf('\n')+1);
			if (command == 'setup'){
				console.log(JSON.parse(value))
				modelInit(this, JSON.parse(value));
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
}

let connection;
function connectionInit(){
	connection = new Connection();
	connect(connection);
}