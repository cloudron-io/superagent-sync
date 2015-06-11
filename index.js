'use strict';

var safe = require('safetydance'),
    syncRequest = require('sync-request');

exports = module.exports = {
    get: get,
    post: post
};

function get(url) {
    return new Request().get(url);
}

function post(url) {
    return new Request().post(url);
}

function Request() {
    this._method = '';
    this._url = '';
    this._headers = { };
    this._body = null;
    this._qs = null;
}

Request.prototype.get = function (url) {
    this._method = 'GET';
    this._url = url;
    return this;
};

Request.prototype.post = function (url) {
    this._method = 'POST';
    this._url = url;
    return this;
};

Request.prototype.auth = function (user, pass) {
    var str = new Buffer(user + ':' + pass).toString('base64');
    this._headers['Authorization'] = 'Basic ' + str;
    return this;
};

Request.prototype.set = function (key, value) {
    this._headers[key] = value;
    return this;
};

Request.prototype.query = function (obj) {
    this._qs = typeof obj === 'string' ? querystring.parse(obj) : obj;
    return this;
};

Request.prototype.send = function (data) {
    if (typeof data === 'string') {
        this._body = data;
    } else if (typeof data === 'object') {
        this._headers['content-type'] = 'application/json';
        this._body = JSON.stringify(data);
    }
    return this;
};

Request.prototype.end = function () {
    var res = syncRequest(this._method, this._url, { headers: this._headers, body: this._body, qs: this._qs });

    res.json = function (encoding) {
        return safe.JSON.parse(this.getBody(encoding || 'utf8'));
    };
    return res;
};

