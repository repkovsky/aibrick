from pybricks.hubs import PrimeHub
from pybricks.parameters import Color, Icon
from pybricks.geometry import Matrix
from aibrick import AiBrickTeachableMachine

"""
This is Pybricks code for classification of bricks using aiBrick, 
TeachableMachine AI/ML model and camera in PC/Laptop/Smartphone. 
6 classes are recognized:
* Technic Beam 1 x 3 Thick
* Technic Beam 1 x 5 Thick
* Technic Beam 2 x 4 L-Shape Thick
* Technic Beam 3 x 5 L-Shape Thick
* Technic Beam 3 x 3 T-Shape Thick
* No brick
"""

# define images corresponding to detection of bricks
BRICK_ICONS = {
    "3": Matrix([
        [0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0],
        [0, 1, 1, 1, 0],
        [0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0]
        ]),
    "5": Matrix([
        [0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0],
        [1, 1, 1, 1, 1],
        [0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0]
        ]),
    "4L": Matrix([
        [0, 0, 0, 0, 0],
        [0, 0, 0, 1, 0],
        [1, 1, 1, 1, 0],
        [0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0]
        ]),
    "5L": Matrix([
        [0, 0, 0, 0, 1],
        [0, 0, 0, 0, 1],
        [1, 1, 1, 1, 1],
        [0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0]
        ]),
    "T": Matrix([
        [0, 0, 1, 0, 0],
        [0, 0, 1, 0, 0],
        [0, 1, 1, 1, 0],
        [0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0]
        ])
}

# Initialize the hub.
hub = PrimeHub()

# Initialize the aiBrick
MODEL = 'https://teachablemachine.withgoogle.com/models/ztCFxnUmJ/'
aibrick = AiBrickTeachableMachine(MODEL,            # provide link to TeachableMachine model
                                  detection=True,   # enable notification on detection
                                  probability=True) # enable updates about each class' probability

# continuous listening to Bluetooth connection and processing received frames
while True:
    received = aibrick.receive()
    # handle all types of received frames
    if received == 'setup':
        # aiBrick app requested for setup
        hub.light.on(Color.ORANGE)
    elif received == 'labels':
        # the setup of aiBrick app is finished
        hub.light.on(Color.WHITE)
    elif received in ['detection', 'probability']:
        print("'%s' brick detected!" % aibrick.detection)
        # display detected brick shape
        if aibrick.detection in BRICK_ICONS:
            hub.display.icon(BRICK_ICONS[aibrick.detection]*100)
        else:
            hub.display.icon(Icon.EMPTY)
        # display probabilities of each class as brightness of last row ('no brick' class probability is not included)
        col = 0
        for class_label, class_probability in aibrick.probability.items():
            if class_label in BRICK_ICONS:
                hub.display.pixel(4, col, brightness=class_probability)
                col += 1
