from pybricks.hubs import PrimeHub
from pybricks.parameters import Color
from usys import stdin
from uselect import poll

SEP = '·'

# class AIBrick:
#     def __init__(self):
#         self.buffer = ''
#         self.nuart = poll()
#         self.nuart.register(stdin)

#     def _send(self, command, message):
#         print(command, SEP, message, '\n', sep='')

#     def _process(self, message):
#         pass
    
#     def receive(self):
#         while self.nuart.poll(0):
#             char = stdin.read(1)  
#             if char == '\n':
#                 received, self.buffer = self.buffer, ''
#                 if SEP in received:
#                     cmd, message = received.split(SEP, 1)
#                 else:
#                     cmd, message = '', received
#                 self._process(cmd, message)
#                 return cmd
#             else: 
#                 self.buffer += char


# class AIBrickTeachableMachine(AIBrick):
#     def __init__(self, model='', detection=True, probability=False):
#         super().__init__()
#         self.model = model
#         self.send_detection = detection
#         self.send_probability = probability
#         self.labels = []

#     def _process(self, cmd, message):
#         if cmd == 'setup':
#             self._send('setup', '{' + \
#                                 '"type": "teachablemachine",' + \
#                                 f'"model": "{self.model}",' + \
#                                 f'"detection": {int(self.send_detection)},' + \
#                                 f'"probability": {int(self.send_probability)}' + \
#                                 '}')
#         elif cmd == 'labels':
#             self.labels = message.split('"')[1::2]
#         if cmd == 'd':
#             self.detection = message
#         elif cmd == 'p' and self.send_probability:
#             probabilities = message.split(',')
#             if all([p.isdigit() for p in probabilities]):
#                 self.probability = {label: int(p) for label, p in
#                                     zip(self.labels, probabilities)}
#             elif message.endswith('setup' + SEP + '?'):
#                 self._process('setup', '?')
#         else:
#             print("cmd", cmd, len(cmd), "message", message)


class AIBrickTeachableMachine:
    def __init__(self, model='', detection=True, probability=False):
        self.model = model
        self.send_detection = detection
        self.send_probability = probability
        self.labels = []
        self.buffer = ''
        self.nuart = poll()
        self.nuart.register(stdin)

    def _send(self, command, message):
        print(command, SEP, message, '\n', sep='')

    def _process(self, cmd, message):
        print(SEP + cmd + SEP + message)
        if cmd == 'setup':
            self._send('setup', '{' + \
                                '"type": "teachablemachine",' + \
                                f'"model": "{self.model}",' + \
                                f'"detection": {int(self.send_detection)},' + \
                                f'"probability": {int(self.send_probability)}' + \
                                '}')
        elif cmd == 'labels':
            self.labels = message.split('"')[1::2]
        if cmd == 'd':
            self.detection = message
        elif cmd == 'p' and self.send_probability:
            probabilities = message.split(',')
            if all([p.isdigit() for p in probabilities]):
                self.probability = {label: int(p) for label, p in
                                    zip(self.labels, probabilities)}
            elif message.endswith('setup' + SEP + '?'):
                self._process('setup', '?')
        else:
            print("cmd", cmd, len(cmd), "message", message)
    
    def receive(self):
        while self.nuart.poll(0):
            char = stdin.read(1)  
            if char == '\n':
                received, self.buffer = self.buffer, ''
                if SEP in received:
                    cmd, message = received.split(SEP, 1)
                else:
                    cmd, message = '', received
                self._process(cmd, message)
                return cmd
            else: 
                self.buffer += char
        

hub = PrimeHub()
MODEL = ''
aibrick = AIBrickTeachableMachine(MODEL, detection=False, probability=True)
hub.light.on(Color.WHITE)

while True:
    result = aibrick.receive()
    if (result == 'detection'):
        print(aibrick.detection)
    elif (result == 'probability'):
        print(aibrick.probability)
