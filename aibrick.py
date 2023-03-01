from usys import stdin
from uselect import poll

SEP = '·'

class AIBrick:
    frames = {}

    def __init__(self):
        self.buffer = ''
        self.nuart = poll()
        self.nuart.register(stdin)
        while self.nuart.poll(0):
            stdin.read(1)

    def _send(self, command, message):
        print(command, SEP, message, '\n', sep='')

    def _process(self, message):
        pass
    
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
                return self.frames.get(cmd, cmd)
            else: 
                self.buffer += char


class AIBrickTeachableMachine(AIBrick):
    frames = {"d": "detection", "p": "probability"}

    def __init__(self, model='', detection=True, probability=False):
        super().__init__()
        self.model = model
        self.send_detection = detection
        self.send_probability = probability
        self.labels = []

    def _process(self, cmd, message):
        if cmd == 'setup':
            self._send('setup', '{' + \
                                '"type": "teachablemachine",' + \
                                f'"model": "{self.model}",' + \
                                f'"detection": {int(self.send_detection)},' + \
                                f'"probability": {int(self.send_probability)}' + \
                                '}')
        elif cmd == 'labels':
            self.labels = message.split('"')[1::2]
        if cmd == 'd' and self.send_detection:
            self.detection = message
        elif cmd == 'p' and self.send_probability:
            probabilities = message.split(',')
            self.probability = {label: int(p) if p.isdigit() else 0 
                                for label, p in zip(self.labels, probabilities)}