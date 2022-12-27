# Lego AI

Simple project for controlling Lego Bluetooth Hubs using Artificial Inteligence algorithms. 
* Processing is performed in web browser using [TensorFlow.js](https://www.tensorflow.org/js) and [speech-commands.js](https://github.com/tensorflow/tfjs-models/tree/master/speech-commands) library for speech recognition. 
* Communication with Lego Bluetooth Hubs uses [WebBluetoothAPI](https://developer.mozilla.org/en-US/docs/Web/API/Web_Bluetooth_API) to establish Nordic UART connection (code based on [web-device-cli](https://github.com/makerdiary/web-device-cli).
* Communication processing on Lego Hub was implemented in [Pybrick](https://pybricks.com/).

## Running

Code was tested on Mindstorms Robot Builder Hub and Tricky model.

1. Install [Pybrick firmware](https://code.pybricks.com/).
2. Paste code from [tricky_audio_control.py](https://raw.githubusercontent.com/repkovsky/lego-ai/main/tricky_audio_control.py) into Pybricks code editor, connect to hub and run code.
3. Open https://repkovsky.github.io/lego-ai in browser (works in Chrome) and allow access to microphone. Displayed bars correspond to words which can be detected by default model `18w` of `speech-commands.js` library. The length of bar corresponds to estimated probability of each word. If the probability exceeds `0.75`, the word will be sent to hub over Bluetooth Nordic UART interface. The script in the Hub will send it back to browser to show that communation is working properly (you can observe it by pressing F12 and going to Console tab).
4. Click 'Connect to hub', choose the proper Lego hub and click 'Pair'.
5. In the console of Pybricks code you should see appearing words recognized by algorithm running in browser. If the word is 'left', 'right', 'go' or 'stop', the corresponding move should be executed.
