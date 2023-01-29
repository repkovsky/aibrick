from pybricks.hubs import PrimeHub
from pybricks.parameters import Color
from usys import stdin
from uselect import poll


class AIBrickTeachableMachine:
    def __init__(self, model='', onnotification=None):
        self.model = model
        self.onnotification = onnotification
        self.buffer = ''
        self.nuart = poll()
        self.nuart.register(stdin)
        self._labels = []

    def _send(self, message):
        print(message + '\n')

    def _request(self, message):
        self.poll()
        self._send(message)
        response = None
        while response is None:
            response = self._receive()
        return response

    def get_probabilities():
        return {label: (byte - '_')/100 for label, byte in zip(self._labels, self._request('?P'))}

    def _process(self, message):
        if message == '?setup':
            self._send('!model=' + self.model)
        elif message.startswith('!labels'):
            self._labels = message.split('=')[1].split('\t')
            self._send('!notify=' + str(callable(self.onnotification)).lower())
        else:
            self.onnotification(message)
    
    def _receive(self):
        while self.nuart.poll(0):
            char = stdin.read(1)  
            if char == '\n':
                result, self.buffer = self.buffer, ''
                return result
            else: 
                self.buffer += char
        return None

    def poll(self):
        result = self._receive()
        if result is not None:
            self._process(result)
        


def OnNotification(command):
    print(command)

hub = PrimeHub()
MODEL = ''
aibrick = AIBrickTeachableMachine(MODEL, OnNotification)
hub.light.on(Color.WHITE)

while True:
    aibrick.poll()