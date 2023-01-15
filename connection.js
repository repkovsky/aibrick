

const State = {
    BLE_connected: 'Disconnect hub',
    BLE_model_setup: 'Setting up model...',
    BLE_disconnected: 'Connect to hub'
};

var state = State.BLE_disconnected;

function connectionInit(){
    bleOnConnected = onConnected;
    bleOnMsgReceived = onMsgReceived;
    bleOnDisconnected = onDisconnected;
}

function toggleConnection(){
    if (state == State.BLE_disconnected){
        connect();
    } else {
        disconnect();
    }
}

function setConnButtonState(new_state) {
    console.log(new_state)
    document.getElementById("clientConnectButton").innerHTML = new_state;
}

function onConnected(){
    state = State.BLE_connected;
    setConnButtonState(state);
	nusSendString('model?\n');
	setTimeout(() => {
		console.log('Model loading timeout.');
		if (!model_loaded){
			modelInit('')
		}
	}, 1000);
}

function onDisconnected(){
    state = State.BLE_disconnected;
    setConnButtonState(state);
}

const MODEL = 'model:'
function onMsgReceived(str){
	if (str.startsWith(MODEL) && !model_loaded){
		state = State.BLE_model_setup
		setConnButtonState(state)
		model_url = str.slice(MODEL.length)
	} else if (state == State.BLE_model_setup){
		if (str.endsWith('\n')){
			model_url += str.trim()
			state = State.BLE_connected
			setConnButtonState(state)
			modelInit(model_url);
		} else {
			model_url += str
		}
	}
}