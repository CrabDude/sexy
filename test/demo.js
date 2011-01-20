var $xy = require('../lib/sexy'),
	fs = require('fs'),
	util = require('util');

var proxy = $xy(fs,function(e) {
	console.log('ERROR! ERROR! ERROR! ERROR! ERROR!');
	if (e) throw e;
}).readdir(__dirname)(function(files) {
	console.log(files);
	return files;
}).forEach(function(filename) {
//	var self = this.that; <-- Available, but no meaning in Array.prototype.forEach
	if (/\.js$/.test(filename)) {
		fs.readFile(__dirname + "/" + filename, 'utf8', this.parallel());
	}
})(function() {
	util.puts(util.inspect(arguments));
	return 'hello world';
})(function(helloWorld) {
	console.log(helloWorld);
});