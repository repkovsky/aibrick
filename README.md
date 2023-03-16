# aiBrick

aiBrick is browser application which enables using machine learning and artificial intelligence algorithms with Lego Mindstorms/Spike/Technic hubs programmed in [Pybrick](https://pybricks.com/). Processing of camera/microphone input is performed in web browser using [TensorFlow.js](https://www.tensorflow.org/js) and results are sent to hub over [WebBluetoothAPI](https://developer.mozilla.org/en-US/docs/Web/API/Web_Bluetooth_API). Transmission on the hub's side is handled by `aibrick.py` module. Currently supported AI/ML models are:
* [TeachableMachine Audio](https://teachablemachine.withgoogle.com/train/audio)
* [TeachableMachine Image](https://teachablemachine.withgoogle.com/train/image)

## Running TeachableMachine models

1. Teach your AI/ML model on [TeachableMachine](https://teachablemachine.withgoogle.com/). After gathering samples and training, click "Export Model" and in the tab "Tensorflow.js" choose option "Upload (shareable link)" and click "Upload my model". Below you will find the shareable link with you audio/image recognition model, which will be used to configure aiBrick.

2. Install [Pybricks firmware](https://code.pybricks.com/) (v3.2.2 or higher) if you don't have it already on your hub. Download [aibrick.py](aibrick.py) module and upload it into [Pybricks code editor](https://code.pybricks.com/) using option "Import a file".

3. Create new file in Pybricks code editor (next to `aibrick.py`) and develop your code - see examples:
* [aibrick_image.py](aibrick_image.py)
* [aibrick_audio.py](aibrick.py)

4. Run program, depending on setup - for hub running program
* with connection to Pybricks code editor: open the [aiBrick website](https://github.com/repkovksy/aibrick) at the same device in Chrome Browser, where the code editor is running. Start program in code editor first, then connect Bluetooth in aiBrick. Connecting two Bluetooth devices (e.g. PC with Pybricks code editor and smartphone with aiBrick) seems to be unstable.
* without connection to Pybricks code editor: open the [aiBrick website](https://github.com/repkovksy/aibrick) on any device with Chrome Browser. Press and hold hub's button to run hub, and then press the button again to run the program. Next, connect Bluetooth in aiBrick.

## How does it work?

* aiBrick JS application and Lego hub running Pybricks with `AiBrickteachableMachine` class communicate over Bluetooth using simple named messages.
* aiBrick sends `setup` message to hub, hub responds with `setup` message with JSON-formatted configuration of AI/ML model to be loaded in aiBrick.
* aiBrick loads requested model and sends `labels` message to hub with list of classes, which can be recognized by the AI model.
* aiBrick starts to process audio/image. Depending on the configuration it will send `p` (_probability_) frame containing probabilities of each class (after each processing of input chunk) and/or `d` (_detected_) frame, notyfing about class whose probability just exceeded 0.5, so it is considered to be detected.
