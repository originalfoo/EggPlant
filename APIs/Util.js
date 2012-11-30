// UTIL API
// https://warzone.atlassian.net/wiki/display/EGG/Util+API+Downloads
//
// Purpose:
// * Depdendency checking
// * Funciton manipulation
// * Bunch of useful global methods/properties
// * OOP Inheritance Model
//
// License:
// * CC-BY-SA 3.0: http://creativecommons.org/licenses/by-sa/3.0/
// * URL: https://warzone.atlassian.net/wiki/display/UtilJS
//
// /////////////////////////////////////////////////////////////////


void (function UtilAPI(_global) {

	// /////////////////////////////////////////////////////////////////
	// INTERNAL: SELF DESCRIPTOR OBJECT
	// https://warzone.atlassian.net/wiki/display/UtilJS/Self+Descriptor+Object
	
	var self = {
		file: "APIs/Util.js",
		ver : 1.1
	}

	// /////////////////////////////////////////////////////////////////
	// INTERNAL: MAKE PROPERTY
	// Builds a property descriptor and adds the property
	//
	// Derived from:
	//	https://developer.mozilla.org/en/JavaScript/Reference/Global_Objects/Object/defineProperty#Code_considerations
	//
	// Mask values:
	// 0  = accessor descriptor;		not configurable,	not enumerable	(0000)	ACCESSOR_HIDDEN
	// 1  = accessor descriptor;		not configurable,	enumerable		(0001)	ACCESSOR_NORMAL
	// 2  = accessor descriptor;		configurable,		not enumerable	(0010)	ACCESSOR_HIDDEN_CONFIG
	// 3  = accessor descriptor;		configurable,		enumerable		(0011)	ACCESSOR_NORMAL_CONFIG
	// 4  = readonly data descriptor;	not configurable,	not enumerable	(0100)	DATA_READONLY_HIDDEN
	// 5  = readonly data descriptor;	not configurable,	enumerable		(0101)	DATA_READONLY
	// 6  = readonly data descriptor;	configurable,		not enumerable	(0110)	DATA_READONLY_HIDDEN_CONFIG
	// 7  = readonly data descriptor;	configurable,		enumerable		(0111)	DATA_READONLY_CONFIG
	// 8  = writable data descriptor;	not configurable,	not enumerable	(1000)	DATA_HIDDEN
	// 9  = writable data descriptor;	not configurable,	enumerable		(1001)	DATA_NORMAL
	// 10 = writable data descriptor;	configurable,		not enumerable	(1010)	DATA_HIDDEN_CONFIG

	// reusable descriptor object
	var oDesc = {};
	
	// internal function to add a property
	function makeProp(nMask, oObj, sKey, vVal_fGet, fSet) {
	    if (nMask & 12) { // data property
	        (arguments.length > 3)
	        	? oDesc.value = vVal_fGet
	        	: delete oDesc.value;
	        oDesc.writable = Boolean(nMask & 8);
	        delete oDesc.get;
	        delete oDesc.set;
	    } else { // accessor property
	        (vVal_fGet)
	        	? oDesc.get = vVal_fGet
	        	: delete oDesc.get;
	        (fSet)
	        	? oDesc.set = fSet
	        	: delete oDesc.set;
	        delete oDesc.value;
	        delete oDesc.writable;
	    }
	    oDesc.enumerable = Boolean(nMask & 1);
	    oDesc.configurable = Boolean(nMask & 2);
	    return Object.defineProperty(oObj, sKey, oDesc);
	}

	// /////////////////////////////////////////////////////////////////
	// PUBLIC: PROPERTY DESCRIPTOR CONSTANTS
	// https://warzone.atlassian.net/wiki/pages/viewpage.action?pageId=2031634
	//
	// Derived from:
	//	https://developer.mozilla.org/en/JavaScript/Reference/Global_Objects/Object/defineProperty#Code_considerations

	// define names for mask constants (index in array = mask value)
	([
		"ACCESSOR_HIDDEN",
		"ACCESSOR_NORMAL",
		"ACCESSOR_HIDDEN_CONFIG",
		"ACCESSOR_NORMAL_CONFIG",
		"DATA_READONLY_HIDDEN",
		"DATA_READONLY",
		"DATA_READONLY_HIDDEN_CONFIG",
		"DATA_READONLY_CONFIG",
		"DATA_HIDDEN",
		"DATA_NORMAL",
		"DATA_HIDDEN_CONFIG"
	]).forEach(function(key, value) {
		makeProp(4, _global, key, value);
	});
	
	// /////////////////////////////////////////////////////////////////
	// PUBLIC: ALTERNATIVE TO TYPEOF OPERATOR
	// https://warzone.atlassian.net/wiki/pages/viewpage.action?pageId=2031629
	//
	// Derived from:
	//	http://javascriptweblog.wordpress.com/2011/08/08/fixing-the-javascript-typeof-operator/

	var toStr = Object.prototype.toString;

	makeProp(
		DATA_READONLY_HIDDEN,
		Object.prototype,
		"typeOf",
		function(obj) { // IF YOU UPDATE THIS FN, ALSO UPDATE IT'S COPY IN APIS/TEST.JS
			if (!arguments.length) obj = this;
			
			switch (obj) {
				case undefined: return "undefined";
				case null     : return "null";
				case _global  : return "global";
				default       : { // return actual type, unless NaN in which case "nan"
					var typ = toStr.call(obj).match(/\s([a-z|A-Z]+)/)[1].toLowerCase();
					return (typ == "number")
						? ( isNaN(obj) ? "nan" : typ )
						: typ;
				}
			}
		}
	);

	// /////////////////////////////////////////////////////////////////
	// PUBLIC: GET CONSTRUCTOR (CLASS) NAME
	// 

	makeProp(
		DATA_READONLY_HIDDEN,
		Object.prototype,
		"classOf",
		function(obj) {
			if (!arguments.length) obj = this;

			switch (obj) {
				case undefined: return "Undefined";
				case null     : return "Null";
				default       : { // get constructor name if possible, otherwise type
					var typ = toStr.call(obj).match(/\s([a-z|A-Z]+)/)[1];
					return ( obj.hasOwnProperty("__proto__") && obj.__proto__.hasOwnProperty("constructor") )
						? obj.__proto__.constructor.name || "<Anonymous>"
						: typ
				}
			}
		}
	);
		
	// /////////////////////////////////////////////////////////////////
	// PUBLIC: OUTPUT MESSAGE
	// https://warzone.atlassian.net/wiki/pages/viewpage.action?pageId=14811553

	// define output mode constants
	var outModes = ["CONSOLE", "DEBUG", "ERROR", "CHAT", "HOST", "RETURN"];

	// define out function
	var out = function out(message, oSelf, mode, config) {
		// make sure message is an array (or clone of passed in array)
		if (message.isArray) {
			message = message.slice(); // clone
		} else {
			message = [message]; // make array
		}
		
		// add self descriptor to message
		if (oSelf) message.unshift("["+oSelf.file+" v"+oSelf.ver+"]");
		
		if (!mode || outModes.indexOf(mode) == -1) {
			mode = out.DEFAULT; // will be either CONSOLE or HOST
		}
		
		switch (mode) {
			case out.DEBUG: {
				return debug.apply(_global, message);
			}
			case out.ERROR: {
				if (config) {
					throw new config(message.join("; "));
				} else {
					throw new Error(message.join("; "));
				}
			}
			case out.HOST: {
				config = 0; // player 0 = game host (in skirmish and mp games)
			}
			case out.CHAT: {
				if (typeof chat != "undefined") {
					if (config == null) config = ALLIES;
					message.reverse();
					message.forEach(function(str) {
						chat(config, str);
					});
					return true;
				}
				// default to out.CONSOLE (pre WZ 3.2)
			}
			case out.CONSOLE: {
				return console.apply(_global, message);
			}
			case out.RETURN: {
				return message;
			}
		}
	}

	// create out.* constants using the out function as a namespace
	outModes.forEach(function(mode) {
		makeProp(DATA_READONLY_HIDDEN, out, mode, mode);
	});
	// add the out.DEFAULT constant
	makeProp(DATA_READONLY_HIDDEN, out, "DEFAULT", (typeof chat == "undefined") ? out.CONSOLE : out.HOST);

	// publish out() function globally
	makeProp(DATA_READONLY_HIDDEN, _global, "out", out);

	// /////////////////////////////////////////////////////////////////
	// PUBLIC: ADD CONSTANT PROPERTY
	// https://warzone.atlassian.net/wiki/pages/viewpage.action?pageId=14811547

	makeProp(
		DATA_READONLY_HIDDEN,
		Object.prototype,
		"addConst",
		function addConst(key, value, visible) {
			if (this.hasOwnProperty(key) && !Object.getOwnPropertyDescriptor(this, key).configurable) {
				out(typeOf(this)+".addConst("+key+"): Key is not configurable.", self, out.ERROR, TypeError);
			}
			return makeProp((visible) ? DATA_READONLY : DATA_READONLY_HIDDEN, this, key, value);
		}
	);

	// /////////////////////////////////////////////////////////////////
	// PUBLIC: ADD ACCESSOR PROPERTY
	// https://warzone.atlassian.net/wiki/pages/viewpage.action?pageId=16023728

	Object.prototype.addConst(
		"addAccessor",
		function addAccessor(key, getter, setter, visible) {
			if (this.hasOwnProperty(key) && !Object.getOwnPropertyDescriptor(this, key).configurable) {
				out(typeOf(this)+".addAccessor("+key+"): Key is not configurable.", self, out.ERROR, TypeError);
			}
			return makeProp((visible) ? ACCESSOR_NORMAL : ACCESSOR_HIDDEN, this, key, getter, setter);
		}
	);

	// /////////////////////////////////////////////////////////////////
	// PUBLIC: ADD PROPERTY
	// https://warzone.atlassian.net/wiki/pages/viewpage.action?pageId=2031634
	//
	// Derived from:
	//	https://developer.mozilla.org/en/JavaScript/Reference/Global_Objects/Object/defineProperty#Code_considerations
	
	Object.prototype.addConst(
		"addProp",
		function addProp(mask, key, value_getter, setter) {
			if (this.hasOwnProperty(key) && !Object.getOwnPropertyDescriptor(this, key).configurable) {
				out(typeOf(this)+".addProp("+key+"): Key is not configurable.", self, out.ERROR, TypeError);
			}
			return makeProp(mask, this, key, value_getter, setter);
		}
	);

	// /////////////////////////////////////////////////////////////////
	// PUBLIC: ISFUNCTION PROPERTY
	// https://warzone.atlassian.net/wiki/display/EGG/object.isFunction
	
	if ( !Object.prototype.hasOwnProperty("isFunction") ) {
		Object.prototype.addConst("isFunction", false); // normal objects return false
		Function.prototype.addConst("isFunction", true); // functions return true
	}

	// /////////////////////////////////////////////////////////////////
	// PUBLIC: ISARRAY PROPERTY
	// https://warzone.atlassian.net/wiki/display/EGG/object.isArray
	
	if ( !Object.prototype.hasOwnProperty("isArray") ) {
		Object.prototype.addConst("isArray", false); // normal objects return false
		Array.prototype.addConst("isArray", true); // arrays return true
		Array.addConst("isArray", false); // because Array class is a Function!
	}

	// /////////////////////////////////////////////////////////////////
	// PUBLIC: QUICK OBJ CLONE
	// Returns new object with copy of enumerable keys & values (1 level deep) of source obj
	// Mainly used for diagnostic routines
	
	Object.addConst(
		"qiuckCopy",
		function quickCopy(obj) {
			var copy = {};
			Object.keys(obj).forEach(function(key) {
				copy[key] = obj[key];
			});
			return copy;
		}
	);

	// /////////////////////////////////////////////////////////////////
	// PUBLIC: CONVERT TO ARRAY
	// https://warzone.atlassian.net/wiki/pages/viewpage.action?pageId=16023893
	//
	// Derived from:
	//  https://developer.mozilla.org/en-US/docs/JavaScript/Reference/Functions_and_function_scope/arguments
	
	_global.addConst(
		"toArray",
		function toArray(obj) {
		    return Array.prototype.slice.call(obj);
		}
	);

	// /////////////////////////////////////////////////////////////////
	// PUBLIC: CALL SUPERCLASS METHOD/CONSTRUCTOR
	// https://warzone.atlassian.net/wiki/pages/viewpage.action?pageId=2031635
	//
	// Derived from:
	//	http://forums.wz2100.net/viewtopic.php?f=35&t=8801#p92879

	// name of proprety on 'this' that leads to next level of proto chain
	var sProto = "__proto__";

	// used to find a function in the proto chain
	var findKey = function findKey(proto, fn, keepDigging) {
		// somewhere to store name if we find it
		var found = false;
		
		// get all properties on current level of proto chain
		var keys = Object.getOwnPropertyNames(proto);
		
		// search this level of proto chain to see if we can find the fn
		keys.some(function(key) {
			// note: the property descriptor check is required to avoid calling getter functions on accessor properties
			if (Object.getOwnPropertyDescriptor(proto, key).hasOwnProperty("value") && proto[key] === fn) { // found it!
				found = {key:key, at:proto};
				return true; // will stop other keys being searched
			}
		});

		// if we didn't find it, keep digging?
		if (!found && keepDigging && sProto in proto) {
			return findKey(proto[sProto], fn, --keepDigging);
		}
		
		// otherwise return what we've found so far
		return found;
	}

	var findSuper = function findSuper(proto, key, keepDigging) {
		if (key in proto && proto[key].isFunction) { // found it!
			return proto[key];
		} else if (keepDigging && sProto in proto) {
			return findSuper(proto[sProto], key, --keepDigging);
		}
		return false;
	}

	Function.prototype.addConst("superFn", false); // so we don't have to keep checking if it's there
	
	var maxSuperDig = 4; // defualt proto chain depth to search for super()
	
	// this actually gets exposed during .inherit() later
	var superFunc = function() {
		// uhm, no proto chain - bail out!
		if (!(sProto in this)) {
			out(typeOf(this)+".super(): Reached end of prototype chain", self, out.ERROR);
		}

		// the fn that called super()
		var match = arguments.callee.caller;

		// quick win! (also deals with constructor scenario)
		if (match.superFn) return match.superFn.apply(this, arguments);
				
		// ok, we need to find match to get it's property name
		var result = findKey(this, match, maxSuperDig); // dig maxSuperDig levels deep on proto chain

		// if we found it, go look for superlcass method
		if (result) {
			if (!(sProto in result.at)) { // at end of proto chain
				out(typeOf(this)+".super(): Reached end of prototype chain", self, out.ERROR);
			}
			result = findSuper(result.at[sProto], result.key, maxSuperDig); // dig maxSuperDig levels deep on proto chain
		}

		if (result) { // found the superclass method!
			match.addConst("superFn", result); // cache what we found
			return result.apply(this, arguments);
		} else { // bail out
			out(typeOf(this)+".super(): No superclass method.", self, out.ERROR);
		}
	}

	// getter/setter functions for adding .super() accessor in inherit()

	var superGetter = function() {
		return superFunc;
	}
	var superSetter = function(value) {
		maxSuperDig = (typeOf(value) == "number") ? Math.max(value, 1) : 4;
	}

	// /////////////////////////////////////////////////////////////////
	// PUBLIC: SUPERCLASS INHERITANCE
	// https://warzone.atlassian.net/wiki/pages/viewpage.action?pageId=2031637
	//
	// Derived from:
	//	http://dmitrysoshnikov.com/ecmascript/chapter-7-2-oop-ecmascript-implementation/
	//	http://forums.wz2100.net/viewtopic.php?f=35&t=8801#p92879
	
	var construct = function() {}; // reusable constructor function
	
	Function.prototype.addConst(
		"inherit",
		function inherit(Superclass) {
			// get class constructor
			var Class = this.prototype.constructor;
			// error checks
			if (!Superclass.isFunction) {
				out("inherit(): Superclas must be a function", self, out.ERROR);
			}
			if (Class.superFn) {
				out("inherit(): Class has already inherited a superclass", self, out.ERROR);
			}
			if (Class == Function) {
				out("inherit(): Don't mess with the global Function object!", self, out.ERROR);
			}
			// create super() shortcut to superclass constructor
			Class.addConst("superFn", Superclass); // so we can use super() in class constructor (fn)
			// build new prototype that inherits superclass
			construct.prototype = Superclass.prototype; // construct defined above
			Class.prototype = new construct;
			Class.prototype.constructor = Class;
			// publish super() method to class prototype
			void Class.prototype.addAccessor(
				"super",
				superGetter,
				superSetter
			);			
			// return the class constructor
			return Class;
		}
	);

	// /////////////////////////////////////////////////////////////////
	// PUBLIC: FUNCTION WRAPPING
	// https://warzone.atlassian.net/wiki/pages/viewpage.action?pageId=2031625
	//
	// Derived from:
	//	http://javascriptweblog.wordpress.com/2010/04/14/compose-functions-as-building-blocks/
	
	Function.prototype.addConst(
		"wraps",
		function(inner) {
			var outer = this;
			return function() {
				outer.call(this, inner.apply(this, arguments));
			}
		}
	);

	// /////////////////////////////////////////////////////////////////
	// PUBLIC: FUNCTION CURRYING
	// https://warzone.atlassian.net/wiki/pages/viewpage.action?pageId=2031632
	//
	// Derived from:
	//  http://en.wikipedia.org/wiki/Currying
	//	http://javascriptweblog.wordpress.com/2010/04/05/curry-cooking-up-tastier-functions/
	
	Function.prototype.addConst(
		"curry",
		function() {
			if (arguments.length < 1) return this; //nothing to curry with - return function
			var fn = this;
			var args = _global.toArray(arguments);
			return function() {
				return fn.apply(this, args.concat(_global.toArray(arguments)));
			}
		}
	);

	// /////////////////////////////////////////////////////////////////
	// PUBLIC: RUN FUNCTION X TIMES
	// https://warzone.atlassian.net/wiki/pages/viewpage.action?pageId=16777353
	//
	// Inspired by:
	//	http://www.ruby-doc.org/core-1.9.3/Integer.html#method-i-times
	//	http://javascriptweblog.wordpress.com/2010/10/11/rethinking-javascript-for-loops/
	//	http://javascriptweblog.wordpress.com/2011/04/04/the-javascript-comma-operator/
	//	http://javascriptweblog.wordpress.com/2011/02/07/truth-equality-and-javascript/ -- NaN is falsey

	Number.prototype.addConst(
		"times",
		function(fn, context) {
			for( var i = Math.max(0, this.valueOf()), context = context || _global; i--; void fn.call(context, i) );
			return this;
		}
	)

	// /////////////////////////////////////////////////////////////////
	// PUBLIC: REFERENCE TO GLOBAL OBJECT
	// https://warzone.atlassian.net/wiki/display/UtilJS/global

	_global.addConst(
		"global",
		_global
	);

	// /////////////////////////////////////////////////////////////////
	// PUBLIC: REFERENCE TO NATIVE JS API PROPERTIES
	// https://warzone.atlassian.net/wiki/display/EGG/native

	_global.addConst(
		"Native",
		_global
	);

	// /////////////////////////////////////////////////////////////////
	// PUBLIC: GET CURRENT UNIVERSAL TIME IN MS
	// https://warzone.atlassian.net/wiki/display/UtilJS/now

	_global.addAccessor(
		"now",
		function() {
			return (new Date()).getTime();
		}
	);

	// /////////////////////////////////////////////////////////////////
	// INTERNAL: REPOSITORY OF APIS PROVIDED
	// Lists all files provided to the dependency checker via Check.provide()

	var APIs = {};

	// /////////////////////////////////////////////////////////////////
	// INTERNAL: DEPENDENCY CHECKING API
	// Will be published to global later
	// https://warzone.atlassian.net/wiki/pages/viewpage.action?pageId=16023581

	var Check = function Check(file, ver) {
		if (!file || !file.length) {
			out("Check(): Must supply a file name", self, out.ERROR);
		}
		if (file.isArray) {
			var result = true;
			file.some(function(name) {
				if (!Check.has(name, ver, Check.LAZY_LOAD)) { // found a missing dependency
					result = false;
					return true;
				}
			});
			return result;
		} else {
			return Check.has(file, ver, Check.LAZY_LOAD);
		}
	}

	// /////////////////////////////////////////////////////////////////
	// PUBLIC: AUTOLOAD PATH
	// https://warzone.atlassian.net/wiki/display/EGG/Check.paths
	
	var autoload = false;

	Check.addAccessor(
		"paths",
		function getter() {
			return autoload;
		},
		function setter(path) {
			if (!path || !path.length) {
				autoload = false;
			} else {
				autoload = ((path).isArray) ? path : [path];
			}
		}
	);

	// /////////////////////////////////////////////////////////////////
	// PUBLIC: DEPENDENCY CHECKER CONSTANTS
	// https://warzone.atlassian.net/wiki/display/EGG/Check.ANY_VERSION
	// https://warzone.atlassian.net/wiki/display/EGG/Check.LAZY_LOAD
	// https://warzone.atlassian.net/wiki/display/EGG/Check.NOT_LOADED

	Check.addConst("ANY_VERSION", true );
	Check.addConst("LAZY_LOAD"  , true );
	Check.addConst("NOT_LOADED" , false);

	// /////////////////////////////////////////////////////////////////
	// INTERNAL: VALIDATE SDO
	// Makes sure an SDO is valid

	var validateSDO = function validateSDO(sdo, fnName) {
		if (!sdo) {
			out("Check."+fnName+"(): Self Descriptor object missing", self, out.ERROR);
		}
		if (!sdo.hasOwnProperty("file")) {
			out("Check."+fnName+"(): File missing from Self Descriptor object", self, out.ERROR);
		}
		if (!sdo.hasOwnProperty("ver")) {
			out("Check."+fnName+"(): Version missing from Self Descriptor object", self, out.ERROR);
		}
		if (typeOf(sdo.ver) != "number") {
			out("Check."+fnName+"(): Invalid version in Self Descriptor object", self, out.ERROR);
		}
	}

	// /////////////////////////////////////////////////////////////////
	// PUBLIC: AUTOLOADING DEPENDENCY CHECK
	// https://warzone.atlassian.net/wiki/pages/viewpage.action?pageId=14811634
		
	var fromPaths = function(path) {
		if (Native.include(path+this.file) !== false) { // file loaded...
			return true;
		}
	}
	
	Check.addConst(
		"has",
		function has(file, ver, lazy) {
			if ( !arguments.length ) { // no args? send back obj listing all libraries
				return Object.quickCopy( APIs );
			} else { // check dependency
				// check file not loaded?
				if ( ver === Check.NOT_LOADED ) return !APIs.hasOwnProperty( file );
				// check file is loaded?
				if ( !APIs.hasOwnProperty(file) ) { // file not loaded
					if ( lazy || !autoload ) return false; // autoloading disabled
					if ( !autoload.some(fromPaths, {file:file}) || !APIs.hasOwnProperty(file) ) {
						return false; // autoloading was not successful or loaded file didn't resolve dependency
					}
				}
				// what version is required?
				return (ver === Check.ANY_VERSION || ver == null || ver == APIs[file]);
			}
		}
	);

	// /////////////////////////////////////////////////////////////////
	// PUBLIC: WHAT VERSION IS AVAILABLE?
	// https://warzone.atlassian.net/wiki/pages/viewpage.action?pageId=16023600
	
	Check.addConst(
		"versionOf",
		function versionOf(file) {
			if (!APIs.hasOwnProperty(file)) return Check.NOT_LOADED;
			return APIs[file];
		}
	);
	
	// /////////////////////////////////////////////////////////////////
	// PUBLIC: ERROR THROWING DEPENDENCY CHECK
	// https://warzone.atlassian.net/wiki/pages/viewpage.action?pageId=14811614
		
	Check.addConst(
		"required",
		function required(dependencies, oSelf) {
			validateSDO(oSelf, "required");
			if (Check.has(oSelf.file, Check.ANY_VERSION, Check.LAZY_LOAD)) { // can't include it twice!
				out(["File already included! Included so far..."].concat(Object.keys(APIs)), oSelf, out.ERROR);
			}
			var ver;
			Object.keys(dependencies).forEach(function(file) {
				ver = dependencies[file];
				if (!Check.has(file, ver)) { // failed dependency check
					if (ver === Check.NOT_LOADED) { // {"foo.js": false} = must not have foo.js
						out("Must be included prior to "+file, oSelf, out.ERROR);
					} else if (ver === Check.ANY_VERSION) { // {"foo.js": true} = must have any version
						out("Requires "+file+" (any version)", oSelf, out.ERROR);
					} else { // {"foo.js": 1.3} = must have specific version
						out("Requires "+file+" v"+ver, oSelf, out.ERROR);
					}
				}
			});
			return true;
		}
	);

	// /////////////////////////////////////////////////////////////////
	// PUBLIC: DO TASK WHEN DEPENDENCIES MET
	// https://warzone.atlassian.net/wiki/pages/viewpage.action?pageId=16023609

	var doLater = []; // deferred tasks
	var doNever = []; // tasks that were blocked

	Check.addConst(
		"doWhen",
		function doWhen(dependencies, oSelf, task, lazy) {
/*
			if (!arguments.length) return doNever.slice(); // used by Util.diag.js
			validateSDO(oSelf, "doWhen");
			if (!dependencies) {
				out("Check.doWhen(): Must specify dependency descriptor object", oSelf, out.ERROR);
			}
			if (typeOf(task) == "string") { // want to load a file when dependencies met
				dependencies[task] = Check.NOT_LOADED; // if file already loaded, don't try again
				dependencies[oSelf.file] = Check.ANY_VERSION; // make sure API submitting task is loaded
				task = Check.has.curry(task, Check.ANY_VERSION); // create task function to load the file
			} else if (!task.isFunction) {
				out("Check.doWhen(): Task must be a function, or a string (file to load)", oSelf, out.ERROR);
			}
			// filter out any dependencies already provided
			var ver;
			var block = {};
			Object.keys(dependencies).forEach(function(file) {
				ver = dependencies[file];
				if (Check.has(file, ver, lazy)) {
					delete dependencies[file]; // dependency already loaded
					if (ver === Check.NOT_LOADED) block[file] = ver; // separate out to block list
				} else if (ver === Check.NOT_LOADED) { // we're already blocked
					out("Check.doWhen(): Must be included prior to "+file, oSelf, out.ERROR);
				}
			});
			// anything left?
			if (Object.keys(dependencies).length) { // outstanding dependencies, do later in Check.provide()
				doLater.push({run: task, self: oSelf, dependencies: dependencies, block: block});
			} else { // all dependencies already met, do now
				task.call(_global);
				return true;
			}
			return false;			
*/
		}
	);

	// /////////////////////////////////////////////////////////////////
	// PUBLIC: MARK DEPENDENCY AS AVAILABLE
	// https://warzone.atlassian.net/wiki/pages/viewpage.action?pageId=14811618
	
	var doNow = []; // list of tasks enabled by a Check.provide() invocation
	
	Check.addConst(
		"provide",
		function provide(oSelf) {
			validateSDO(oSelf, "provide");
			// make sure this file isn't already provided
			if (oSelf.file in APIs) {
				out("Check.provide(): Library '"+oSelf.file+"' already provided", self, out.ERROR);
			}
			// mark file as provided
			APIs[oSelf.file] = oSelf.ver;
			// did we enable or block any doLater[] tasks?
			doLater.forEach(function(task, i) {
				if (oSelf.file in task.block) { // the task was blocked by this provide()
					task.blockedBy = oSelf.file+" blocked the task";
					doNever.push(doLater.splice(i, 1)); // move from doLater[] to doNever[]
				} else if (oSelf.file in task.dependencies) { // the task depends on this provide()
					if (Check.has(oSelf.file, task.dependencies[oSelf.file], Check.LAZY_LOAD)) { // dependency met
						// remove dependency from list
						delete task.dependencies[oSelf.file];
						// can the task be run now?
						if (!Object.keys(task.dependencies).length) { // all dependencies met
							doNow.push(doLater.splice(i, 1)); // move from doLater[] to doNow[]
						}
					} else { // loaded, but wrong version
						task.blockedBy = oSelf.file+" wrong version: v"+oSelf.ver;
						doNever.push(doLater.splice(i, 1)); // move from doLater[] to doNever[]
					}
				}
			});
			// perform any tasks that were enbled by this provide() call...
			// do this here, rather than loop above, because the tasks might load additional files
			// which in turn might trigger other dependencies, which might enable different tasks on the list
			// which would mean the list would change (splices) in a separate invocation of Check.provide()
			// which would cause desynchs of the list that we were processing above
			// which would lead to us splicing the wrong elements from the list. phew!
			while (doNow.length) {
				task = doNow.shift(); // get first task to doNow
				try {
					task.run.call(_global); // run task
				} catch(e) {
					task.blockedBy = e.message;
					doNever.push(task); // mark it as blocked if there is an error
				}
			}
			return true;
		}
	);

	// /////////////////////////////////////////////////////////////////
	// PUBLIC: PUBLISH DEPENDENCY CHECKER
	// https://warzone.atlassian.net/wiki/pages/viewpage.action?pageId=16023581

	_global.addConst("Check", Check);

	// /////////////////////////////////////////////////////////////////
	// UNIT TESTS
	// https://warzone.atlassian.net/wiki/display/EGG/Test+API
/*
	Check.doWhen(
		{"Test.js": Check.ANY_VERSION},
		self,
		"Tests/APIs/Util.js",
		Check.LAZY_LOAD
	);
*/

	// /////////////////////////////////////////////////////////////////
	// DIANOSTIC ROUTINES
	// https://warzone.atlassian.net/wiki/display/EGG/Diag+API
/*
	Check.doWhen(
		{"Diag.js": Check.ANY_VERSION},
		self,
		"Diags/Util.js",
		Check.LAZY_LOAD
	);
*/
	// /////////////////////////////////////////////////////////////////
	// PUBLIC: MARK UTIL API AS AVAILABLE
	// https://warzone.atlassian.net/wiki/display/EGG/Dependency+Checking

	Check.provide(self);
	
})(this);