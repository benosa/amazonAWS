'use strict'
var AWS = require('aws-sdk');
const ACI = require('amazon-cognito-identity-js');
const config = require('../config.json');
const CircularJSON = require('circular-json');
const Logger = require('../libs/LoggerHelper');
const resposeObject = require('../libs/response');
const cookie = require('cookie');
global.fetch = require('node-fetch')

class CognitoHelper {
    constructor() {
        this.poolData = { "UserPoolId": config.UserPoolId, "ClientId":config.ClientId };
        this.userPool = new ACI.CognitoUserPool(this.poolData);
    }
    authorize(username, password, req){
        try{
            let authenticationData = {
				Username : username,
				Password : password,
            };
			let authenticationDetails = new ACI.AuthenticationDetails(authenticationData);
			let userData = {
				Username : username,
				Pool : this.userPool
            };
            let cognitoUser = new ACI.CognitoUser(userData);
            return new Promise(function(resolve) {
				cognitoUser.authenticateUser(authenticationDetails, {
					onSuccess: function (result) {
						//console.log('access token + ' + result.getAccessToken().getJwtToken());
						AWS.config.region = 'eu-west-1';
						AWS.config.credentials = new AWS.CognitoIdentityCredentials({
							IdentityPoolId : config.IdentityPoolId,
							Logins : {
								"cognito-idp.eu-west-1.amazonaws.com/eu-west-1_aSOLu76Wz" : result.getIdToken().getJwtToken()
							}
                        });
						AWS.config.credentials.refresh((error) => {
							if (error) {
								Logger.broadcast("error", "CognitoHelper -> authorize - AWS.config.credentials.refresh error! : " + CircularJSON.stringify(error));
								resposeObject.message = CircularJSON.stringify(error);
								return resolve(resposeObject);
							} else {
                                
								// Instantiate aws sdk service objects now that the credentials have been updated.
								// example: var s3 = new AWS.S3();
                                Logger.broadcast("info", "CognitoHelper -> authorize - signup AWS info! : " + CircularJSON.stringify(result));
                                let ro = new resposeObject();
								ro.data = {"Access-Token" : result.getAccessToken().getJwtToken()};
								ro.status = 200;
								ro.message = "successfully login";		
								Logger.broadcast("info", "CognitoHelper -> authorize - cognitoUser.authenticateUser success! : " + CircularJSON.stringify(ro));		
								resolve(ro);
							}
						});
					}.bind(this),
					onFailure: function(err) {
                        Logger.broadcast("error", "CognitoHelper -> authorize - cognitoUser.authenticateUser error! : " + CircularJSON.stringify(err));
                        let ro = new resposeObject();
						ro.message = CircularJSON.stringify(err);
						resolve(ro);
					}.bind(this),
				});
			}.bind(this));
        }catch(ex){
            Logger.broadcast("error", "CognitoHelper -> authorize - general error! : " + CircularJSON.stringify(ex));
            let ro = new resposeObject();
			ro.message = CircularJSON.stringify(ex);
			return ro;
        }
    }
    
}

exports.handler = async (event, context, callback) => {
    let CH = new CognitoHelper();
	//console.log(event);
	let body = JSON.parse(event.body);
	let lo = await CH.authorize(body.username,body.password, context);
	const response = {
		statusCode: 200,
		headers: {
		  'Access-Control-Allow-Origin': 'https://dev3.xxpirates.com',
		  'Access-Control-Allow-Credentials': true,
		},
		body: JSON.stringify({
			token : lo.getData()["Access-Token"]
		})
	  };
	  callback(null, response);
};
