from pybricks.hubs import PrimeHub
from pybricks.parameters import Color
from usys import stdin
from uselect import poll

class AIBrickState:
    SETUP = 1
    LABELS = 2
    NOTIFICATION = 3
    PROBABILITY = 4

class AIBrickTeachableMachine:
    def __init__(self, model='', onnotification=lambda x: None):
        self.model = model
        self.onnotification = onnotification
        self.buffer = ''
        self.nuart = poll()
        self.nuart.register(stdin)
        self.state = AIBrickState.SETUP

    def _send(self, message):
        print(message + '\n')

    def setup():
        while self.state in (AIBrickState.SETUP, AIBrickState.LABELS):
            self.poll()

    def get_probabilities():
        self.poll()
        self._send('prob?')
        self.state = AIBrickState.PROBABILITY
        while self.state == AIBrickState.PROBABILITY:
            self.poll()
        return self.probabilities

    def _process(self, message):
        if self.state == AIBrickState.SETUP and message == 'setup?':
            self._send('model=' + self.model)
            self.labels = []
            self.state = AIBrickState.LABELS
        elif self.state == AIBrickState.LABELS:
            if message != '':
                self.labels.append(message)
                self._send("ack")
            else:
                self.state = AIBrickState.NOTIFICATION
        elif self.state == AIBrickState.NOTIFICATION:
            self.onnotification(message)
        elif self.state == AIBrickState.PROBABILITY:
            self.probabilities = {label: (byte - '_')/100
                                  for label, byte in zip(self._labels, message)}
            self.state = AIBrickState.NOTIFICATION
    
    def poll(self):
        while self.nuart.poll(0):
            char = stdin.read(1)  
            if char == '\n':
                self._process(self.buffer)
                self.buffer = ''
                break
            else: 
                self.buffer += char


def OnNotification(command):
    print(command)

hub = PrimeHub()
MODEL = ''
aibrick = AIBrickTeachableMachine(MODEL, OnNotification)
hub.light.on(Color.WHITE)

while True:
    aibrick.poll()