'use strict'
let instance = null;
var winston = require('winston');
//const tsFormat = () => ( new Date() ).toLocaleDateString() + ' - ' + ( new Date() ).toLocaleTimeString();
const tsFormat = () => ( new Date() ).toString();

var wlogger = new (winston.Logger)({
    transports: [
      new (winston.transports.Console)({ timestamp: tsFormat, colorize: false, level: 'debug' }),
      //new winston.transports.File({ filename: '/root/crypto5-zak/logs/All-logs.log',level: 'debug' })
    ],
    exceptionHandlers: [
      //new winston.transports.File({ filename: '/root/crypto5-zak/logs/All-exceptions.log' })
    ]
  });
class Logger{  
	/*static bootstrap(){
		if(!instance){
			  instance = new Logger();
		}
		return instance;
	}*/
    constructor() {

	}
	static broadcast(channel, msg, response){
		if(response !== undefined)response.send(msg);
		switch(channel){
			case "info":
				wlogger.log('info', msg);
				break;
			case "error":
				wlogger.log('error', msg);
				break;
			case "warn":
				wlogger.log('warn', msg);
				break;
			case "verbose":
				wlogger.log('verbose', msg);
				break;
			case "debug":
				wlogger.log('debug', msg);
				break;
			case "silly":
				wlogger.log('silly', msg);
				break;
		}
	}
}

module.exports = Logger;