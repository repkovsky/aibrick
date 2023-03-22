# aiBrick

aiBrick is browser application which enables using machine learning and artificial intelligence algorithms with Lego Mindstorms/Spike/Technic hubs programmed in [Pybrick](https://pybricks.com/). Processing of camera/microphone input is performed in web browser using [TensorFlow.js](https://www.tensorflow.org/js) and results are sent to hub over [WebBluetoothAPI](https://developer.mozilla.org/en-US/docs/Web/API/Web_Bluetooth_API). Transmission on the hub's side is handled by `aibrick.py` module. Currently supported AI/ML models are:
* [TeachableMachine Audio](https://teachablemachine.withgoogle.com/train/audio)
* [TeachableMachine Image](https://teachablemachine.withgoogle.com/train/image)

## Running TeachableMachine models

### Creating AI/ML model and development of the Python program

1. Teach your AI/ML model on [TeachableMachine](https://teachablemachine.withgoogle.com/). After gathering samples and training, click "Export Model" and in the tab "Tensorflow.js" choose option "Upload (shareable link)" and click "Upload my model". Below you will find the shareable link with you audio/image recognition model, which will be used to configure aiBrick.

2. Install [Pybricks firmware](https://code.pybricks.com/) (v3.2.2 or higher) if you don't have it already on your hub. Download [aibrick.py](aibrick.py) module and upload it into [Pybricks code editor](https://code.pybricks.com/) using option "Import a file".

3. Create new file in Pybricks code editor (next to `aibrick.py`) and develop your code (see example of implementation in [aibrick_brick_classifier.py](aibrick_brick_classifier.py)).

4. Turn on the hub and connect Bluetooth in [Pybricks code editor](https://code.pybricks.com/). Run the program (it is going to be present in hub also when the Pybricks code editor is disconnected).

5. Open the [aiBrick website](https://repkovsky.github.io/aibrick) at the same device in Chrome Browser, where the code editor is running. Press the Bluetooth button in aiBrick, find hub on the list of available devices and connect.

### Running aiBrick with programmed hub

1. Turn on the hub.

2. Open the [aiBrick website](https://repkovsky.github.io/aibrick) in Chrome Browser on smartphone, tablet or PC. Press the Bluetooth button in aiBrick, find hub on the list of available devices and connect.

3. Push the button on hub to start the program.

## How does it work?

* aiBrick web application and Lego hub running Pybricks with `AiBrickteachableMachine` class communicate over Bluetooth using simple named messages.
* aiBrick web application sends `setup` messages to hub until hub responds with `setup` message with JSON-formatted configuration of AI/ML model to be loaded in aiBrick.
* aiBrick web application loads requested model downloading it from the provided address and sends `labels` message to hub with list of classes, which can be recognized by the AI model.
* aiBrick web application starts to process audio/image. Depending on the configuration it will send two types of frames to Lego hub:
  * `p` (_probability_) frame containing probabilities of each class (after each processing of input chunk), with frequency limited to 10Hz
  * `d` (_detected_) frame, notyfing about class whose probability just exceeded 0.5, so it is considered to be detected.
* No audio/image is recorded, stored or send over network - all processing is performed locally, on the device running web application. Network connection is necessary only for downloading AI/ML model from Google storage, after that step you can safely disable network connection at all, if you wish.
