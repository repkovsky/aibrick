'use strict';

/** Pybricks service UUID. */
const pybricksServiceUUID = 'c5f50001-8280-46da-89f4-6d8051e4aeef';

/** Pybricks command event characteristic UUID. */
const pybricksCommandEventCharUUID = 'c5f50002-8280-46da-89f4-6d8051e4aeef';

/** Device Information service UUID. */
const deviceInformationServiceUUID = 0x180a;

const MTU = 20;
const WRITE_STDIN = 0x06;

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
            pybricksCommandEventCharUUID,
            pybricksServiceUUID,
            deviceInformationServiceUUID,
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
        return server.getPrimaryService(pybricksServiceUUID);
    }).then(service => {
        nusService = service;
        console.log('Found NUS service: ' + service.uuid);
    })
    .then(() => {
        console.log('Locate RX characteristic');
        return nusService.getCharacteristic(pybricksCommandEventCharUUID);
    })
    .then(characteristic => {
        rxCharacteristic = characteristic;
        connection.setTxBuffer(bleDevice, rxCharacteristic);
        console.log('Found RX characteristic');
    })
    .then(() => {
        console.log('Locate TX characteristic');
        return nusService.getCharacteristic(pybricksCommandEventCharUUID);
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


class BufferedNUS {

    constructor(bleDevice, rxCharacteristic) {
        this.bleDevice = bleDevice;
        this.rxCharacteristic = rxCharacteristic;
        this.buffer = new Array(0);
        this.busy = false;
        console.log("BufferedNUS ready")
    }
  
    pushString(s, priority=false) {
        if (this.bleDevice && this.bleDevice.gatt.connected && (priority || !this.busy)) {
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
        let chunk = new Uint8Array([WRITE_STDIN, ...this.buffer.slice(0, MTU-1)]);
        this.buffer.splice(0, MTU-1);
        // console.log("this.buffer.slice(0, MTU)" + this.buffer.slice(0, MTU));
//        console.log("chunk " + chunk);
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
