from pybricks.hubs import PrimeHub
from pybricks.parameters import Color, Icon
from pybricks.geometry import Matrix
from aibrick import AiBrickTeachableMachine

"""
This is Pybricks code for classification of poses using aiBrick, 
TeachableMachine AI/ML model and camera in PC/Laptop/Smartphone. 
"""

# define images corresponding to detection of bricks
HAND_ICONS = {
    "Right hand": Matrix([
        [0, 0, 1, 0, 1],
        [0, 0, 1, 0, 1],
        [1, 1, 1, 1, 0],
        [0, 1, 0, 1, 0],
        [0, 1, 0, 1, 0]
        ]),
    "Left hand": Matrix([
        [1, 0, 1, 0, 0],
        [1, 0, 1, 0, 0],
        [0, 1, 1, 1, 1],
        [0, 1, 0, 1, 0],
        [0, 1, 0, 1, 0]
        ]),
    "No hand": Matrix([
        [0, 0, 1, 0, 0],
        [0, 0, 1, 0, 0],
        [1, 1, 1, 1, 1],
        [0, 1, 0, 1, 0],
        [0, 1, 0, 1, 0]
        ])
}

# Initialize the hub.
hub = PrimeHub()

# Initialize the aiBrick
MODEL = 'https://teachablemachine.withgoogle.com/models/VNpXAnBmX/'
aibrick = AiBrickTeachableMachine(
    MODEL,            # provide link to TeachableMachine model
    detection=True,   # enable notification on detection
    probability=False # disable updates about each class' probability
)
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
    elif received == 'detection':
        print(aibrick.detection)
        # display detected brick shape
        if aibrick.detection in HAND_ICONS:
            hub.display.icon(HAND_ICONS[aibrick.detection]*100)
        else:
            hub.display.icon(Icon.EMPTY)
