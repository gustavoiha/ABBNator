var _ = require('lodash');
var serialport = require('serialport');

function SerialConnection(opts) {
	var self = this;

	this.opts = _.defaultsDeep(opts, {
		checkInterval: 100,

		devicePattern: {},

		serialOptions: {
			baudRate: 57600,
		},
	});

	// Open Connection will be saved here.
	this.connection = null;

	//
	// Called every time the connection closes
	//
	this.connectionClosed = function (data) {
		console.log('Closed connection');

		this.connection = null;

    self._isConnecting = false;

		// Notify callback
		this.opts.onConnect && this.opts.onConnect(null);

		// Check for new connection
		this.checkConnection();
	}


	//
	// Called every time the connection closes
	//
	this.connectionOpened = function (connection) {
		console.log('Opened connection');

    self._isConnecting = false;

		// Notify callback
		this.opts.onConnect && this.opts.onConnect(this.connection);
	}


	//
	// Checks the connection, and connects if not connected
	//
	this.checkConnection = function () {
		// console.log('Checking connection...');

		if(this.connection && this.connection.isOpen())
			return;

		serialport.list(function (err, ports) {
			// console.log(ports);
			if(err) return console.log('Error: ' + err);

			// Find matching device
			var port = _.find(ports, self.opts.devicePattern);

			if(!port)
				return;


			self.connectTo(port.comName);
		})

	};


	//
	// Tryies to connect to the defined Path, and close any
	// connection before doing it.
	//
	this.connectTo = function (path) {
    if(this._isConnecting)
      return;

    this._isConnecting = true;

		var newlyConn;

    console.log('Connecting to '+path);

		if(this.connection && this.connection.isOpen())
			this.connection.close(thenConnect);
		else
			thenConnect();


		function thenConnect (err){
			if(err) {
        self._isConnecting = false;
        return console.error('Error', err);
      }

			self.connection = new serialport.SerialPort(path, self.opts.serialOptions);

			self.connection.on('open', self.connectionOpened.bind(self));
			self.connection.on('close', self.connectionClosed.bind(self));
		};
	};


	//
	// Pings the Connection
	//
	setInterval(this.checkConnection.bind(this), this.opts.checkInterval);
}

module.exports = SerialConnection;
