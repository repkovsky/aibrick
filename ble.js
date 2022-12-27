'use strict';

/** Pybricks service UUID. */
const pybricksServiceUUID = 'c5f50001-8280-46da-89f4-6d8051e4aeef';
/** Device Information service UUID. */
const deviceInformationServiceUUID = 0x180a;
/** nRF UART Service UUID. */
const nordicUartServiceUUID = '6e400001-b5a3-f393-e0a9-e50e24dcca9e';
/** nRF UART RX Characteristic UUID. Supports Write or Write without response. */
const nordicUartRxCharUUID = '6e400002-b5a3-f393-e0a9-e50e24dcca9e';
/** nRF UART TX Characteristic UUID. Supports Notifications. */
const nordicUartTxCharUUID = '6e400003-b5a3-f393-e0a9-e50e24dcca9e';

const MTU = 20;

const State = {
	BLE_connected: 'Disconnect hub',
    BLE_model_setup: 'Setting up model...',
	BLE_disconnected: 'Connect to hub'
};

const MODEL = 'model:'

var bleDevice;
var bleServer;
var nusService;
var rxCharacteristic;
var txCharacteristic;

var state = State.BLE_disconnected;

function toggleConnection(){
    if (state == State.BLE_disconnected){
        connect();
    } else {
        disconnect();
    }
}

// Sets button to either Connect or Disconnect
function setConnButtonState(new_state) {
    console.log(new_state)
	document.getElementById("clientConnectButton").innerHTML = new_state;
}

function connect() {
    if (!navigator.bluetooth) {
        console.log('WebBluetooth API is not available.\r\n' +
                    'Please make sure the Web Bluetooth flag is enabled.');
        return;
    }
    console.log('Requesting Bluetooth Device...');
    navigator.bluetooth.requestDevice({
        filters: [{ services: [pybricksServiceUUID] }],
        optionalServices: [
            pybricksServiceUUID,
            deviceInformationServiceUUID,
            nordicUartServiceUUID,
        ],
    })
    .then(device => {
        bleDevice = device; 
        console.log('Found ' + device.name);
        console.log('Connecting to GATT Server...');
        bleDevice.addEventListener('gattserverdisconnected', onDisconnected);
        return device.gatt.connect();
    })
    .then(server => {
        console.log('Locate NUS service');
        return server.getPrimaryService(nordicUartServiceUUID);
    }).then(service => {
        nusService = service;
        console.log('Found NUS service: ' + service.uuid);
    })
    .then(() => {
        console.log('Locate RX characteristic');
        return nusService.getCharacteristic(nordicUartRxCharUUID);
    })
    .then(characteristic => {
        rxCharacteristic = characteristic;
        console.log('Found RX characteristic');
    })
    .then(() => {
        console.log('Locate TX characteristic');
        return nusService.getCharacteristic(nordicUartTxCharUUID);
    })
    .then(characteristic => {
        txCharacteristic = characteristic;
        console.log('Found TX characteristic');
    })
    .then(() => {
        console.log('Enable notifications');
        return txCharacteristic.startNotifications();
    })
    .then(() => {
        console.log('Notifications started');
        txCharacteristic.addEventListener('characteristicvaluechanged',
                                          handleNotifications);
        state = State.BLE_connected;
        console.log(bleDevice.name + ' Connected.');
        nusSendString('provide_model\n');
        setConnButtonState(state);
		setTimeout(() => {
            console.log('Model loading timeout.');
			if (!model_loaded){
				model_init('')
			}
		}, 3000);
    })
    .catch(error => {
        console.log('' + error);
        if(bleDevice && bleDevice.gatt.connected)
        {
            bleDevice.gatt.disconnect();
        }
    });
}

function disconnect() {
    if (!bleDevice) {
        console.log('No Bluetooth Device connected...');
        return;
    }
    console.log('Disconnecting from Bluetooth Device...');
    if (bleDevice.gatt.connected) {
        bleDevice.gatt.disconnect();
        state = State.BLE_disconnected;
        setConnButtonState(state);
        console.log('Bluetooth Device connected: ' + bleDevice.gatt.connected);
    } else {
        console.log('> Bluetooth Device is already disconnected');
    }
}

function onDisconnected() {
    state = State.BLE_disconnected;
    console.log(bleDevice.name + ' Disconnected.');
    setConnButtonState(state);
}

async function handleNotifications(event) {
    let value = event.target.value;
    // Convert raw data bytes to character values and use these to 
    // construct a string.
    let str = "";
    for (let i = 0; i < value.byteLength; i++) {
        str += String.fromCharCode(value.getUint8(i));
    }
    console.log('notification: ' + str);
    if (str.startsWith(MODEL) && !model_loaded){
        state = State.BLE_model_setup
        setConnButtonState(state)
        model_url = str.slice(MODEL.length)
    } else if (state == State.BLE_model_setup){
        if (str.endsWith('\n')){
            model_url += str.trim()
            state = State.BLE_connected
            setConnButtonState(state)
            model_init(model_url);
        } else {
            model_url += str
        }
    }
}

function nusSendString(s) {
    if(bleDevice && bleDevice.gatt.connected) {
        console.log("send: " + s);
        let val_arr = new Uint8Array(s.length)
        for (let i = 0; i < s.length; i++) {
            let val = s[i].charCodeAt(0);
            val_arr[i] = val;
        }
        sendNextChunk(val_arr);
    } else {
        console.log('Not connected to a device yet.');
    }
}

function sendNextChunk(a) {
    let chunk = a.slice(0, MTU);
    rxCharacteristic.writeValue(chunk)
        .catch(async () =>  {
            console.log("DOMException: GATT operation already in progress.")
            await Promise.resolve(resolve => setTimeout(resolve, 100));
            rxCharacteristic.writeValue(chunk);
        })
        .then(function() {
            if (a.length > MTU) {
                sendNextChunk(a.slice(MTU));
            }
        });
}
