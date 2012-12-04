// TEST API
//
// Purpose:
// * QUnit-esque unit testing framework
//
// Inspired by:
// * http://api.qunitjs.com/
//
// License:
// * CC-BY-SA 3.0: http://creativecommons.org/licenses/by-sa/3.0/
// * URL: https://warzone.atlassian.net/wiki/display/EGG/Test+API
//
// /////////////////////////////////////////////////////////////////

void (function TestAPI(_global) {

	var self = {
		file: "APIs/Test.js",
		ver : 1.5
	};

	var CheckAvailable = _global.hasOwnProperty("Check"); // is dependency checker installed?

	if (CheckAvailable) {
	
		var dependencies = {
			"APIs/Util.js": Check.ANY_VERSION
		}
		
		Check.required(dependencies, self);
	}

	// /////////////////////////////////////////////////////////////////
	// CONFIG - OUTPUT METHODS
	// Tests the Test API! Note: Will always generate some failed results.

	if (CheckAvailable) {
		Check.doWhen(
			{}, self,
			"Config/Test.basicOutput.js", // summary, console, debug, host, log
			Check.LAZY_LOAD
		);
/*
		Check.doWhen(
			{}, self,
			"Config/Test.htmlOutput.js", // html
			Check.LAZY_LOAD
		);
*/
	}

	// /////////////////////////////////////////////////////////////////
	// CONFIG - ONFINISH EVENT HANDLER
	// Determines what happens when testing finishes

	if (CheckAvailable) {
		Check.doWhen(
			{}, self,
			"Config/Test.events.js", // Test.outputTo("console")
			Check.LAZY_LOAD
		);
	}

	// /////////////////////////////////////////////////////////////////
	// DIANOSTIC ROUTINES
	// https://warzone.atlassian.net/wiki/display/EGG/Test+API+Diagnostics
/*	
	if (CheckAvailable) {
		Check.doWhen(
			{"APIs/Diag.js": Check.ANY_VERSION}, self,
			"Diags/Test.js",
			Check.LAZY_LOAD
		);
	}
*/
	// /////////////////////////////////////////////////////////////////
	// TEST ROUTINES
	// Tests the Test API! Note: Will always generate some failed results.
	
	if (CheckAvailable) {
		Check.doWhen(
			{}, self,
			"Tests/APIs/Test.js",
			Check.LAZY_LOAD
		);
	}

	// /////////////////////////////////////////////////////////////////
	// INTERNAL: CONSTANTS
	// Can't define const in a function in current WZ JS env, hence vars :s

	// makes unitTestResult() treat the result as a non-state-affecting comment
	var COMMENT   = true;
	
	// following are used by deepEq() and similar()
	var DIFFERENT = function( message ) {
		// use this either as a simple constant, eg: return DIFFERENT;
		// or a a function call that will add a comment to current test
		// eg. return DIFFERENT("hello world");
		unitTestResult.call(currentTest, false, null, null, message, "DIFFERENCE", COMMENT);
		return true;
	}
	var SAME      = false;

	var FAILED    = false;
	var PASSED    = true;
	
	// /////////////////////////////////////////////////////////////////
	// INTERNAL: TEST MANAGEMENT VARS
	// List of all test, which test is next, timer state, etc.

	var tests = [];

	tests.next = null;

	var currentTest = null; // current UnitTest *instance*

	var modules = [];
	
	var currentModule; // *name* of current module, change with Test.module()
	
	var scheduleActive = false;
	
	// /////////////////////////////////////////////////////////////////
	// INTERNAL: ADD CONSTANT
	// Used to create read-only, non-enumerable data property
	
	var oDesc = {writable: false, enumerable: false, configurable: false};
	
	function makeConst(obj, key, value) {
		oDesc.value = value;
	    Object.defineProperty(obj, key, oDesc);
	}

	// /////////////////////////////////////////////////////////////////
	// INTERNAL: SIGNAL HELPERS
	// Used by signal classes (see later)

	var construct = function() {}; // re-usable constructor for inheritance

	var inheritError = function(Signal) {
		construct.prototype = Error.prototype;
		Signal.prototype = new construct;
		Signal.prototype.constructor = Signal;
	}
	
	var instantiateSignal = function(message, name, signal) { // scoped to signal instance
		makeConst(this, "message", message);
		makeConst(this, "name"   , name   );
		makeConst(this, "signal" , signal );
	}

	// /////////////////////////////////////////////////////////////////
	// INTERNAL: ABORT SIGNAL
	// Based on Error, used to abort a test (setting test.pased = false)

	var AbortSignal = function AbortSignal(message) {
		instantiateSignal.call(this, message, "AbortSignal", "ABORT");
	}
	inheritError(AbortSignal);

	// /////////////////////////////////////////////////////////////////
	// INTERNAL: FINISH SIGNAL
	// Based on Error, used to finish a test (does not affect test.passed)

	var FinishSignal = function FinishSignal(message) {
		instantiateSignal.call(this, message, "FinishSignal", "FINISH");
	}
	inheritError(FinishSignal);

	// /////////////////////////////////////////////////////////////////
	// INTERNAL: REQUIRE SIGNAL
	// Based on Error, used to abort test due to requirements failure (marks test as failed in process)

	var RequireSignal = function RequireSignal(message) {
		instantiateSignal.call(this, message, "RequireSignal", "REQUIRE");
	}
	inheritError(RequireSignal);

	// /////////////////////////////////////////////////////////////////
	// INTERNAL: PROPERTY VALUE OR DEFAULT
	// Returns value of property if found, otherwise default value

	var hasOr = function(obj, prop, def) {
		return obj.hasOwnProperty(prop)
				? obj[prop]
				: def;
	};

	// /////////////////////////////////////////////////////////////////
	// INTERNAL: TYPEOF
	// Simplified version of typeOf() in case Util API not installed

	var toStr = Object.prototype.toString;

	var typeOf = ( _global.hasOwnProperty("typeOf") )
		? _global.typeOf
		: function(obj) {
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
		  };
		  
	// /////////////////////////////////////////////////////////////////
	// INTERNAL: COMPARE REGEXP
	// Is regexp A same as regexp B?
	
	var compareRegexp = function(a, b) {
		return ( typeOf(a[key])       ==  typeOf(b[key])
				 && a[key].source     === b[key].source
				 && a[key].global     === b[key].global
				 && a[key].ignoreCase === b[key].ignoreCase
				 && a[key].multiline  === b[key].multiline
				 && a[key].sticky     === b[key].sticky     );
	}

	// /////////////////////////////////////////////////////////////////
	// INTERNAL: DEEP EQUALITY CHECK
	// Check equality througout nested object structure
	// Much more basic than the QUnit equiv() counterpart

	var visted;
	
	var deepEq = function(actual, expected, depth) {
		if ( !depth ) {
			// init list of places we don't want to visit
			visited = [
				Object.prototype,
				Array.prototype,
				Date.prototype,
				Boolean.prototype,
				String.prototype,
				Number.prototype,
				Function.prototype,
				Error.prototype,
				_global,
				expected
			];
		} else {
			visited.unshift(actual); // add to list of places not to visit again (avoid circular references)
		}
		
		var depth = ( depth || 0 ) + 1;
		
		var expecting = Object.getOwnPropertyNames(expected);
		
		// bail if a and b have different numbers of properties
		var actualKeys = Object.getOwnPropertyNames(actual);
		if ( actualKeys.length != expecting.length ) {
			DIFFERENT("Expected "+expecting.length+": "+expecting);
			DIFFERENT("Actual "+actualKeys.length+": "+actualKeys);
			return FAILED;
		}
				
		if ( !expecting.some(function difference(key) {
			// bail if expected key not actually there
			if ( !actual.hasOwnProperty(key) ) return DIFFERENT("Property missing: "+key);
			// bail if actual type not same as expected type
			if ( typeOf(actual[key]) != typeOf(expected[key]) ) return DIFFERENT("Unexpected type: "+typeOf(actual[key]));
			// is actual value same as expected value?
			switch ( typeOf(expected[key]) ) {
				case "array": {
					if ( actual[key].length != expected[key].length ) return DIFFERENT("Unexpected array length: "+actual[key].length);
					// otherwise, go digging as if it were an object...
				}
				case "object": {
					// bail if already visited this actual object
					return ( depth >= 9 || visited.some(function(place){return place === actual[key]}) )
						? SAME // don't bother digging any deeper
						: ( deepEq(expected[key], actual[key], depth)
							? SAME
							: DIFFERENT("Nested array or object did not match") );
				}
				case "regexp": {
					return ( compareRegexp(actual[key], expected[key]) )
						? SAME
						: DIFFERENT("Regular expression did not match");
				}
				// this won't deal with NaN but not worried about that (should I be?)
				default: {
					return ( actual[key] === expected[key] )
						? SAME
						: DIFFERENT("Values did not match ("+actual[key]+" !== "+expected[key]+")");
				}
			}
		}) ) { // actual == expected
			if (depth==1) visited = null; // free up RAM
			return PASSED;
		} else { // actual != expected
			if (depth==1) visited = null; // free up RAM
			return FAILED;
		}
	}

	// /////////////////////////////////////////////////////////////////
	// INTERNAL: DEEP SIMILARITY CHECK
	// Do enumerable properties in a exist in b, and optionally have same value?
	// Much faster than deepEq

	var similar = function(actual, expected, depth) {
		var depth = (depth || 0) + 1;
		var expecting = Object.keys(expected);
		
		if ( !expecting.some(function difference(key) {
			
			if ( !actual.hasOwnProperty(key) ) {
				return ( expected[key] === Test.NOT_FOUND )
					? SAME
					: DIFFERENT;
			} else {
				// is actual value same as expected value?
				switch ( typeOf(expected[key]) ) {
					case "null": {
						return SAME;
					}
					case "undefined": {
						return DIFFERENT;
					}
					case "array":
					case "object": { // go digging
						return ( depth >= 9 )
							? SAME // don't bother digging any deeper
							: ( similar(actual[key], expected[key], depth)
								? SAME
								: DIFFERENT );
					}
					case "nan": {
						return ( isNaN(actual[key]) )
							? SAME
							: DIFFERENT;
					}
					case "regexp": {
						return ( compareRegexp(actual[key], expected[key]) )
							? SAME
							: DIFFERENT;
					}
					default: {
						return ( actual[key] == expected[key] )
							? SAME
							: DIFFERENT;
					}
				} // end switch
			}
			
		}) ) { // actual == expected
			return PASSED;
		} else { // actual != expected
			return FAILED;
		}
	}

	// /////////////////////////////////////////////////////////////////
	// INSTANCE: UNIT TEST OBJECT CLASS
	// Defines available assertions and stores test data & results

	var UnitTest = function(modulePath, testName, testMode, unitTest, testData) {
		var info = {
			modulePath	: modulePath,
			testName	: testName,
			testMode	: testMode,
			unitTest	: unitTest,
			results		: [],
			state		: Test.UNIT_PENDING
		}
		info.results.count = 0;
		// test info and data
		makeConst(this, "_info", info    );
		makeConst(this, "data",	 testData);
	}

	makeConst(
		UnitTest.prototype, "_global",
		_global
	);

	// /////////////////////////////////////////////////////////////////
	// INSTANCE: TEST ASSERTIONS
	// https://warzone.atlassian.net/wiki/display/EGG/Test+Assertions

	makeConst( UnitTest.prototype, "ok",
		function( state, message ) {
			var passed = state; // just for consistency with other assertions
			return unitTestResult.call(this, passed, state, true, message, "ok");
		}
	);

	makeConst( UnitTest.prototype, "hasFunction",
		function( context, key, paramCount ) {
			// note: 'passed' determined in several stages...
			
			var msg = key+" is defined"; // primary assertion
			var passed = ( context.hasOwnProperty(key) );
			
			if (passed) {
				msg = key+"() is a function"; // secondary assertion
				passed = ( typeOf(context[key]) == "function" );
			}
			
			if (passed && paramCount != null) { // tertiary assertion
				msg = key+"("+(new Array(context[key].length))+") has "+paramCount+" formal pamrameters";
				passed = context[key].length == paramCount;
			}
			
			return unitTestResult.call(this, passed, context[key].length, paramCount, msg, "hasFunction");
		}
	);

	makeConst( UnitTest.prototype, "equal",
		function( actual, expected, message ) {
			var passed = (expected == actual);
			return unitTestResult.call(this, passed, actual, expected, message, "equal");
		}
	);

	makeConst( UnitTest.prototype, "notEqual",
		function( actual, expected, message ) {
			var passed = (expected != actual);
			return unitTestResult.call(this, passed, actual, expected, message, "notEqual");
		}
	);

	makeConst( UnitTest.prototype, "deepEqual",
		function( actual, expected, message ) {
			var passed = deepEq(actual, expected);
			return unitTestResult.call(this, passed, actual, expected, message, "deepEqual");
		}
	);

	makeConst( UnitTest.prototype, "notDeepEqual",
		function( actual, expected, message ) {
			var passed = !deepEq(actual, expected);
			return unitTestResult.call(this, passed, actual, expected, message, "notDeepEqual");
		}
	);

	makeConst( UnitTest.prototype, "similarTo",
		function( actual, expected, message ) {
			var passed = similar(actual, expected);
			return unitTestResult.call(this, passed, actual, expected, message, "similarTo");
		}
	);

	makeConst( UnitTest.prototype, "notSimilarTo",
		function( actual, expected, message ) {
			var passed = !similar(actual, expected);
			return unitTestResult.call(this, passed, actual, expected, message, "notSimilarTo");
		}
	);

	makeConst( UnitTest.prototype, "strictEqual",
		function( actual, expected, message ) {
			var passed = (expected === actual);
			return unitTestResult.call(this, passed, actual, expected, message, "strictEqual");
		}
	);

	makeConst( UnitTest.prototype, "notStrictEqual",
		function( actual, expected, message ) {
			var passed = (expected !== actual);
			return unitTestResult.call(this, passed, actual, expected, message, "notStrictEqual");
		}
	);

	makeConst( UnitTest.prototype, "hasNative",
		function( key, message ) {
			var passed = ( _global.hasOwnProperty("Define") )
				? Define.hasNative(key) // use Define API if available
				: _global.hasOwnProperty(key); // basic check (don't use hasOr() here as key value might typecast to false)
			return unitTestResult.call(this, passed, passed, true, message || key+" defined", "hasNative");
		}
	);

	makeConst( UnitTest.prototype, "comment",
		function( message ) {
			var passed = null; // just for consistency with other asserts (note: won't affect test outcome)
			return unitTestResult.call(this, passed, null, null, message, "comment", COMMENT);
		}
	);

	// /////////////////////////////////////////////////////////////////
	// INSTANCE: TEST SIGNALS
	// https://warzone.atlassian.net/wiki/display/EGG/Test+Signals

	makeConst( UnitTest.prototype, "ABORT",
		function( message ) {
			throw new AbortSignal(message);
		}
	);

	makeConst( UnitTest.prototype, "FINISH",
		function( message ) {
			throw new FinishSignal(message);
		}
	);
	
	makeConst( UnitTest.prototype, "REQUIRE",
		function( requirement ) {
			if (!requirement) {
				throw new Error("REQUIRE(): Must specify what is required!");
			} else switch(requirement) {
				case "*": { // require all previous tests to have passed
					if (modules.some(function(modulePath) {
						return !modules[modulePath].state;
					})) {
						throw new RequireSignal("One or more previous tests failed");
					}
					break;
				}
				case "^": { // require previous test to have passed
					if (tests.next > 0 && !tests[tests[tests.next-1]]._info.state) {
						throw new RequireSignal("Test '"+tests[tests.next-1]+"' failed or is still running");
					}
					break;
				}
				case "@": { // require all test in current module to have passed so far
					if (!modules[this._info.modulePath].state) {
						throw new RequireSignal("One or more tests in have failed in "+this._info.modulePath);
					}
					break;
				}
				case "@^": { // require all test in the previous module to have passed
					var moduleID = modules[this._info.modulePath].id;
					if (moduleID && !modules[modules[moduleID-1]].state) {
						throw new RequireSignal("One or more tests in have failed in "+modules[moduleID-1]);
					}
					break;
				}
				default: { // either specific test or specific module
					if (requirement.charAt(0) == "@") { // looking at module paths
						requirement = requirement.slice(1); // get the path
						if (modules.some(function(modulePath) {
							return (modulePath.indexOf(requirement) == 0 && !modules[modulePath].state);
						})) {
							throw new RequireSignal("Some tests failed in modules with path "+requirement);
						}
					} else if (!tests.hasOwnProperty(requirement)) {
						throw new RequireSignal("Test '"+requirement+"' does not exist");
					} else switch (tests[requirement]._info.state) {
						case Test.UNIT_PENDING: throw new RequireSignal("Test '"+requirement+"' has not started yet");
						case Test.UNIT_RUNNING: throw new RequireSignal("Test '"+requirement+"' is still in progress");
						case Test.UNIT_FAILED : throw new RequireSignal("Test '"+requirement+"' failed");
					}
					break;
				}
			}
			return true; // requirement met
		}
	);

	// /////////////////////////////////////////////////////////////////
	// INTERNAL: LOG A RESULT / COMMENT
	// Called in scope of test where results should be stored

	var unitTestResult = function(passed, actual, expected, message, name, isComment) {
		//console("["+this.module+"] "+name+"("+passed+") "+message);
		// create results object
		var result = {
			testName : this._info.testName,
			passed   : (isComment) ? null : passed,
			expected : expected,
			actual   : actual,
			message  : message,
			name     : name,
			isComment: isComment
		};
		// store results
		this._info.results.push(result);
		// does result count towards test success?
		if (!isComment) {
			this._info.results.count += 1; // increment result counter
			if (!passed) this._info.state = Test.UNIT_FAILED; // mark whole test as failed if assertion failed
		}
		// return pass/fail
		return passed;
	}

	// /////////////////////////////////////////////////////////////////
	// INTERNAL: HAS ASYNCH SESSION REACHED/EXCEEDED EXPECTED RESULTS?
	// If asynch session expects certain number of results, have we reached that threshold?
	// The function is run in the scope of the test to be checked

	var asynchResultsLimit = function() {
		var expected = hasOr(this._info.testMode, "expect", undefined);
		return ( expected === undefined )
			? false // no threshold set, keep waiting
			: this._info.results.count >= expected;
	}

	// /////////////////////////////////////////////////////////////////
	// INTERNAL: CHECK TEST STATE
	// Determines if a test has passed, failed or still in progress
	// The function is run in the scope of the test to be checked
	// https://warzone.atlassian.net/wiki/display/EGG/Test+API+-+Dev+Notes


	var unitTestEvent = function(event, msg) {
		// event can be:
		//	ERROR	: force fail
		//	ABORT	: force fail
		//	REQUIRE	: REQUIRE signal - force fail
		//	DONE	: Synch test complete - check normal states
		//	FINISH	: FINISH signal - check normal states
		//	TIMEOUT : Asynch test timeout - check normal states
		//	WAIT	: Asynch test complete - check if test is still running
		// msg:
		//	Only applicable to ERROR, ABORT and REQUIRE events
		//  Used as custom fail reason

		switch (event) {
			case "ERROR"  :
			case "ABORT"  :
			case "REQUIRE": {
				this._info.state = Test.UNIT_FAILED;
				unitTestResult.call(
					this, // scope
					this._info.state,
					this._info.results.count,
					hasOr(this._info.testMode, "expect", undefined),
					"FAIL: "+event+" "+(msg || "signal received"),
					event,
					COMMENT
				);
				break;
			}
			case "DONE"   :
			case "FINISH" :
			case "TIMEOUT": {
				if (this._info.state === Test.UNIT_FAILED) { // one or more assertions failed
					unitTestResult.call(
						this, // scope
						this._info.state,
						this._info.results.count,
						hasOr(this._info.testMode, "expect", undefined),
						"FAIL: One or more assertions failed",
						event,
						COMMENT
					);
				} else if (this._info.testMode.hasOwnProperty("expect")) { // did we get desired results?
					this._info.state = (this._info.results.count == this._info.testMode.expect)
						? Test.UNIT_SUCCESS
						: Test.UNIT_FAILED;
					unitTestResult.call(
						this, // scope
						this._info.state,
						this._info.results.count,
						this._info.testMode.expect,
						(this._info.state === Test.UNIT_SUCCESS ? "SUCCESS: Expected number of results" : "FAIL: Unexpected number of results"),
						event,
						COMMENT
					);
				} else { // passed - don't care how many results
					this._info.state = Test.UNIT_SUCCESS;
					unitTestResult.call(
						this, // scope
						this._info.state,
						this._info.results.count,
						undefined,
						"SUCCESS: All assertions passed",
						event,
						COMMENT
					);
				}
				break;
			}
			case "WAIT"   : {
				// redirect to "DONE" if passed or failed
				if ( this._info.state === Test.UNIT_FAILED ) {
					return unitTestEvent.call(this, "DONE");
				} else if ( asynchResultsLimit.call(this) ) {
					return unitTestEvent.call(this, "DONE");
				} // else keep waiting
				// keep waiting...
				this._info.state = Test.UNIT_RUNNING;
				unitTestResult.call(
					this, // scope
					this._info.state,
					this._info.results.count,
					hasOr(this._info.testMode, "expect", undefined),
					"WAIT: Waiting for more results",
					event,
					COMMENT
				);
				break;
			}
			default       : {
				throw new Error("unitTestEvent("+event+"): Unknown event");
			}
		}
		// when a test completes, update it's module's state if applicable
		if (this._info.state != Test.UNIT_RUNNING) { // includes Test.UNIT_PENDING
			// mark the module failed if the test failed
			if (this._info.state === Test.UNIT_FAILED) modules[this._info.modulePath].state = Test.UNIT_FAILED;
			// increment module pass/fail counter as applicable
			modules[this._info.modulePath][(this._info.state) ? "numPassed" : "numFailed"] += 1;
		}
		return this._info.state;
	}

	// /////////////////////////////////////////////////////////////////
	// INTERNAL: RUN A TEST
	// Performs the testRunner in the scope of a given test
	// Run in scope of target unit test
	// Note: Params may be for a test that is appending to scoped UnitTest instance
	
	// just makes code below read cleaner
	var moduleSetup = function(modulePath) {
		return modules[modulePath].lifecycle.hasOwnProperty("setup");
	}
	var moduleTeardown = function(modulePath) {
		return modules[modulePath].lifecycle.hasOwnProperty("teardown");
	}
	
	var unitTestRun = function(testName, testMode, unitTest, testData) {
		// bork if test has already finsihed
		if (this._info.state != Test.UNIT_RUNNING) { // includes Test.UNIT_PENDING
			throw new Error("Test has already been completed!");
		} else if (testMode.name == "TIMEOUT") {
			this._info.state = Test.UNIT_TIMEOUT;
		}
		try {
			// comment that test is starting
			unitTestResult.call(
				this, // scope
				null, gameTime, (new Date()).getTime(), "RUN: "+testName, testMode.name, COMMENT);
			// module info
			var modulePath = this._info.modulePath;
			var moduleData = modules[modulePath].lifecycle.hasOwnProperty("moduleData")
				? modules[modulePath].lifecycle.moduleData
				: undefined;
			// module setup (if applicable)
			if (moduleSetup(modulePath)) with (this) {
				void eval("("+modules[modulePath].lifecycle.setup+")").call(this, this._info.state);
			}
			// invoke unit in scope of test
			if (unitTest) with (this) {
				void eval("("+unitTest+")").call(
					this, // scope
					testData
				);
			}
			// work out if test is passed, failed or waiting (always in scope of initiating test)
			unitTestEvent.call(
				this, // scope
				testMode.after || "DONE"
			);
		} catch(e) { // Test signal received https://warzone.atlassian.net/wiki/display/EGG/Test+Signals
			unitTestEvent.call(
				this, // scope
				(e.hasOwnProperty("signal") ? e.signal : "ERROR"), e.message
			);
		}
		try {
			// module teardown (if applicable)
			if (moduleTeardown(modulePath)) with (this) {
				void eval("("+modules[modulePath].lifecycle.teardown+")").call(this, this._info.state);
			}
		} catch(e) {
			unitTestResult.call(
				this, // scope
				false, null, null, e.message, (e.hasOwnProperty("signal") ? e.signal : "ERROR"), COMMENT
			);
		}
		return this._info.state; // https://warzone.atlassian.net/wiki/display/EGG/Test+API+-+Dev+Notes#TestAPI-DevNotes-TestStates
	}

	// /////////////////////////////////////////////////////////////////
	// INTERNAL: SCHEDULE NEXT TEST
	// Time-out / clear-down current test, schedule next test in queue
	// Events: https://warzone.atlassian.net/wiki/display/EGG/Test+Events

	var scheduleNextTest = function(timeout) {
		// remember result of current test
		var result = (currentTest) ? currentTest._info.state : Test.UNIT_PENDING;
		// clear current test
		currentTest = null;
		// so, which test is next?
		if (tests.next == null) { // start at the beginning
			if (Test.hasOwnProperty("onStart")) { // trigger event
				Test.onStart();
			}
			tests.next = 0;
		} else if (tests.next == tests.length-1) { // no more tests
			if (Test.hasOwnProperty("onFinish")) { // trigger event
				var numModules = modules.length;
				var numTests = tests.length;
				var numPassed = 0;
				var numFailed = 0;
				// count # passed/failed
				modules.forEach(function(modulePath) {
					numPassed += modules[modulePath].numPassed;
					numFailed += modules[modulePath].numFailed;
				});
				Test.onFinish(numModules, numTests, numPassed, numFailed);
			}
			return result; // bail out
		} else { // schedule next test
			tests.next += 1;
		}
		// activate schedule
		scheduleActive = true;
		queue("Test", 200);
		// return last test result
		return result;
	}

	// /////////////////////////////////////////////////////////////////
	// PUBLIC: TEST API
	// https://warzone.atlassian.net/wiki/pages/viewpage.action?pageId=16023969

	var Test = function Test(testName, testMode, unitTest, testData) {
		var result = Test.UNIT_PENDING;

		if (!arguments.length) { // queued call to Test()
			// queued call no longer exists
			scheduleActive = false;
						
			// what was purpose of queued call?
			if (currentTest && currentTest._info.testMode.after == "WAIT") { // test timeout
				result = unitTestRun.call(
					currentTest, // scope to own UnitTest instance
					// use stored params relating to currentTest
					currentTest._info.testName,			// testName
					{name:"TIMEOUT",after:"TIMEOUT"},	// testMode
					null,								// unitTest
					currentTest.data					// testData
				);
				// schedule next test
				scheduleNextTest();
				// next test not yet started
				result = Test.UNIT_PENDING;
				
			} else if (tests.next != null) { // run next test in queue
				// get next test from queue
				currentTest = tests[tests[tests.next]]; // a UnitTest instance
				// run it and work out what to do next
				result = unitTestRun.call(
					currentTest, // scope to own UnitTest instance
					// use stored params relating to currentTest
					currentTest._info.testName,	// testName
					currentTest._info.testMode,	// testMode
					currentTest._info.unitTest,	// unitTest
					currentTest.data			// testData
				);
				if (result === Test.UNIT_RUNNING) { // asynch test not finished yet
					// set timeout
					scheduleActive = true;
					queue("Test", hasOr(currentTest._info.testMode, "ttl", 1000)); // test will timeout after this many game seconds
				} else { // test finished, schedule next test
					scheduleNextTest();
				}
				
			}
			
		} else if (arguments.length < 3) { // parameter fail

			throw new Error("Test(): Parameter(s) missing");

		} else if ( hasOr(testMode, "appendTo", false) ) { // run new test immediately
		
			if (currentTest && 
			   (currentTest._info.state === Test.UNIT_RUNNING) &&
			   (testMode.appendTo == "^" || testMode.appendTo == currentTest._info.testName))
			{
				result = unitTestRun.call(
					currentTest, // scope to target UnitTest instance
					// use params relating to the new Test()
					testName,	// testName
					testMode,	// testMode
					unitTest,	// unitTest
					testData	// testData
				);
				// if session is finished, schedule next test in queue to run (otherwise leave currentTest running)
				if (result !== Test.UNIT_RUNNING) {
					if (scheduleActive) {
						scheduleActive = false;
						removeTimer("Test");
					}
					scheduleNextTest();
				} // else leave it running
			} // else ignore
						
		} else { // add the new test to the queue
		
			if (tests.hasOwnProperty(testName)) {
				throw new Error("Test(): A test called '"+testName+"' is already defined!");
			}
			// default mode
			if (!testMode) testMode = Test.ANY( );
			// add to queue
			tests.push(testName);
			tests[testName] = new UnitTest(currentModule, testName, testMode, unitTest, testData);
			modules[currentModule].push(testName);
			// if we're not doing anything, schedule the test
			if (!scheduleActive) {
				scheduleNextTest();
			}
			
		}
		
		return result;
	}

	// /////////////////////////////////////////////////////////////////
	// PUBLIC: UNIT TEST STATES
	// https://warzone.atlassian.net/wiki/display/EGG/Test+API+-+Dev+Notes

	makeConst(Test, "UNIT_PENDING", undefined);
	makeConst(Test, "UNIT_RUNNING", null);
	makeConst(Test, "UNIT_TIMEOUT", 0);
	makeConst(Test, "UNIT_SUCCESS", PASSED);
	makeConst(Test, "UNIT_FAILED" , FAILED);

	// /////////////////////////////////////////////////////////////////
	// PUBLIC: PROPERTY STATES (FOR SIMILARTO() AND NOTSIMILARTO() ASSERTIONS)
	// https://warzone.atlassian.net/wiki/pages/viewpage.action?pageId=16777272
	// https://warzone.atlassian.net/wiki/pages/viewpage.action?pageId=16777274

	makeConst(Test, "FOUND", null);
	makeConst(Test, "NOT_FOUND", undefined);

	// /////////////////////////////////////////////////////////////////
	// PUBLIC: RESULTS OUTPUT
	// https://warzone.atlassian.net/wiki/display/EGG/Test+Results
	
	var outputMethods = [];

	var getResults = function() {
		var obj = [];
		var mod, tst, res;
		// iterate modules
		modules.forEach(function(modulePath) {
			// build module object
			mod = {
				modulePath: modulePath,
				state     : modules[modulePath].state,
				numPassed : modules[modulePath].numPassed,
				numFailed : modules[modulePath].numFailed,
				tests     : []
			}
			if (modules[modulePath].lifecycle.hasOwnProperty("url")) {
				mod.url = modules[modulePath].lifecycle.url;
			}
			// iterate tests in module
			modules[modulePath].forEach(function(testName) {
				// build test object
				tst = {
					testName: testName,
					testMode: tests[testName]._info.testMode,
					state   : tests[testName]._info.state,
					results : []
				}
				// iterate through results
				tests[testName]._info.results.forEach(function(result) {
					// build result object
					res = {
						passed   : result.passed,
						expected : result.expected,
						actual   : result.actual,
						name     : result.name,
						message  : result.message,
						isComment: result.isComment
					}
					// add res to tst.results
					tst.results.push(res);
				});
				// add tst to mod.tests
				mod.tests.push(tst);
			});
			// add mod to results object
			obj.push(mod);
		});
		// return the compiled results object
		return obj;
	}

	var getterSetter = {
		enumerable: false,
		configurable: false,
		get: function() {
			return function(methodName) {
				if (outputMethods.hasOwnProperty(methodName)) {
					return outputMethods[methodName](getResults(), typeOf);
				} else {
					throw new Error("Test.outputTo("+methodName+"): Unknown output method");
				}
			}
		},
		set: function(o) {
			outputMethods.push(o.name);
			outputMethods[o.name] = o.method;
		}
	};
	
	Object.defineProperty(Test, "outputTo", getterSetter);

/*
	// /////////////////////////////////////////////////////////////////
	// PUBLIC: START TESTS
	// under construction

	makeConst( Test, "start",
		function() {
			Test.enabled = true;
			if (!scheduleActive && tests.length) {
				scheduleNextTest();
			}
		}
	);

	// /////////////////////////////////////////////////////////////////
	// PUBLIC: STOP TESTS
	// under construction

	makeConst( Test, "stop",
		function() {
			Test.enabled = false;
			if (scheduleActive) {
				scheduleActive = false;
				removeTimer("Test");
			}
		}
	);

	// /////////////////////////////////////////////////////////////////
	// PUBLIC: RESET ALL TEST DATA
	// under construction

	makeConst( Test, "reset",
		// Notes:
		// * Can't undo any changes you've made to testData or moduleData
		// * Test.APPEND() tests may behave oddly
		function() {
			// bork if test currently running
			if (currentTest) {
				throw new Error("Test.reset(): Tests are still running, try again later.");
			}
			// stop timer if active
			if (scheduleActive) removeTimer("Test");
			// reset unit tests
			tests.forEach(function(testName) {
				// clear results
				tests[testName]._info.results = [];
				tests[testName]._info.results.count = 0;
				// reset state
				tests[testName]._info.state = Test.UNIT_PENDING;
			});
			// reset modules
			modules.forEach(function(modulePath) {
				// reset state indicators
				modules[modulePath].numPassed = 0;
				modules[modulePath].numFailed = 0;
				modules[modulePath].state = Test.UNIT_SUCCESS;
			});
		}
	}
*/
	// /////////////////////////////////////////////////////////////////
	// PUBLIC: DEFINE MODULE
	// https://warzone.atlassian.net/wiki/pages/viewpage.action?pageId=16515312

	makeConst( Test, "module",
		function(modulePath, lifecycle) {
			// Test.module() can't be used while a test is running
			if (currentTest && !scheduleActive) {
				throw new AbortSignal("Can't change Test.module() while a test is running.");
			}
			// default the module name to "Tests" if not specified
			currentModule = modulePath || "Tests";
			// bork if already defined
			if (modules.hasOwnProperty(currentModule)) {
				throw new Error("Module '"+currentModule+"' already defined.");
			} else { // create new module and initialise it
				modules[currentModule] = [];
				modules[currentModule].modulePath = modulePath;
				modules[currentModule].state = Test.UNIT_SUCCESS; // until proven otherwise
				modules[currentModule].numPassed = 0;
				modules[currentModule].numFailed = 0;
				modules[currentModule].lifecycle = lifecycle || {};
				modules[currentModule].id = modules.length;
				modules.push(currentModule);
			}
		}
	);
	
	Test.module(); // initialise default module

	// /////////////////////////////////////////////////////////////////
	// PUBLIC: TEST MODES
	// https://warzone.atlassian.net/wiki/display/EGG/Test+Modes
	// https://warzone.atlassian.net/wiki/display/EGG/Test+API+-+Dev+Notes

	var validateNumResults = function(numResults, mode) {
		if (typeOf(numResults) != "number" || numResults < 0) {
			throw new Error("Test."+mode+"( ): Invalid numResults value");
		}
	}
	var validateGameSeconds = function(gameSeconds, mode) {
		if (typeOf(gameSeconds) != "number" || gameSeconds < 1) {
			throw new Error("Test."+mode+"( ): Invalid gameSeconds value");
		}
	}
	var validateTestName = function(testName, mode) {
		if (!testName) {
			throw new Error("Test."+mode+"( ): Must specify a test name");
		}
		if (testName != "^" && !tests.hasOwnProperty(testName)) {
			throw new Error("Test."+mode+"( "+testName+" ): Specified test not found (APPEND must be invoked after ASYNCH!)");
		}
	}

	makeConst( Test, "ANY",
		function( ) {
			return {
				name: "ANY",
				after: "DONE"
			};
		}
	);
	makeConst( Test, "EXPECT",
		function( numResults ) {
			validateNumResults(numResults, "EXPECT");
			return {
				name  : "EXPECT",
				after : "DONE",
				expect: numResults
			};
		}
	);
	makeConst( Test, "ASYNCH",
		function( gameSeconds, numResults ) {
			var mode = {
				name : "ASYNCH",
				after: "WAIT"
				// ttl -- if gameSeconds specified (see below)
				// expect -- if numResults specified (see below)
			};
			// set mode.ttl
			if (gameSeconds) {
				validateGameSeconds(gameSeconds, mode.name);
				mode.ttl = gameSeconds * 1000;
			} else {
				mode.ttl = 60 * 1000;
			}
			// set mode.expect?
			if (numResults) {
				validateNumResults(numResults, mode.name);
				mode.expect = numResults;
			}
			return mode;
		}
	);
	makeConst( Test, "APPEND",
		function( testName ) {
			validateTestName(testName, "APPEND");
			return {
				name  : "APPEND",
				after : "WAIT",
				appendTo: testName
			};
		}
	);

	// /////////////////////////////////////////////////////////////////
	// PUBLIC: PUBLISH API INTERFACE
	
	makeConst(_global, "Test", Test);

	// /////////////////////////////////////////////////////////////////
	// INTERNAL: CONFIRM API AVAILABILITY

	if (CheckAvailable) Check.provide(self);

})(this);