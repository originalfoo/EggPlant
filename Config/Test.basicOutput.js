// CONFIG - TEST API
//
// Purpose:
// * Add text-based output methods
//
// License:
// * CC-BY-SA 3.0: http://creativecommons.org/licenses/by-sa/3.0/
// * URL: https://warzone.atlassian.net/wiki/display/EGG/Test+Results
//
// /////////////////////////////////////////////////////////////////

void (function ConfigTest(_global) {

	var self = {
		file: "Config/Test.basicOutput.js",
		ver : 1.0
	};

	if (_global.hasOwnProperty("Check")) {	
	
		var dependencies = {
			"APIs/Util.js": Check.ANY_VERSION,
			"APIs/Test.js": Check.ANY_VERSION
		}

		Check.required(dependencies, self);
		
	}

	// /////////////////////////////////////////////////////////////////
	// INTERNAL: HELPER FUNCTIONS & VARS
	
	var fixAt = function(str, method) {
		// work around console mysteriously filtering all @ symols
		// note: other @ symbols (eg. ﹫＠) didn't work
		return (method == "console")
					? str.split("@").join("∂")
					: str;
	}
	
	var flatResults;
	var flattenResults = function(method, results, onlyFails) {
		// used for "console", "debug", "host" and "log" output modes
		
		flatResults = [];
		var str;
		
		// iterate each module object
		results.forEach(function(module) {
			// output module summary heading
			str = "[[ ∂" + (module.state ? "✔" : "✘") + " " + module.modulePath
				+ " (✔: " + module.numPassed + ", ✘: " + module.numFailed + ") ]]";
			flatResults.push(fixAt(str, method)); // module heading
			flatResults.push("  "); // blank line
			
			// now do each of the tests
			module.tests.forEach(function(test) {
				if (onlyFails && test.state) return;
				// output test summary heading
				str = "» " + (test.state ? "✔" : "✘") + " " + test.testName;
				flatResults.push(fixAt(str, method));
			
				// now do each of the results in the test
				test.results.forEach(function(result) {
					if (onlyFails && result.passed) return;
					if (result.isComment) {
						str = "''"+result.message+"'' <"+result.name+">";
					} else {
						str = (result.passed ? "✔" : "✘")+" "+result.message;
					}
					flatResults.push(fixAt(str, method));
				});

				flatResults.push("  "); // blank like after each test
			});
			
		});
		
	}

	var trickleTo; // "host", "console"
	// trickles flatResults to trickleTo
	_global.trickleTestOutput = function() {
		var i = 4;
		var str;
		while (--i && flatResults.length) {
			str = flatResults.shift();
			switch (trickleTo) {
				case "host" : chat(0, str); break;
				case "console": console(str); break;
				default: throw new Error(self.file+" - unknown trickleTo: "+trickleTo);
			}
		}
		if (flatResults.length) queue("trickleTestOutput", 3500); // send next few lines in 3.5 secs
	}

	// /////////////////////////////////////////////////////////////////
	// CONFIG: SUMMARY OUTPUT METHOD
	// https://warzone.atlassian.net/wiki/display/EGG/Test+Results
	
	var summaryFn = function(results) {
		var numModules = results.length;
		var numTests = 0;
		var numPassed = 0;
		var numFailed = 0;
		results.forEach(function(result) {
			numTests  += result.tests.length;
			numPassed += result.numPassed;
			numFailed += result.numFailed;
		});

	    var msg = "In "+numModules+" modules "
	              + "there were "+numTests+" "
	              + "of which ✔:"+numPassed+" passed "
	              + "and ✘:"+numFailed+" failed."
	    console(msg);
	}
	Test.outputTo = {
		name  : "summary",
		method: summaryFn
	}

	// /////////////////////////////////////////////////////////////////
	// CONFIG: DEBUG OUTPUT METHOD
	// https://warzone.atlassian.net/wiki/display/EGG/Test+Results

	var debugFn = function(results) {
		flattenResults("debug", results);
		debug.apply(_global, flatResults);
	}
	Test.outputTo = {
		name  : "debug",
		method: debugFn
	}

	// /////////////////////////////////////////////////////////////////
	// CONFIG: DEBUG OUTPUT METHOD
	// https://warzone.atlassian.net/wiki/display/EGG/Test+Results

	var logFn = function(results) {
		flattenResults("log", results);
		if (_global.hasOwnProperty("log")) {
			log.apply(_global, flatResults);
		} else {
			debug.apply(_global, flatResults);
		}
	}
	Test.outputTo = {
		name  : "log",
		method: logFn
	}

	// /////////////////////////////////////////////////////////////////
	// CONFIG: HOST CHAT OUTPUT METHOD
	// https://warzone.atlassian.net/wiki/display/EGG/Test+Results

	var hostFn = function(results) {
		trickleTo = (_global.hasOwnProperty("chat") ? "host" : "console");
		flattenResults(trickleTo, results);
		queue("trickleTestOutput", 5000);
	}
	Test.outputTo = {
		name  : "host",
		method: hostFn
	}
	
	// /////////////////////////////////////////////////////////////////
	// CONFIG: CONSOLE OUTPUT METHOD
	// https://warzone.atlassian.net/wiki/display/EGG/Test+Results

	var consoleFn = function(results) {
		trickleTo = "console";
		flattenResults(trickleTo, results);
		queue("trickleTestOutput", 5000);
	}
	Test.outputTo = {
		name  : "console",
		method: consoleFn
	}

	var consoleFn = function(results) {
		trickleTo = "console";
		flattenResults(trickleTo, results, true);
		queue("trickleTestOutput", 5000);
	}
	Test.outputTo = {
		name  : "consoleOnlyFails",
		method: consoleFn
	}

	// /////////////////////////////////////////////////////////////////
	// INTERNAL: CONFIRM API AVAILABILITY

	if (_global.hasOwnProperty("Check")) Check.provide(self);

})(this);