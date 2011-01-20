# Step

A simple control-flow library for node.JS that makes parallel execution, serial execution, and error handling painless.

## How to install

Simply copy or link the lib/step.js file into your `$HOME/.node_libraries` folder.

## How to use

The step library exports a single function I call `Step`.  It accepts any number of functions as arguments and runs them in serial order using the passed in `this` context as the callback to the next step.

    Step(
      function readSelf() {
        fs.readFile(__filename, this);
      },
      function capitalize(err, text) {
        if (err) throw err;
        return text.toUpperCase();
      },
      function showIt(err, newText) {
        if (err) throw err;
        console.log(newText);
      }
    );

Notice that we pass in `this` as the callback to `fs.readFile`.  When the file read completes, step will send the result as the arguments to the next function in the chain.  Then in the `capitalize` function we're doing synchronous work so we can simple return the new value and Step will route it as if we called the callback.

The first parameter is reserved for errors since this is the node standard.  Also any exceptions thrown are caught and passed as the first argument to the next function.  As long as you don't nest callback functions inline your main functions this prevents there from ever being any uncaught exceptions.  This is very important for long running node.JS servers since a single uncaught exception can bring the whole server down.

Also there is support for parallel actions:

    Step(
      // Loads two files in parallel
      function loadStuff() {
        fs.readFile(__filename, this.parallel());
        fs.readFile("/etc/passwd", this.parallel());
      },
      // Show the result when done
      function showStuff(err, code, users) {
        if (err) throw err;
        sys.puts(code);
        sys.puts(users);
      }
    )

Here we pass `this.parallel()` instead of `this` as the callback.  It internally keeps track of the number of callbacks issued and preserves their order then giving the result to the next step after all have finished.  If there is an error in any of the parallel actions, it will be passed as the first argument to the next step.

Also you can use group with a dynamic number of common tasks.

    Step(
      function readDir() {
        fs.readdir(__dirname, this);
      },
      function readFiles(err, results) {
        if (err) throw err;
        // Create a new group
        var group = this.group();
        results.forEach(function (filename) {
          if (/\.js$/.test(filename)) {
            fs.readFile(__dirname + "/" + filename, 'utf8', group());
          }
        });
      },
      function showAll(err , files) {
        if (err) throw err;
        sys.p(files);
      }
    );

*Note* that we both call `this.group()` and `group()`.  The first reserves a slot in the parameters of the next step, then calling `group()` generates the individual callbacks and increments the internal counter.

















# Ship

Ship lets you write less callbacks.

## Introduction 

The convention in node.js is that an asynchronous library function takes a callback as its last parameter.
When it finishes, it invokes this callback - the first parameter is the error, and the rest are the data.

This is powerful:
    fs.readFile('/etc/passwd', function(err, data) {
    	if(err) throw err;
    	console.log(data);
    });

But quickly becomes verbose and tangled:
    fs.readFile('/etc/passwd', function(err, data) [
    	if(err) throw err;
    	fs.writeFile('/etc/passwd.bak', data, function(err) {
    		if(err throw err);
    		console.log("It's saved");
    	}
    }

What about this:
    var pfs = ship(fs);
    pfs.writeFile('/etc/passwd.bak', pfs.readFile('/etc/passwd'));
    pfs.end(function(err) { 
    	if(err) throw err; 
    	console.log("It's saved");
    });

Another example: method chaining.

Before:
    var thing = new Thing();
    thing.asyncOne(function(err, data) {
    	if(err) throw err;
    	data.asyncTwo(function(err, result) {
    		if(err) throw err;
    		console.log("Success: "+result);
    	}
    }

After:
    var pthing = ship(new Thing());
    thing.asyncOne().asyncTwo().end(function(err, result) {
    	if(err) throw err;
    	console.log("Success: result");
    });

## How it works

The things returned by ship, and subsequent method calls, are basically promises. 

Things will be done to the actual objects in the same order as you do things to the promises.

If a function invoked on a promise takes another promise as a parameter, the value will be passed instead.

## API

### ship(obj)

Returns: a promise for obj

### promise.foo(args...)

Adds promise.foo(args...) to the queue as an asynchronous call. Args can be promises (from the same queue), or any other values.

The actual call made will be &lt;promise>.foo(&lt;args...>, cb) where &lt;promise> is the value of promise, &lt;args> is args with all promises evaluated, and cb is a node-style callback.

If &lt;promise>.foo is defined but is not a function, it will be treated as a simple accessor that returns that value.

If you pass an error to cb, further execution will be skipped and the error will be handled.

Returns: a promise for the first return value (i.e. the second argument passed to cb).

### promise.foo$(args...)

Adds promise.foo(args...) to the queue as a synchronous call. Args can be promises (from the same queue), or any other values.

The actual call made will be &lt;promise>.foo(&lt;args...>) where &lt;promise> is the value of promise, and &lt;args> is args with all promises evaluated.

If &lt;promise>.foo is defined but is not a function, it will be treated as a simple accessor that returns that value.

If the function throws an error, further execution will be skipped and the error will be handled.

Returns: a promise for the return value of the call.

### promise.deliver(func)

Registers a listener, when the value(s) for the promise is available, func will be called with the values as arguments.

Func will not be called if the promise doesn't get a value because an earlier invocation raises an error.

Returns: promise (for chaining)

### promise.end(cb)

Starts the queue. This must only be done once per queue (i.e per call to ship()).

Upon completion, cb will be called. If there was an error, it will be the first argument. 
Otherwise the first argument is null, and the second argument is the value of this promise.

Returns: undefined.

## Limitations

This works: 
    var pthing = ship(new Thing());
    var derivedValue = pthing.getValue();
    pthing.doSomething(derivedValue); // passes the actual value, not the promise

This can never work:
    console.log(derivedValue); // passes the promise

This doesn't either, but maybe one day:
    var pconsole = ship(console); // each call to ship() creates an independent queue
    pconsole.log(derivedValue);    // you can't mix promises from different queues
