from pybricks.hubs import PrimeHub
from pybricks.parameters import Color, Icon
from pybricks.geometry import Matrix
from aibrick import AiBrickTeachableMachine

# Initialize the hub.
hub = PrimeHub()

# Initialize the aiBrick
MODEL = 'https://teachablemachine.withgoogle.com/models/ztCFxnUmJ/'
aibrick = AiBrickTeachableMachine(MODEL, detection=True, probability=True)

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

while True:
    received = aibrick.receive()
    # handle all types of received commands
    if received == 'setup':
        # aiBrick app requested for setup
        hub.light.on(Color.ORANGE)
    elif received == 'labels':
        # the setup of aiBrick app is finished
        hub.light.on(Color.WHITE)
    elif received in ['detection', 'probability']:
        # display detected brick shape
        if aibrick.detection in BRICK_ICONS:
            hub.display.icon(BRICK_ICONS[aibrick.detection]*100)
        else:
            hub.display.icon(Icon.EMPTY)
        # display probabilities as brightness of last row
        col = 0
        for class_label, class_probability in aibrick.probability.items():
            if class_label in BRICK_ICONS:
                hub.display.pixel(4, col, brightness=class_probability)
                col += 1
