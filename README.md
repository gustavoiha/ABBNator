# ABBNator
A Tic Tac Toe robot using ABB ARM Robot controlled by Node.JS

*Watch the video:*

[![ABBNator video](http://img.youtube.com/vi/V9dOoicowb0/0.jpg)](http://www.youtube.com/watch?v=V9dOoicowb0)

# What was used in the project?

1. An ABB Robot
2. An Arduino board with Bluetooth and a Light Sensor
3. An Computer, connected to ABB Robot through Ethernet cable

# How does Node.JS communicate with the ABB Robot?
Files: `components/ABBRobot.js` and `ABBNator.txt`;

ABB Robots provide us with `RAPID` programming language. That language, allows
us to use `Sockets` and also `FTP`.

For a matter of simplicity, and also facility, we opted to use `FTP` as the
data exchange format.

The code running in the ABB is the `ABBNator.txt`. It basically waits for
a given file (In this case, `/hd0a/abbnator/target.txt`), and reads it.

The file contains the speed, x, y and z params for the `MoveL` instruction.
Here is the format:

```
// Protocol:
<SPEED>:<X>|<Y>|<Z>;

// Example (Go to [50, 120, 340] with speed 200):
200:50|120|340;
```

After executing the action, `ABBNator` will remove the file in order to notify
any system using the FTP to know that "the action has been completed".

# How does Node.JS communicate with the Sensor?

Files: `components/SerialSensor.js` and `components/SerialConnection.js`;

The sensor used was a simple infrared light sensor, connected to a servo motor
to raise and lower the sensor.

The connection with the Arduino used a (really) simple protocol:

* Send character `A`: Activates the motor (lower)
* Send character `I`: Deactivate the motor (raise)
* Send character `S`: Reads the analog sensor value and sends back

In Node.JS, the library `serialport` was used to have access to the `stream` of
data from and to the bluetooth port.


# How does Node.JS plays Tic Tac Toe?

File: `components/TicTacToe.js`;

Using `Minimax` algorithm.

It will never loose, but it can end in a draw. You can look at the file
`components/TicTacToe.js` for that.

# How does everything work together?

Files: `RealGame.js` and `components/GameController.js`;

Dig in the code, you will get the idea ;)
