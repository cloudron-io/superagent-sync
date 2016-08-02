'use strict';

var querystring = require('querystring'),
    child_process = require('child_process'),
    safe = require('safetydance'),
    syncRequest = require('sync-request'),
    debug = require('debug')('superagent-sync');

exports = module.exports = {
    get: get,
    post: post,
    put: put,
    del: del,
    head: head
};

function sleep(timeout) {
    child_process.execSync('sleep ' + timeout);
}

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
    this._tryCount = method === 'GET' ? 5 : 1;
    this._followRedirects = false;
    this._maxRedirects = Infinity;
    this._retryDelay = 5; // 5 s
    this._bodyType = 'json';
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

Request.prototype.type = function (type) {
    this._bodyType = type; // 'form' or 'json'
    return this;
};

Request.prototype.send = function (data) {
    if (typeof data === 'string') {
        this._body = data;
    } else if (typeof data === 'object') {
        if (this._bodyType === 'json') {
            this._headers['content-type'] = 'application/json';
            this._body = JSON.stringify(data);
        } else { // 'form'
            this._headers['content-type'] = 'application/x-www-form-urlencoded';
            this._body = querystring.stringify(data);
        }
    }
    return this;
};

Request.prototype.redirects = function (count) {
    if (!count) {
        this._followRedirects = false;
        this._maxRedirects = 0;
    } else {
        this._followRedirects = true;
        this._maxRedirects = count;
    }
    return this;
};

Request.prototype.retry = function (count) {
    this._tryCount = count + 1;
    return this;
};

Request.prototype.end = function () {
    var res, i = 0;

    // implement retry by ourself since then-request throws exception at times
    while (true) {
        res = this._makeRequest();
        if (res.statusCode < 400 || ++i >= this._tryCount) break;
        debug('statusCode:%s for attempt %s. retrying in %s seconds', res.statusCode, i, this._retryDelay);
        sleep(this._retryDelay);
    }

    return res;
};

Request.prototype._makeRequest = function () {
    var res = { };

    try {
        debug('%s %s%s', this._method, this._url, this._qs ? '?' + querystring.stringify(this._qs) : '');

        res = syncRequest(this._method, this._url, {
            headers: this._headers,
            body: this._body,
            qs: this._qs,
            retry: false,
            followRedirects: this._followRedirects,
            maxRedirects: this._maxRedirects
        });
        res.buffer = res.body;
        res.text = res.body.toString('utf8'); // TODO: get encoding from content-encoding
        res.body = safe.JSON.parse(res.body.toString('utf8'));
    } catch (e) {
        debug('%s caused an exception: %s', this._url, e);
        res.statusCode = 404;
        res.error = e;
    }

    res.request = this;
    res.json = function (encoding) {
        return safe.JSON.parse(this.getBody(encoding || 'utf8')); // getBody throws!
    };

    return res;
};
