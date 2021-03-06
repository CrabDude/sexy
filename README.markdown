# Sexy
### Sexy makes your code sexy.

A control-flow library for writing sequential asynchronous code in a synchronous style format.

Utilizes:

* [ECMAScript5 Proxies](http://wiki.ecmascript.org/doku.php?id=harmony:proxies)
* Tim Caswell's [Step](http://github.com/creationix/step)

## Alpha Alert

This is an alpha release of Sexy. Please submit all bugs to <http://github.com/CrabDude/sexy/issues>.  

## How to install

	npm install sexy

Or copy or link the lib/sexy.js file into your `$HOME/.node_libraries` folder.

## How to use

Sexy utilizes ECMAScript 5 Proxies to allow nested asynchronous code to be written in a synchronous style format.

Sexy exports a single function I call `$xy`. `$xy()` initializes a sequence and takes 2 arguments: `initialObject` and `onError`.

	$xy(fs,function(e) {if (e) throw e;});
	
The resulting $xy instance can then be used to write asynchronous code in a synchronous format. Callbacks are handled automatically with the results from the previous step passed to the next:

	$xy(fs).readdir(__dirname)(function(filenames) {
		// do something with results
	});
	
Or the results can be acted upon directly in a pseudo-synchronous manner:

	$xy(fs).readdir(__dirname).forEach(function(filename) {
		console.log(filename);
	});
	
Any errors generated by the sequence will be passed to `onError`.

	$xy(fs,function(e) {
			// log error
			console.log('ERROR');
			if (e) throw e;
		}).readdir(__dirname)(function(filenames) {
			console.log(DOES.NOT.EXIST);
		});

Sexy wraps Step for its callbacks. As a result, the following Step APIs can be utilized in Sexy callbacks: `this`, `this.parallel` and `return value;` (`this.group` is currently not supported). Please refer to the Step README for the Step [documentation](http://github.com/creationix/step). 
Here is an example that outputs the contents of all `.js` files in a directory:

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

Step equivalent:

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

AN ATTEMPT at the standard Node.js equivalent:

	// This could certainly be written better
	// Controlling flow without the help of a flow-control library like Step can quickly become cumbersome

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

Because Sexy overrides the original bindings for `this`, you can access the original value at `this.that`, though support for `this.that` is currently limited:

	$xy({
		helloWorld: function(cb) {
			console.log('hello world!');
			cb.call(this);
		}
	}).helloWorld(function() {
		// Yes, this is somewhat contrived
		console.log(this.that);
	});

To execute an anonymous function during a sequence, you can invoke a function call on ANY NON-FUNCTION value and pass a callback as the first parameter:

	$xy(fs,function(e) {if (e) throw e;})
		...
		(console.log)
		(function() {console.log('hello world');});
		

However, if the previous invocation returns a function and needs a function passed as the first parameter (e.g., a callback), you must pass `undefined` or the `$xy.undef` convenience value as the first argument. Otherwise the passed function will be called sequentially:

	var objectX = {
		returnArbitraryFunction: function () {
			// do something fancy
			return function() {
				console.log('arbitrary function');
			};
		}
	}
	
	$xy(objectX).returnArbitraryFunction()(function() {
		// this will be SEQUENTIAL
	});

	$xy(objectX).returnArbitraryFunction()($xy.undef,function() {
		// this WILL call objectX.returnArbitraryFunction()()
	});


## API Gray Areas & Ambiguity

Obviously there are some VERY gray areas in the API. However, I am confident that these can be matured and resolved in future versions. Below is just a highlight of the current API ambiguities and/or shortcomings.

* Default sequential callback behavior and overriding the default
* Functions returned from an invocation require $xy.undef
* Non-sequential asynchronous callbacks can create ambigous or breaking behavior:

		// This will FAIL as the callback never gets called and thus ".listen" is never executed.
		$xy(http).createServer(function (request, response) {
			// This will only 
			response.writeHead(200, {'Content-Type': 'text/plain'});
			response.end('Hello World\n');
		}).listen(8124)

* Multiple asynchronous callbacks invocations will break as Sexy will never know when the final callback has been invoked and can thus proceed to the next step in the sequence. 

Please submit API recommendations as a feature request to <http://github.com/CrabDude/sexy/issues>.
