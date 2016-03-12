var serialport = require('serialport');
var SerialConnection = require('./SerialConnection');

var SerialSensor = module.exports = function (serialPath) {
  var self = this;

  this.serialConnection = new SerialConnection({
		debug: false,

		// Device pattern to connect to
		devicePattern: {
			// serialNumber: '9533335393635131E0F1',
			// serialNumber: serialPath,
      comName: serialPath,
		},

		serialOptions: {
			parser: serialport.parsers.readline('\n'),
			delimiter: '\n',
		},

		onConnect: self.didConnect.bind(self),

    checkInterval: 10000,

		timeout: 100,
	});

  this.serialConnection.checkConnection();
}


SerialSensor.prototype.waitConnect = function (next) {
  if(this.conn && this.conn.isOpen())
    return next();

  this.onConnected = next;
}


SerialSensor.prototype.didConnect = function (connection) {
  // Save Connection internally
	this.conn = connection;

	if(!connection)
		return console.log('onConnect: false');

	console.log('onConnect: ok');

  this.onConnected && this.onConnected();

	connection.on('data', this.gotReading.bind(this));
}

SerialSensor.prototype.gotReading = function (reading) {
  // console.log('Got reading!', reading);

  if(this.onReceive){
    // Save callback and clear it
    var cb = this.onReceive;
    this.onReceive = null;

    // Call callback
    cb && cb(reading);
  }
}



// Send raw data
SerialSensor.prototype.sendData = function (data) {
  if(!this.conn)
    return false;

  try{
		this.conn.write(data);
		this.conn.drain();
	}catch(e){
    return false;
	}

  return true;
}

// Lower arm of sensor
SerialSensor.prototype.activate = function (next) {
  if(!this.sendData('A'))
    return next('Failed to send data!');

  // Wait to act
  setTimeout(next, 2000);
}

// Bring back arm
SerialSensor.prototype.deactivate = function (next) {
  if(!this.sendData('I'))
    return next('Failed to send data!');

  // Wait to act
  setTimeout(next, 100);
}

// Read sensor value
SerialSensor.prototype.readSensor = function (next) {
  this.sendData('S', next);

  var consumed = false;
  this.onReceive = (data) => {
    // Skip if already timed out
    if(consumed)
      return;

    consumed = true;

    // console.log('Received! ' + data);
    next(null, data);
  }

  // Timeout
  setTimeout(() => {
    if(consumed)
      return;

    consumed = true;
    return next('Could not read sensor. Timeout.');
  }, 200);
}
