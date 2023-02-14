from pybricks.hubs import PrimeHub
from pybricks.parameters import Color
from usys import stdin
from uselect import poll


# class AIBrick:
#     def __init__(self):
#         self.buffer = ''
#         self.nuart = poll()
#         self.nuart.register(stdin)

#     def _send(self, cmd, value):
        # print(cmd, '\t', value, '\n', sep=None)

#     def _process(self, message):
#         pass
    
#     def receive(self):
#         while self.nuart.poll(0):
#             char = stdin.read(1)  
#             if char == '\n':
#                 message, self.buffer = self.buffer, ''
#                 self._process(message)
#             else: 
#                 self.buffer += char


# class AIBrickTeachableMachine(AIBrick):
#     def __init__(self, model='', ondetection=None, use_probabilities=False):
#         super().__init__()
#         self.model = model
#         self.ondetection = ondetection
#         self.use_probabilities = use_probabilities
#         self._labels = []
#         self.probability = dict()

#     def _process(self, message):
#         if '\t' in message:
#             cmd, value = message.split('\t')
#             if cmd == 'setup':
#                 self._send('model', self.model)
#             elif cmd == 'labels':
#                 self._labels = value.split(' ')
#                 self._send('notify', str(callable(self.ondetection)).lower())
#             elif cmd == 'P':
#                 self.probability = {label: (encoded_byte - '_')/100 
#                                      for label, encoded_byte in zip(self._labels, value)}
#         else:
#             self.ondetection(message)


class AIBrickTeachableMachine:
    def __init__(self, model='', ondetection=None, use_probabilities=False):
        self.model = model
        self.ondetection = ondetection
        self.use_probabilities = use_probabilities
        self.buffer = ''
        self.nuart = poll()
        self.nuart.register(stdin)
        self.labels = []

    def _send(self, command, message):
        print(command, '\t', message, '\n', sep=None)

    def _process(self, command, message):
        if cmd == '':
            self.ondetection(message)
        elif cmd == 'setup':
            self._send('setup', f'{{"type": "teachablemachine", "model": "{self.model}", "probability": {self.use_probabilities}}}')
        elif cmd == 'labels':
            self.labels = value.split('"')[1::2]
        elif cmd == 'P' and self.use_probabilities:
            for label, encoded_byte in zip(self.labels, message):
                self.probability[label] = (encoded_byte - 32)/100
    
    def receive(self):
        while self.nuart.poll(0):
            char = stdin.read(1)  
            if char == '\n':
                received, self.buffer = self.buffer, ''
                command, message = received.split('\t', 1) if '\t' in received else '', received
                #message = message.replace('\\n', '\n').replace('\\r', '\r').replace('\\t', '\t')
                self._process(command, message)
                return received
            else: 
                self.buffer += char
        


def OnNotification(command):
    print(command)

hub = PrimeHub()
MODEL = ''
aibrick = AIBrickTeachableMachine(MODEL, OnNotification)
hub.light.on(Color.WHITE)

while True:
    aibrick.receive()