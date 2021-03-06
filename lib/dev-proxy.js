var path = require('path');
var url = require('url');
var httpProxy = require('http-proxy');
var messages = require('./messages');

/**
 *
 * @param {String} host
 * @param {Array} ports
 * @param {Object} options
 */
module.exports = function (host, ports, options) {

    var proxyOptions = options.proxy || options.website;

    var getSnippet = function (hostIp, socketIoPort, scriptPort) {
        return messages.scriptTags(hostIp, socketIoPort, scriptPort);
    };

    //
    // Set up a proxy
    //
    httpProxy.createServer(function (req, res, proxy) {

        //
        // Put your custom server logic here
        //
        var next = function () {
            proxy.proxyRequest(req, res, {
                host: proxyOptions.host,
                port: proxyOptions.port || 80,
                changeOrigin: true
            });
        };

        var write = res.write;

        res.write = function (string, encoding) {

            var body = string instanceof Buffer ? string.toString() : string;

            // Is it not html
            if (!/<!doctype[^>]*>/i.test(body)) {
                return write.call(res, string, encoding);
            }

            // Try to inject script
            body = body.replace(/<\/body>/, function (w) {
                return messages.scriptTags(host, ports[0], ports[1]) + w;
            });

            if (string instanceof Buffer) {
                string = new Buffer(body);
            } else {
                string = body;
            }

            if (!this.headerSent) {
                this.setHeader('content-length', Buffer.byteLength(body));
                this._implicitHeader();
            }

            write.call(res, string, encoding);
        };

        next();

    }).listen(ports[2]);
};