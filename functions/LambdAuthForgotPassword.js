'use strict'
var AWS = require('aws-sdk');
const ACI = require('amazon-cognito-identity-js');
const config = require('../config.json');
const CircularJSON = require('circular-json');
const Logger = require('../libs/LoggerHelper');
const resposeObject = require('../libs/response');
global.fetch = require('node-fetch')

class CognitoHelper {
    
    }
    
}

exports.handler = async (event, context) => {
    let CH = new CognitoHelper();
    let lo = await CH.forgotPassword(event.username, context);
    return lo;
};


