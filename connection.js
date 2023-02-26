const SEP = "·";

class Connection {
    constructor() {
		this.rx_buffer = "";
	}

	setTxBuffer(bleDevice, rxCharacteristic){
		this.tx_buffer = new BufferedNUS(bleDevice, rxCharacteristic);
	}

	sendMessage(command, value, priority=False) {
		console.log("sendMessage");
		this.tx_buffer.pushString(command + SEP + value + '\n', priority);
	}

	sendText(text) {
		this.tx_buffer.pushString(text + '\n', true);
	}

	onConnected(){
		console.log("onConnected");
		setConnButtonState("setup");
		this.sendMessage('setup', '?', true);
	}

	onMsgReceived(event){
		let payload = event.target.value;
		console.log("onMsgReceived");
		for (let i = 0; i < payload.byteLength; i++) {
			this.rx_buffer += String.fromCharCode(payload.getUint8(i));
		}
		if (this.rx_buffer.includes('\n')) {
			let command, message;
			let received = this.rx_buffer.slice(0, this.rx_buffer.indexOf('\n'));
			if (received.includes(SEP)) {
				const parts = received.split(SEP, 2);
				command = parts[0];
				message = parts[1];
			} else {
				command = '';
				message = received;
			}
			// console.log("command:" + command);
			// console.log("value:" + message);
			this.rx_buffer = this.rx_buffer.slice(this.rx_buffer.indexOf('\n')+1);
			if (command == 'setup'){
				console.log(JSON.parse(message))
				modelInit(this, JSON.parse(message));
				setConnButtonState("connected");
			} else {
				console.log(received)
			}
		}
	}

	onDisconnected(){
		// state = State.BLE_disconnected;
		setConnButtonState("disconnected");
	}
}

let connection;
function connectionInit(){
	connection = new Connection();
	connect(connection);
}