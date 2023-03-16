from usys import stdin
from uselect import poll

SEP = '·'

class AiBrick:
    """
    Base class for AiBrick communication.
    """
    frames = {}

    def __init__(self):
        self.buffer = ''
        self.nuart = poll()
        self.nuart.register(stdin)
        while self.nuart.poll(0):
            stdin.read(1)

    def _send(self, cmd, message):
        print(cmd, SEP, message, '\n', sep='')

    def _process(self, cmd, message):
        ...
    
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


class AiBrickTeachableMachine(AiBrick):
    frames = {"d": "detection", "p": "probability"}

    def __init__(self, model='', detection=True, probability=False):
        super().__init__()
        self.config = {
            "type": "teachablemachine",
            "model": model,
            "detection": detection,
            "probability": probability
        }
        self.labels = []
        self.detection = ""
        self.probability = {}

    def _process(self, cmd, message):
        if cmd == 'setup':
            self._send('setup', json_dumps(self.config))
        elif cmd == 'labels':
            self.labels = message.split('"')[1::2]
        if cmd == 'd' and self.config['detection']:
            self.detection = self.labels[int(message)]
        elif cmd == 'p' and self.config['probability']:
            probabilities = message.split(',')
            self.probability = {label: int(p) if p.isdigit() else 0 
                                for label, p in zip(self.labels, probabilities)}
        else:
            print("cmd", cmd, len(cmd), "message", message)

def json_dumps(dictionary):
    def json_format(value):
        if type(value) is dict:
            return '{%s}' % ','.join(['"%s":%s' % (str(key), json_format(val))
                                      for key, val in value.items()])
        elif type(value) in [list, tuple]:
            return '[%s]' % ','.join([json_format(elem) for elem in value])
        elif type(value) in [int, float]:
            return str(value)
        elif type(value) is str:
            for char, escaped in [('\\', '\\'), ('"', '"'), ('\n', 'n'), 
                                  ('\r', 'r'), ('\t', 't')]:
                value = value.replace(char, '\\' + escaped)
            return '"%s"' % value
        elif type(value) is bool:
            return str(value).lower()
        elif value is None:
            return 'null'
    
    assert type(dictionary) is dict
    return json_format(dictionary)