'use strict'
const co = require('co');
let initialized = false;
let init = co.wrap(function* () {
    if(initialized){
        return;
    }
    process.env.login_api = 'https://zt88ws56yi.execute-api.us-east-1.amazonaws.com/dev/login';
    process.env.users_table = 'users';
    process.env.AWS_REGION = 'eu-west-1';
    process.env.cognito_user_pool_id = 'eu-west-1_MSTiyBCYF';
    process.env.cognito_client_id = 'detddn23s0fb3sjfvrd59v455';
    initialized = true;
})
module.exports.init = init;