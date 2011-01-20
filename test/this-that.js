var $xy = require('../lib/sexy'),
	fs = require('fs'),
	
$xy({
	helloWorld: function(cb) {
		console.log('hello world!');
		cb.call(this);
	}
}).helloWorld(function() {
	// Yes, this is somewhat contrived
	console.log(this.that);
});