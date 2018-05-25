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
        this.poolData = { "UserPoolId": config.UserPoolId, "ClientId": config.ClientId };
        this.userPool = new ACI.CognitoUserPool(this.poolData);
    }
    signUp(username, password, email, phone, req){
        try{
			let attributeList = [];

			let dataEmail = {
				Name : 'email',
				Value : email
			};
		
			let dataPhoneNumber = {
				Name : 'phone_number',
				Value : phone
			};
			var attributeEmail = new ACI.CognitoUserAttribute(dataEmail);
			var attributePhoneNumber = new ACI.CognitoUserAttribute(dataPhoneNumber);

			attributeList.push(attributeEmail);
			attributeList.push(attributePhoneNumber);
			return new Promise(function(resolve, reject) {
				this.userPool.signUp(username, password, attributeList, null, function(err, result){
					let ro = new resposeObject();
					if (err && err.message != "200") {
						ro.message = CircularJSON.stringify(err);
						return resolve(ro);
					}
					let cognitoUser = result.user;
					ro.data = {"User name is" : cognitoUser.getUsername()};
					ro.status = 200;
					ro.message = "User successfully create";	
					Logger.broadcast("info", "LambdAuthCreateUser -> CognitoHelper -> SignUp - signup AWS info! : " + CircularJSON.stringify(cognitoUser));	
					resolve(ro);
					
				});
			}.bind(this));
        }catch(ex){
            Logger.broadcast("error", "LambdAuthCreateUser -> CognitoHelper -> SignUp - general error! : " + CircularJSON.stringify(ex));
            let ro = new resposeObject();
			ro.message = CircularJSON.stringify(ex);
			return ro;
        }
    }
    
}

exports.handler = async (event, context) => {
    let CH = new CognitoHelper();
	let lo = await CH.signUp(event.username, event.password, event.email, event.phone, context);
	console.log(lo);
    return lo;
};


