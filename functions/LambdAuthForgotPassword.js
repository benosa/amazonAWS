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
		console.log('124');
        this.poolData = { "UserPoolId": config.UserPoolId, "ClientId":config.ClientId };
        this.userPool = new ACI.CognitoUserPool(this.poolData);
    }
    forgotPassword(username, req){
        try{
			let userData = {
				Username : username,
				Pool : this.userPool
            };
            let cognitoUser = new ACI.CognitoUser(userData);
            return new Promise(function(resolve) {
                let ro = new resposeObject();
                cognitoUser.forgotPassword({
                    onSuccess: function (data) {
                        // successfully initiated reset password request
                        console.log('CodeDeliveryData from forgotPassword: ' + data);
                        ro.data = {"CodeDeliveryData from forgotPassword" : CircularJSON.stringify(data)};
                        ro.status = 200;
                        ro.message = "Password successfully change";	
                        Logger.broadcast("info", "CognitoHelper -> forgotPassword - successfully! : " + CircularJSON.stringify(result));
                        return resolve(ro);
                    },
                    onFailure: function(err) {
                        //alert(err.message || JSON.stringify(err));
                        console.log(err);
                        Logger.broadcast("error", "CognitoHelper -> forgotPassword - fail! : " + CircularJSON.stringify(err));
                        ro.message = CircularJSON.stringify(err);
						return resolve(ro);
                    },
                    //Optional automatic callback
                    inputVerificationCode: function(data) {
                        console.log('Code sent to: ' + data);
                        var verificationCode = prompt('Please input verification code ' ,'');
                        var newPassword = prompt('Enter new password ' ,'');
                        cognitoUser.confirmPassword(verificationCode, newPassword, {
                            onSuccess() {
                                console.log('Password confirmed!');
                            },
                            onFailure(err) {
                                console.log('Password not confirmed!');
                            }
                        });
                    }
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
    let lo = await CH.forgotPassword(event.username, context);
    return lo;
};


