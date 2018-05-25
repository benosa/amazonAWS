'use strict'
const co = require('co');
const expect = require('chai').expect;
const init = require('../steps/init').init;
const when = require('../steps/when');
const cheerio = require('cheerio');
describe('When the invoke POST function /login',co.wrap(function* () {
    before(co.wrap(function* () {
        yield init();
    }))
    it('should return JWT token',co.wrap(function* () {
        this.timeout(3000);
        let res = yield when.we_invoke_post_login();
        console.log(res);
        /*expect(res.statusCode).to.equal(200);
        expect(res.headers['Content-Type']).to.equal('text/html; charset=UTF-8');
        expect(res.body).to.not.be.null;*/
    }))
}))