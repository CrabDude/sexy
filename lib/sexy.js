/*
Copyright (c) 2010 Adam Crabtree <dude@noderiety.com>

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
*/

// Inspired by https://github.com/creationix/step
// and the conversation at http://groups.google.com/group/nodejs/browse_thread/thread/c334947643c80968
var EventEmitter = require('events').EventEmitter,
	Proxy = require('node-proxy'),
	Step = require('step'),
	misc = {
		debug: false,
		log: function () {
			if (misc.debug) {
				console.log.apply(console,arguments);
			}
		},
		bind: function (context, fn){ 
			return function(){
				context.that = this;
				misc.log('bind callback');
				return fn.apply(context, arguments); 
			}; 
		},
		extend: function (obj,source) {
			for (var key in source) {
				if (hasOwnProperty.call(source, key)) {
					obj[key] = source[key];
				}
			};
			return obj;
		}
	};

function Sexy(context, onError) {
	EventEmitter.call(this);
	this.super = EventEmitter;
	this.queue = [];
	this.context = this.origin = context;
	this.onError = typeof onError == 'function' ? onError : this.noop;
	this.callback = this.wrap(misc.bind(this,this.callback),false);
	this.previous = null;

	this.on('enqueue',this.enqueue);
	this.on('dequeue',this.dequeue);
	this.on('dequeueValue',this.dequeueValue);
	this.on('dequeueFn',this.dequeueFn);
	this.on('dequeueSync',this.dequeueSync);
}
Sexy.prototype = Object.create(EventEmitter.prototype, {
	constructor: {
		value: Sexy,
		enumerable: false
	}
});
Sexy.prototype = misc.extend(Sexy.prototype, {
	enqueue: function(value) {
		misc.log('enqueue',value);
		this.queue.push(value);
		this.previous = value[0] == 0 ? this.type.value: this.type.fn;
		
		if (this.queue.length == 1) {
			this.emit('dequeue');
		}
		misc.log('end enqueue');
	},
	dequeue: function() {
			misc.log('dequeue',this.queue[0]);
			if (!this.queue.length) {
				return;
			}
			switch(this.queue[0][0]) {
			case 0:
				this.emit('dequeueValue');
				break;
			case 1:
				this.emit('dequeueFn');
				break;
			case 2:
				this.emit('dequeueSync');
				break;
			}
		},
	dequeueValue: function() {
		var value = this.queue.shift()[1];
		misc.log('dequeueValue',this.context,value);
		this.pushContext(this.context[value]);
		this.emit('dequeue');
	},
	dequeueFn: function() {
		var self = this,
			args = Array.prototype.slice.call(this.queue[0][1]),
			length = args.length;
		misc.log('dequeueFn',args);
		if (typeof args[length-1] != 'function') {
			length = args.push(this.callback);
		}
		misc.log('calling Fn - ',typeof this.context, typeof this.parent,args);
		Step(function() {
			args[length-1] = misc.bind(this,args[length-1]);
			self.context.apply(self.parent,args);
		},function() {
			self.callback.apply({'waffles':true},arguments);
		}/*this.callback*/);
	},
	dequeueSync: function() {
		var self = this,
			args = Array.prototype.slice.call(this.queue[0][1]);
		misc.log('dequeueSync',args);
		if (args[0]) {
			args[0] = this.getStep0(args[0]);
		}
		for (var i=0,l=args.length; i<l; ++i) {
			args[i] = this.wrap(args[i],true);
		}
		args.push(this.callback);
		// need to wrap each function to intercept err argument and call onError
		Step.apply(null,args);
	},
	callback: function() {
		var context;
		
		switch (arguments.length) {
		case 0:
			context = this.origin;
			break;
		case 1:
			context = arguments[0];
			break;
		default:
			context = arguments;
			break;
		}
		if (this.that.waffles) {
			this.end = true;
		}
		this.pushContext(context);
		this.queue.shift();
		this.emit('dequeue');
	},
	pushContext: function(context) {
		misc.log('pushContext',this.context,arguments);
		this.parent = this.context;
		this.context = context;
	},
	getStep0: function(fn) {
		return (function(self) {
			return function() {
				var context = self.context;
				if (context.toString() != '[object Arguments]') {
					if (typeof self.context == 'function') {
						context = misc.bind(self.parent,self.context);	
					}
					context = [context];
				}
				return fn.apply(this,context);
			};
		})(this);
	},
	wrap: function(fn,shouldThrow,last) {
		misc.log('wrap',arguments);
		var self = this;
		return function() {
			misc.log('wrap callback',last,fn.toString(),arguments);
			var args = Array.prototype.slice.call(arguments),
				err = args[0];
			if (err && typeof err == 'object' && err.constructor === TypeError) {
				misc.log('ERROR!',err,shouldThrow,fn);
				this.err = err;
				if (shouldThrow) {
					throw err;
				} else {
					self.onError(err);	
				}
				return;
			}
			if (err == null || typeof err == 'undefined') {
				args.shift();
			}
			// fn might return instantly
			// fn WON'T take a callback
			// fn probably will use "this" as its callback
			return fn.apply(this,args);
		}
	},
	type: {
		value: 0,
		fn: 1
	},
	noop: function(){},
	undef: undefined
});
function SexyProxy(context,onError) {
	var self = this;
	if (!(self instanceof SexyProxy)) {
		misc.log('SexyProxy - Running constructor in Call');
		return new SexyProxy(context,onError);	
	} else {
		misc.log('SexyProxy - Constructing SexyProxy instance',context,onError);
	}
	
	self.sexy = new Sexy(context,onError);
	self.handler.get = function (rcvr,name) {
		misc.log('get',self.sexy.previous);
		if (['noop','undef'].indexOf(name) != -1) {
			return self.sexy[name];
		}
		self.sexy.enqueue([0,name]);
		return this;
	};
	
	misc.log('SexyProxy - Creating Proxy from: ',self.handler,self.sexy);
	self.proxy = Proxy.createFunction(self.handler,
		function () {
			misc.log('proxy call',self.sexy.previous);
			var args = arguments;
			if (typeof self.sexy.context != 'function' 
				|| (typeof args[0] == 'function' && self.sexy.previous != self.sexy.type.value)) {
				misc.log('proxy call - sync');
				self.sexy.enqueue([2,args]);
			} else {
				misc.log('proxy call - async');
				if (typeof args[0] == 'undefined' && typeof args[1] == 'function') {
					args = Array.prorototype.slice.call(args,1);
				}
				self.sexy.enqueue([1,args]);
			}
			return this;
		}
	);

	misc.log('SexyProxy - Returning Proxy object');
	return self.proxy;
}
SexyProxy.prototype = {
	handler: {
		delete: function() {},
		enumerate: function() {},
		fix: function() {}	
	}
}

//Hook into commonJS module systems
if (typeof module !== 'undefined' && "exports" in module) {
	module.exports = SexyProxy;
}