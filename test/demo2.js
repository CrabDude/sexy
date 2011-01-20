var $xy = require('../lib/sexy'),
	fs = require('fs');

$xy(fs,function(e) {
		console.log('ERROR');
		if (e) throw e;
	}).readdir(__dirname)(function(filenames) {
		console.log(SERIOUSLY.DOESNOTEXIST);
	});