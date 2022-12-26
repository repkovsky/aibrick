from pybricks.pupdevices import Motor, UltrasonicSensor
from pybricks.parameters import Direction, Port, Stop
from pybricks.robotics import DriveBase
from usys import stdin
from uselect import poll


class BluetoothCommunication:
    def __init__(self, callback):
        self.buffer = ''
        self.callback = callback
        self.nuart = poll()
        self.nuart.register(stdin)
    
    def poll(self):
        if self.nuart.poll(0):        
            self.buffer += stdin.read(1)
            if self.buffer[-1] == '\n':
                self.callback(self.buffer.strip())
                self.buffer = ''

def execute(command):
    print(command)
    if command == "left":
        drive_base.turn(-90, then=Stop.BRAKE, wait=False)
    elif command == "right":
        drive_base.turn(90, then=Stop.BRAKE, wait=False)
    elif command == "go":
        drive_base.drive(200, 0)
    elif command == "stop":
        drive_base.stop()

# Configure the Drive Base and the Distance Sensor.
drive_base = DriveBase(left_motor=Motor(Port.A, Direction.COUNTERCLOCKWISE),
                       right_motor=Motor(Port.B),
                       wheel_diameter=44,
                       axle_track=88)

distance_sensor = UltrasonicSensor(Port.D)
ble_communication = BluetoothCommunication(execute)

while True:
    ble_communication.poll()
    if distance_sensor.distance() < 100:
        drive_base.straight(-10, Stop.COAST_SMART)
