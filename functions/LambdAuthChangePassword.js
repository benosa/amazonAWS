'use strict'
var AWS = require('aws-sdk');
const ACI = require('amazon-cognito-identity-js');
const config = require('../config.json');
const CircularJSON = require('circular-json');
const Logger = require('../libs/LoggerHelper');
const resposeObject = require('../libs/response');
global.fetch = require('node-fetch')

class CognitoHelper {
    constructor() {
        this.poolData = { "UserPoolId": config.UserPoolId, "ClientId":config.ClientId };
        this.userPool = new ACI.CognitoUserPool(this.poolData);
    }
    changePassword(username, oldPassword, newPassword, req){
        try{
			let userData = {
				Username : username,
				Pool : this.userPool
            };
            let cognitoUser = new ACI.CognitoUser(userData);
            return new Promise(function(resolve) {
				let ro = new resposeObject();
				cognitoUser.changePassword(oldPassword, newPassword, function(err, result) {
					if (err) {
						console.log(result);
						Logger.broadcast("error", "CognitoHelper -> changePassword - fail changePassword! : " + CircularJSON.stringify(err));
                        ro.message = CircularJSON.stringify(err);
						return resolve(ro);
					}
					ro.data = {"Result is" : CircularJSON.stringify(result)};
					ro.status = 200;
					ro.message = "Password successfully change";	
                    Logger.broadcast("info", "CognitoHelper -> changePassword - successfully! : " + CircularJSON.stringify(result));
                    resolve(ro);
				});
			}.bind(this));
        }catch(ex){
            Logger.broadcast("error", "CognitoHelper -> changePassword - general error! : " + CircularJSON.stringify(ex));
            let ro = new resposeObject();
			ro.message = CircularJSON.stringify(ex);
			return ro;
        }
    }
    
}

exports.handler = async (event, context) => {
    let CH = new CognitoHelper();
    let lo = await CH.changePassword(event.username,event.oldPassword,event.newPassword, context);
    return lo;
};


