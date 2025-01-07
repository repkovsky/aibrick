const SEP = String.fromCharCode(183);
const EOF = '\n';
const WRITE_STDOUT = 0x01;

class Connection {
    constructor() {
		this.rx_buffer = "";
	}

	setTxBuffer(bleDevice, rxCharacteristic){
		this.tx_buffer = new BufferedNUS(bleDevice, rxCharacteristic);
	}

	sendMessage(command, value, priority=False) {
		/**
		 * Sends string-based command.
		 * @param  {String}  command  Frame name, must not contain "·" (SEP) nor '\n' (EOF) characters
		 * @param  {String}  value    Frame payload, must not contain "·" (SEP) nor '\n' (EOF) characters
		 * @param  {Boolean} priority Queues frame in the TX buffer, even if it is not empty. Otherwise frame is ignored.
		 */
		console.log("sendMessage");
		this.tx_buffer.pushString(command + SEP + value + EOF, priority);
	}

	sendText(text) {
		this.tx_buffer.pushString(text + EOF, true);
	}

	onConnected(){
		console.log("onConnected");
		setConnButtonState("setup");
		this.sendMessage('setup', '?', true);
		this.setup_request = setInterval(function() {
			this.sendMessage('setup', '?', true);
		}.bind(this), 1000);
	}

	onMsgReceived(event){
		let payload = event.target.value;

		if (payload.getUint8(0) != WRITE_STDOUT) {
		    console.log("onMsgReceived (not stdout frame)");
            return;
        } else {
            console.log("onMsgReceived");
        }
		for (let i = 1; i < payload.byteLength; i++) {
			this.rx_buffer += String.fromCharCode(payload.getUint8(i));
		}
		if (this.rx_buffer.includes(EOF)) {
			let command, message;
			let received = this.rx_buffer.slice(0, this.rx_buffer.indexOf(EOF));
			if (received.includes(SEP)) {
				const parts = received.split(SEP, 2);
				command = parts[0];
				message = parts[1];
			} else {
				command = '';
				message = received;
			}
			this.rx_buffer = this.rx_buffer.slice(this.rx_buffer.indexOf(EOF)+1);
			if (command == 'setup'){
				clearInterval(this.setup_request);
				console.log(JSON.parse(message))
				modelInit(this, JSON.parse(message));
			} else {
				console.log(received)
			}
		}
	}

	onDisconnected(){
		setConnButtonState("disconnected");
	}
}

let connection;
function connectionInit(){
	connection = new Connection();
	connect(connection);
}