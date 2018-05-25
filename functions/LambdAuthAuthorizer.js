'use strict'
var AWS = require('aws-sdk');
const ACI = require('amazon-cognito-identity-js');
const config = require('../config.json');
const CircularJSON = require('circular-json');
const Logger = require('../libs/LoggerHelper');
const resposeObject = require('../libs/response');
global.fetch = require('node-fetch')

var jwt = require('jsonwebtoken');
var request = require('request');
var jwkToPem = require('jwk-to-pem');


class CognitoHelper {
    constructor() {
        this.poolData = { "UserPoolId": config.UserPoolId, "ClientId":config.ClientId };
        this.userPool = new ACI.CognitoUserPool(this.poolData);
    }
    async ValidateToken(pems, event/*, context*/) {
      return new Promise(async function(resolve) {
        var iss = config.iss;
        var token = event;
        //console.log(jwt.verify(token, pems));
        var decodedJwt = await jwt.decode(token, {complete: true});
        //console.log("!!!!!!!!!!!!!!");
        //console.log(decodedJwt);
        let ro = new resposeObject();
        Logger.broadcast("debug", "CognitoHelper -> ValidateToken - decoded token! : " + CircularJSON.stringify(decodedJwt));
        if (!decodedJwt) {
          Logger.broadcast("error", "CognitoHelper -> ValidateToken - Not a valid JWT token!");
          ro.message = "Not a valid JWT token";
          return resolve(ro);
        }
        //Fail if token is not from your User Pool
        if (decodedJwt.payload.iss != iss) {
          Logger.broadcast("error", "CognitoHelper -> ValidateToken - invalid issuer!");
          ro.message = "invalid issuer!";
          return resolve(ro);
        }
        //Reject the jwt if it's not an 'Access Token'
        if (decodedJwt.payload.token_use != 'access') {
          Logger.broadcast("error", "CognitoHelper -> ValidateToken - Not an access token!");
          ro.message = "Not an access token!";
          return resolve(ro);
        }
        //Get the kid from the token and retrieve corresponding PEM
        var kid = decodedJwt.header.kid;
        var pem = pems[kid];
        if (!pem) {
          Logger.broadcast("error", "CognitoHelper -> ValidateToken - Header Kid not Valid!");
          ro.message = "Header Kid not Valid!";
          return resolve(ro);
        }
        //console.log("1111");
        //let i = await jwt.verify(token, pem, { issuer: iss });
        
        //Verify the signature of the JWT token to ensure it's really coming from your User Pool
        jwt.verify(token, pem, { issuer: iss }, function(err, payload) {
          if(err) {
            Logger.broadcast("error", "CognitoHelper -> ValidateToken - not verify!");
            ro.message = "ValidateToken - not verify!";
            return resolve(ro);
          } else {
            Logger.broadcast("info", "CognitoHelper -> authorize - successfully verify! : " + CircularJSON.stringify(payload));
            ro.status = 200;
            ro.message = "authorize - successfully verify!";
            ro.data = payload;
            return resolve(ro);
          //Valid token. Generate the API Gateway policy for the user
          //Always generate the policy on value of 'sub' claim and not for 'username' because username is reassignable
          //sub is UUID for a user which is never reassigned to another user.
          //console.log(payload);
          /*var principalId = payload.sub;
  
          //Get AWS AccountId and API Options
          var apiOptions = {};
          var tmp = event.methodArn.split(':');
          var apiGatewayArnTmp = tmp[5].split('/');
          var awsAccountId = tmp[4];
          apiOptions.region = tmp[3];
          apiOptions.restApiId = apiGatewayArnTmp[0];
          apiOptions.stage = apiGatewayArnTmp[1];
          var method = apiGatewayArnTmp[2];
          var resource = '/'; // root resource
          if (apiGatewayArnTmp[3]) {
            resource += apiGatewayArnTmp[3];
          }
  
          //For more information on specifics of generating policy, see the blueprint for the API Gateway custom
          //authorizer in the Lambda console
  
          var policy = new AuthPolicy(principalId, awsAccountId, apiOptions);
          policy.allowAllMethods();*/
  
          //context.succeed(policy.build());
          }
        });
      });
    };
  
    authorize(event, req){
      console.log(event);
      let token = event.authorizationToken.split(" ")[1];
        try{
          return new Promise(async function(resolve) {
            try{
              
              Logger.broadcast("debug", "[CognitoHelper::verifyToken] Auth verifyToken.");
              var pems;
              const iss = config.iss;
              if (!pems) {
                //console.log("11111111111111111");
                //Download the JWKs and save it as PEM
                request({
                   url: iss + '/.well-known/jwks.json',
                   json: true
                 }, async function (error, response, body) {
                  //console.log("22222222222");
                  if (!error && response.statusCode === 200) {
                    pems = {};
                    var keys = body['keys'];
                    for(var i = 0; i < keys.length; i++) {
                      //Convert each key to PEM
                      var key_id = keys[i].kid;
                      var modulus = keys[i].n;
                      var exponent = keys[i].e;
                      var key_type = keys[i].kty;
                      var jwk = { kty: key_type, n: modulus, e: exponent};
                      var pem = jwkToPem(jwk);
                      pems[key_id] = pem;
                    }
                   // console.log(pems);
                    //Now continue with validating the token
                    let result = await this.ValidateToken(pems, token);	
                    let r = result;		
                    console.log(r);
                    if(r.status == 200){
                      let userId = r.client_id;
                      const generatePolicy = (principalId, effect, resource, context) => {
                        return {
                            "principalId": principalId,
                            "policyDocument": {
                              "Version": "2012-10-17",
                              "Statement": [
                                {
                                  "Action": [
                                    "apigateway:POST",
                                    'execute-api:Invoke'
                                  ],
                                  "Effect": effect,
                                  "Resource": resource
                                }
                              ]
                            },
                            "context": {
                              "stringKey": "value",
                              "numberKey": "1",
                              "booleanKey": "true"
                            },
                            "usageIdentifierKey": "{api-key}"
                        }
                      }
                      return resolve(generatePolicy(userId, 'Allow', event.methodArn, { userId }));
                    }

                    
                  } else {
                    Logger.broadcast("error", "CognitoHelper -> Unable to download JWKs, fail the call");
                    resposeObject.message = "authorize - Unable to download JWKs, fail the call!";
                    return resolve(resposeObject);
                    //Unable to download JWKs, fail the call
                    //context.fail("error");
                  }
                }.bind(this));
              } else {
                //PEMs are already downloaded, continue with validating the token
                let result = this.ValidateToken(pems, token);
                return resolve(result);
              };
            }catch(ex){
              Logger.broadcast("error", "CognitoHelper -> register - general error! : " + CircularJSON.stringify(ex));
              resposeObject.message = CircularJSON.stringify(ex);
              resolve(resposeObject);
            }
          }.bind(this));
        }catch(ex){
                    Logger.broadcast("error", "CognitoHelper -> changePassword - general error! : " + CircularJSON.stringify(ex));
                    let ro = new resposeObject();
              ro.message = CircularJSON.stringify(ex);
              return ro;
        }
    }
    
}

exports.handler = async (event, context, callback) => {
    //Logger.broadcast("debug", event);
    
    let CH = new CognitoHelper();
    let lo = await CH.authorize(event, context);
    console.log(lo);
    return callback(null, lo);
};
