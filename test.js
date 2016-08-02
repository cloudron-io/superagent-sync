#!/usr/bin/env node

/* global it:false */
/* global describe:false */
/* global before:false */
/* global after:false */

'use strict';

var spawn = require('child_process').spawn,
    expect = require('expect.js'),
    request = require('./index.js');

var server;
var serverUrl = 'http://localhost:8888';

before(function () {
    server = spawn('node', ['./test-server.js']);

    server.stdout.on('data', function (data) {
        console.log(data.toString());
    });

    server.stderr.on('data', function (data) {
        console.log(data.toString());
    });
});

after(function (done) {
    server.on('close', function () {
        done();
    });

    server.kill();
});

describe('GET', function () {
    it('succeeds', function () {
        var res = request.get(serverUrl).query({ method: 'get' }).end();
        expect(res.statusCode).to.equal(200);
    });

    it('succeeds with inline query', function () {
        var res = request.get(serverUrl + '?method=get').end();
        expect(res.statusCode).to.equal(200);
    });

    it('fails without retry', function () {
        var res = request.get(serverUrl + '?method=post').retry(0).end();
        expect(res.statusCode).to.equal(500);
    });

    it('succeeds after retry', function () {
        this.timeout(20000);

        var res = request.get(serverUrl + '?succeedOnRetry=2').retry(2).end();
        expect(res.statusCode).to.equal(200);
    });
});

describe('POST', function () {
    it('succeeds', function () {
        var res = request.post(serverUrl + '?method=post').end();
        expect(res.statusCode).to.equal(200);
    });
});

describe('PUT', function () {
    it('succeeds', function () {
        var res = request.put(serverUrl + '?method=put').end();
        expect(res.statusCode).to.equal(200);
    });
});

describe('DELETE', function () {
    it('succeeds', function () {
        var res = request.del(serverUrl + '?method=delete').end();
        expect(res.statusCode).to.equal(200);
    });
});

describe('HEAD', function () {
    it('succeeds', function () {
        var res = request.head(serverUrl + '?method=head').end();
        expect(res.statusCode).to.equal(200);
    });
});
