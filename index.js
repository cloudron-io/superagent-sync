'use strict';

var querystring = require('querystring'),
    safe = require('safetydance'),
    syncRequest = require('sync-request');

exports = module.exports = {
    get: get,
    post: post,
    put: put,
    del: del,
    head: head
};

function get(url) {
    return new Request('GET', url);
}

function post(url) {
    return new Request('POST', url);
}

function put(url) {
    return new Request('PUT', url);
}

function del(url) {
    return new Request('DELETE', url);
}

function head(url) {
    return new Request('HEAD', url);
}

function Request(method, url) {
    this._method = method;
    this._url = url;
    this._headers = { };
    this._body = null;
    this._qs = null;
    this._tryCount = 1;
    this._followRedirects = true;
    this._maxRedirects = Infinity;
}

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

Request.prototype.redirects = function (count) {
    if (!count) {
        this._followRedirects = false;
    } else {
        this._maxRedirects = count;
    }
    return this;
};

Request.prototype.retry = function (count) {
    this._tryCount = count + 1;
    return this;
};

Request.prototype.end = function () {
    var res = this._makeRequest();
    return res;
};

Request.prototype._makeRequest = function () {
    var res = { };

    try {
        res = syncRequest(this._method, this._url, {
            headers: this._headers,
            body: this._body,
            qs: this._qs,
            retry: true,
            maxRetries: this._tryCount,
            followRedirects: this._followRedirects,
            maxRedirects: this._maxRedirects
        });
        res.buffer = res.body;
        res.text = res.body.toString('utf8'); // TODO: get encoding from content-encoding
        res.body = safe.JSON.parse(res.body.toString('utf8'));
    } catch (e) {
        res.statusCode = 404;
        res.error = e;
    }

    res.request = this;
    res.json = function (encoding) {
        return safe.JSON.parse(this.getBody(encoding || 'utf8')); // getBody throws!
    };

    return res;
};

