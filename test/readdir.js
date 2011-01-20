var $xy = require('../lib/sexy'),
	fs = require('fs');

Sexy code:

$xy(fs,function(e) {if (e) throw e;})
	.readdir(__dirname)
	.forEach(function(filename) {
		if (/\.js$/.test(filename)) {
			fs.readFile(__dirname + "/" + filename, 'utf8', this.parallel());
		}
	})
	(console.log)
	(function() {console.log('hello world');});

// Step equivalent:

/*
Step(
	function readdir() {
		fs.readdir(__dirname, this);
	},
	function readFiles(err, results) {
		if (err) throw err;
		results.forEach(function (filename) {
			if (/\.js$/.test(filename)) {
				fs.readFile(__dirname + "/" + filename, 'utf8', this.parallel());
			}
		});
	},
	function showAll(err , file1, file2, file3) {
		if (err) throw err;
		console.log(arguments);
	},
	function() {
		if (err) throw err;
		console.log('hello world');
	}
);
*/

// AN ATTEMPT at the standard Node.js equivalent:

// This could certainly be written better
// Controlling flow without the help of a flow-control library like Step can quickly become cumbersome

/*
fs.readdir(__dirname, function(err, results) {
	if (err) throw err;
	function callback(err, file) {
		if (err) throw err;
		function callback2() {
			if (err) throw err;
			console.log('hello world');
		}
		files.push(file);
		if (++counter != total) {
			return;
		}
		console.log(files);
	}
	var files = [], counter = 0, total = 0;
	results.forEach(function (filename) {
		if (/\.js$/.test(filename)) {
			total++;
			fs.readFile(__dirname + "/" + filename, 'utf8', this.parallel());
		}
	});
});
*/