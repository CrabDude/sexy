var $xy = require('../lib/sexy'),
	fs = require('fs');

$xy(fs,function(e) {if (e) throw e;})
	.readdir(__dirname)
	.forEach(function(filename) {
		if (/\.js$/.test(filename)) {
			fs.readFile(__dirname + "/" + filename, 'utf8', this.parallel());
		}
	})
	(console.log);

/*
 * COMPARE WITH THE FOLLOWING EXAMPLES


Tim Caswell's (@creationix) Step: http://github.com/creationix/step

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
	}
);


Standard asynchronous callback-based Node.js

fs.readdir(__dirname, function(err, results) {
	if (err) throw err;
	function callback(err, file) {
		if (err) throw err;
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


