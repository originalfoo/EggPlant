// TEST - TEST API
//
// Purpose:
// * Test Test API features
//
// License:
// * CC-BY-SA 3.0: http://creativecommons.org/licenses/by-sa/3.0/
// * URL: https://warzone.atlassian.net/wiki/display/EGG/Test+API
//
// /////////////////////////////////////////////////////////////////

void (function TestTest(_global) {

	var self = {
		file: "Tests/APIs/Test.js",
		ver : 1.1
	};

	if (_global.hasOwnProperty("Check")) { // Dependency Checker in Util API installed

		var dependencies = {
			"APIs/Test.js": Check.ANY_VERSION
		}
		
		Check.required(dependencies, self);
		
	}

	// /////////////////////////////////////////////////////////////////
	// TEST: TEST - JUST FOR CONSISTENCY REALLY

	Test.module(
		self.file,
		{url: "https://warzone.atlassian.net/wiki/display/EGG/Test+API"}
	);

	Test("Test Namespace", Test.EXPECT( 1 ), function() {
		if (!hasNative( "Test", "Test() is defined" )) {
			ABORT( "Testing of Test API aborted" );
		}
	});

	// /////////////////////////////////////////////////////////////////
	// TEST: TEST MODULE

	Test.module(
		self.file+"/Modules",
		{		
			url: "https://warzone.atlassian.net/wiki/pages/viewpage.action?pageId=16515312",
			moduleData: {test:null},
			setup: function() {
				// will only happen on first test
				if (!moduleData.test) {
					moduleData.test = 1;
				
					comment( "modulePath: "+modulePath );
					comment( "testName:   "+testName   );
				}
			},
			teardown: function() {
				// will happen after each test
				moduleData.test +=1;
			}
		}
	);

	Test("Module path", Test.EXPECT( 1 ), function(self) {
		REQUIRE( "Test Namespace" );
		
		equal( modulePath, self.file+"/Modules", "Test.module() functioning properly" );
	}, self);

	Test("Module lifecycle", Test.EXPECT( 1 ), function() {
		REQUIRE( "^" );
		
		equal( moduleData.test, 2, "Lifecycle functioning properly" );
	});

	// /////////////////////////////////////////////////////////////////
	// TEST: TEST ASSERTIONS

	Test.module(
		self.file+"/Assertions",
		{
			url: "https://warzone.atlassian.net/wiki/display/EGG/Test+Assertions"
		}
	);

	Test("Test Assertions", Test.EXPECT( 16 ), function() {
		REQUIRE( "Test Namespace" );

		ok( true, "ok( )" );
		
		equal( true, true, "equal( )" );
		notEqual( false, true, "notEqual( )" );
		
		strictEqual( true, true, "strictEqual( )" );
		notStrictEqual( null, false, "notStrictEqual( )" );
		
		deepEqual( {a:5}, {a:5}, "deepEqual( )" );
		notDeepEqual( {a:1}, {a:5}, "notDeepEqual( )" );

		similarTo( {a:5, b:1, c:3}, {a:5}, "similarTo( ) #1" );
		similarTo( {a:5, b:1, c:3}, {b:Test.FOUND}, "similarTo( ) #2" );
		similarTo( {a:5, b:1, c:3}, {d:Test.NOT_FOUND}, "similarTo( ) #3" );
		
		notSimilarTo( {a:1, c:3}, {a:5}, "notSimilarTo( ) #1" );
		notSimilarTo( {a:1, c:3}, {b:Test.FOUND}, "notSimilarTo( ) #2" );
		notSimilarTo( {a:5, b:1, c:3, d:2}, {d:Test.NOT_FOUND}, "notSimilarTo( ) #3" );
		
		hasNative( "Math", "hasNative( )" );
		hasFunction( _global, "Test" );
		hasFunction( _global, "Test", 4 );
		
		comment( "This should not count as a result" );
		// which would cause test to fail as Test.EXPECT( 8 )
	});

	// /////////////////////////////////////////////////////////////////
	// TEST: TEST SIGNALS

	Test.module(
		self.file+"/Signals",
		{
			url: "https://warzone.atlassian.net/wiki/display/EGG/Test+Signals",	
			moduleData: {file: self.file}
		}
	);

	Test("Signal: REQUIRE('^')", Test.EXPECT( 1 ), function() {
		REQUIRE( "^" );
		
		ok( true, "Previous test passed" );
	});

	Test("Signal: REQUIRE('@')", Test.EXPECT( 1 ), function() {
		REQUIRE( "@" );
		
		ok( true, "All tests in current module have passed so far" );
	});

	Test("Signal: REQUIRE('@^')", Test.EXPECT( 1 ), function() {
		REQUIRE( "@^" );
		
		ok( true, "All tests in previous module have passed" );
	});

	Test("Signal: REQUIRE('@"+self.file+"')", Test.EXPECT( 1 ), function() {
		REQUIRE( "@"+moduleData.file );
		
		ok( true, "All tests in matching modules have passed so far" );
	});

	Test("Signal: REQUIRE('*')", Test.EXPECT( 1 ), function() {
		REQUIRE( "*" );
		
		ok( true, "All tests have passed so far" );
	});

	Test("Signal: REQUIRE('Unknown test') (should FAIL)", Test.EXPECT( 0 ), function() {
		REQUIRE( "Unknown test" );
		
		ok( false, "This test should have failed already!" );
	});

	Test("Signal: REQUIRE('^') (should FAIL)", Test.EXPECT( 0 ), function() {
		REQUIRE( "^" );

		ok( false, "This test should have failed already!" );
	});

	Test("Signal: REQUIRE('@') (should FAIL)", Test.EXPECT( 0 ), function() {
		REQUIRE( "@" );

		ok( false, "This test should have failed already!" );
	});

	Test("Signal: REQUIRE('@"+self.file+"') (should FAIL)", Test.EXPECT( 0 ), function() {
		REQUIRE( "@"+moduleData.file );

		ok( false, "This test should have failed already!" );
	});

	Test("Signal: REQUIRE('*') (should FAIL)", Test.EXPECT( 0 ), function() {
		REQUIRE( "*" );

		ok( false, "This test should have failed already!" );
	});

	Test("Signal: ABORT (should FAIL)", Test.EXPECT( 0 ), function() {
		ABORT( "testing ABORT signal" );

		ok( false, "This test should have failed already!" );
	});

	Test("Signal: FINISH #1", Test.EXPECT( 1 ), function() {
		ok( true, "Sending FINISH signal..." );
		FINISH( "testing FINISH signal" );
	});

	Test("Signal: FINISH #2 (should FAIL)", Test.EXPECT( 1 ), function() {
		FINISH( "testing FINISH signal" );
		
		// expecting 1 result, but no results = should fail
	});

	// /////////////////////////////////////////////////////////////////
	// TEST: TEST MODE DEFINITIONS

	Test.module(
		self.file+"/Modes",
		{
			url: "https://warzone.atlassian.net/wiki/display/EGG/Test+Modes"
		}
	);

	Test("Test Mode Objects", Test.EXPECT( 17 ), function() {
		REQUIRE( "Test Assertions" );
		
		var expected, actual;
		
		if (ok( Test.hasOwnProperty("ANY"), "Test.ANY( ) defined" )) {
			actual = Test.ANY( );
			expected = {name: "ANY", after: "DONE"};
			deepEqual( actual, expected, "Test.ANY( ) returns valid mode" );
		}

		if (ok( Test.hasOwnProperty("EXPECT"), "Test.EXPECT( ) defined" )) { // we wouldn't be here if it wasn't lol
			try {
				Test.EXPECT( );
				ok( false, "Test.EXPECT( ) throws an error" );
			} catch(e) {
				ok( true, "Test.EXPECT( ) throws an error" );
			}
			try {
				Test.EXPECT( true );
				ok( false, "Test.EXPECT( true ) throws an error" );
			} catch(e) {
				ok( true, "Test.EXPECT( true ) throws an error" );
			}
			try {
				Test.EXPECT( "" );
				ok( false, "Test.EXPECT( '' ) throws an error" );
			} catch(e) {
				ok( true, "Test.EXPECT( '' ) throws an error" );
			}
			try {
				Test.EXPECT( -1 );
				ok( false, "Test.EXPECT( -1 ) throws an error" );
			} catch(e) {
				ok( true, "Test.EXPECT( -1 ) throws an error" );
			}
			actual = Test.EXPECT( 5 );
			expected = {name: "EXPECT", expect: 5, after: "DONE"};
			deepEqual( actual, expected, "Test.EXPECT( 5 ) returns valid mode" );
		}

		if (ok( Test.hasOwnProperty("ASYNCH"), "Test.ASYNCH( ) defined" )) {
			actual = Test.ASYNCH( );
			expected = {name: "ASYNCH", ttl: 60*1000, after: "WAIT"};
			deepEqual( actual, expected, "Test.ASYNCH( ) returns valid mode" );

			actual = Test.ASYNCH( 10 );
			expected = {name: "ASYNCH", ttl: 10*1000, after: "WAIT"};
			deepEqual( actual, expected, "Test.ASYNCH( 10 ) returns valid mode" );

			actual = Test.ASYNCH( null, 5 );
			expected = {name: "ASYNCH", ttl: 60*1000, expect: 5, after: "WAIT"};
			deepEqual( actual, expected, "Test.ASYNCH( null, 5 ) returns valid mode" );

			actual = Test.ASYNCH( 10, 5 );
			expected = {name: "ASYNCH", ttl: 10*1000, expect: 5, after: "WAIT"};
			deepEqual( actual, expected, "Test.ASYNCH( 10, 5 ) returns valid mode" );
		}

		if (ok( Test.hasOwnProperty("APPEND"), "Test.APPEND( ) defined" )) {
			try {
				Test.APPEND( );
				ok( false, "Test.APPEND( ) throws an error" );
			} catch(e) {
				ok( true, "Test.APPEND( ) throws an error" );
			}
			try {
				Test.APPEND( "Non-exiting test" );
				ok( false, "Test.APPEND( 'Non-exiting test' ) throws an error" );
			} catch(e) {
				ok( true, "Test.APPEND( 'Non-exiting test' ) throws an error" );
			}
			actual = Test.APPEND( "Test Mode Objects" );
			expected = {name: "APPEND", appendTo: "Test Mode Objects", after: "WAIT"};
			deepEqual( actual, expected, "Test.APPEND( 'Test Mode Objects' ) returns valid mode" );
		}	
	});

	// /////////////////////////////////////////////////////////////////
	// TEST: TEST MODES IN ACTION

	Test.module(
		self.file+"/Modes/Processing",
		{
			url: "https://warzone.atlassian.net/wiki/display/EGG/Test+Modes",
			// create test fn for test that needs it
			setup: function(state) {
				if (testName == moduleData.needsFn && state === Test.UNIT_PENDING) {
					_global[moduleData.fnName] = function() {
						Test("Test.APPEND", Test.APPEND( moduleData.needsFn ), function() {
							ok( true, "This should make Test.ASYNCH #5 pass test" );
							FINISH( "Submit appeneded results..." );
						});
					}
				}
			},
			// remove test fn after test that needed it has finsihed
			teardown: function(state) {
				if (this._info.testname == moduleData.needsFn && state !== Test.UNIT_RUNNING) {
					delete _global[moduleData.fnName];
				}
			},
			moduleData: {
				needsFn : "Test.ASYNCH #5",
				fnName  : "tstAppend"
			}
		}
	);

	Test("Test.ANY", Test.ANY( ), function() {
		REQUIRE( "Test Mode Objects" );
		
		comment( "This test should pass despite having no results" );
	});

	var time = {};

	Test("Test.ASYNCH #1", Test.ASYNCH( 2 ), function(settings) {
		REQUIRE( "Test Mode Objects" );
		
		// log start time
		settings.start = (new Date()).getTime();
		
		comment( "Should pass after 2 sec timeout" );
	}, time);

	Test("Test.EXPECT #1", Test.EXPECT( 1 ), function(settings) {
		REQUIRE( "Test.ASYNCH #1" );
		
		var duration = (new Date()).getTime() - settings.start;
		
		ok( duration > 1500, "Test waited until ASYNCH #1 timed out" );
	}, time);

	Test("Test.ASYNCH #2", Test.ASYNCH( 2, 1 ), function() {
		REQUIRE( "Test.EXPECT #1" );

		ok( true, "Should pass immediatley (no timeout)" );
	});

	Test("Test.ASYNCH #3 (should FAIL)", Test.ASYNCH( 2, 1 ), function() {
		REQUIRE( "Test.ASYNCH #2" );
		
		comment( "Should FAIL after timeout" );
	});

	Test("Test.ASYNCH #4 (should FAIL)", Test.ASYNCH( 2, 1 ), function() {
		REQUIRE( "Test.ASYNCH #2" ); // #3 should fail, #2 is last one that should have passed
		
		comment( "Should FAIL immediately (no timeout)" );
		ok( true, "Result #1" );
		ok( true, "Result #2 -- oops, too many results!" );
	});

	Test("Test.ASYNCH #5", Test.ASYNCH( 5, 1 ), function() {
		REQUIRE( "Test.ASYNCH #2" );
		
		comment( "Should pass due to APPEND" );
		
		// module setup/teardown creates/removes the fn
		queue(moduleData.fnName, 200); // queue append test
	});

	Test("Test.EXPECT #2 (should FAIL)", Test.EXPECT( 3 ), function(settings) {
		REQUIRE( "Test.ASYNCH #5" );
		
		comment( "Should fail due to unexpeted number of results" );
	});

	// /////////////////////////////////////////////////////////////////
	// INTERNAL: CONFIRM API AVAILABILITY

	if (_global.hasOwnProperty("Check")) Check.provide(self);

})(this);