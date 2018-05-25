'use strict'
class resposeObject{
    constructor(){
        this.status = 201;
        this.message = "";
        this.data = {};
    }
    getData(){
        return this.data;
    }
}
module.exports = resposeObject;