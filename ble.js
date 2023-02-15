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

var bleDevice;
var bleServer;
var nusService;
var rxCharacteristic;
var txCharacteristic;

function connect(connection) {
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
        bleDevice.addEventListener('gattserverdisconnected', connection.onDisconnected);
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
        connection.setTxBuffer(bleDevice, rxCharacteristic);
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
        const onMsgReceived = connection.onMsgReceived.bind(connection);
        txCharacteristic.addEventListener('characteristicvaluechanged', onMsgReceived);
        console.log(bleDevice.name + ' Connected.');
        connection.onConnected()
    })
    .catch(error => {
        console.log('' + error);
        if(bleDevice && bleDevice.gatt.connected){
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
        console.log('Bluetooth Device connected: ' + bleDevice.gatt.connected);
    } else {
        console.log('> Bluetooth Device is already disconnected');
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
            Promise.resolve()
                .then(() => new Promise(resolve => setTimeout(resolve, 300)))
                .then(() => { 
                    console.log('Delayed.');
                    rxCharacteristic.writeValue(chunk);
                });
        })
        .then(function() {
            if (a.length > MTU) {
                sendNextChunk(a.slice(MTU));
            }
        });
}

class BufferedNUS {

    constructor(bleDevice, rxCharacteristic) {
        this.bleDevice = bleDevice;
        this.rxCharacteristic = rxCharacteristic;
        this.buffer = new Array(0);
        this.busy = false;
        console.log("BufferedNUS ready")
    }
  
    pushString(s) {
        if (this.bleDevice && this.bleDevice.gatt.connected) {
            console.log("push: " + s);
            for (let i = 0; i < s.length; i++) {
                this.buffer.push(s.charCodeAt(i));
            }
            if (!this.busy){
                this.sendBuffer();
            }
        }
    }

    sendBuffer() {
        this.busy = true;
        let chunk = new Uint8Array(this.buffer.slice(0, MTU));
        this.buffer.splice(0, MTU);
        // console.log("this.buffer.slice(0, MTU)" + this.buffer.slice(0, MTU));
        // console.log("chunk" + chunk);
        let self = this;
        this.rxCharacteristic.writeValue(chunk)
            .catch(async () => {
                console.log("DOMException: GATT operation already in progress.")
            })
            .then(function() {
                if (self.buffer.length > 0) {
                    self.sendBuffer();
                } else {
                    self.busy = false;
                }
            });
    }
}
