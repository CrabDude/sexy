var $xy = require('../lib/sexy'),
	http = require('http');

$xy(http).createServer(function (request, response) {
	response.writeHead(200, {'Content-Type': 'text/plain'});
	response.end('Hello World\n');
}).listen(8124);