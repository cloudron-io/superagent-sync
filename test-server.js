#!/usr/bin/env node

'use strict';

var http = require('http'),
    url = require('url');

var retry = 0;

var server = http.createServer(function (req, res) {
    var parsed = url.parse(req.url, true);

    if (parsed.query.succeedOnRetry) {
        if (retry < parsed.query.succeedOnRetry) {
            ++retry;
            res.statusCode = 500;
            res.end();
        } else {
            retry = 0;
            res.statusCode = 200;
            res.end();
        }

        return;
    }

    if (parsed.query.method && parsed.query.method.toUpperCase() !== req.method) res.statusCode = 500;
    else res.statusCode = 200;

    res.end();
});

server.listen(8888, function () {
    console.log('Test server listening on 8888...');
});
