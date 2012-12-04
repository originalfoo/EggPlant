// CONFIG - TEST API - DEFAULT EVENT HANDLERS
//
// Purpose:
// * Automatically outputTo("console") when Test.onFinish()
//
// License:
// * CC-BY-SA 3.0: http://creativecommons.org/licenses/by-sa/3.0/
// * URL: https://warzone.atlassian.net/wiki/display/EGG/Test+Results
//
// /////////////////////////////////////////////////////////////////

void (function ConfigTest(_global) {

	var self = {
		file: "Config/Test.events.js",
		ver : 1.0
	};

	if (_global.hasOwnProperty("Check")) {	
	
		var dependencies = {
			"APIs/Util.js": Check.ANY_VERSION,
			"APIs/Test.js": Check.ANY_VERSION,
			"Config/Test.basicOutput.js": Check.ANY_VERSION // make sure output methods defined
		}

		Check.required(dependencies, self);
		
	}

	// /////////////////////////////////////////////////////////////////
	// CONFIG: ADD HANDLER
	
	Test.onFinish = function() {
//		Test.outputTo("console"); // full output
		Test.outputTo("consoleOnlyFails"); // only output fails
	}

	// /////////////////////////////////////////////////////////////////
	// INTERNAL: CONFIRM API AVAILABILITY

	if (_global.hasOwnProperty("Check")) Check.provide(self);

})(this);