// TEST - BABEL API
//
// Purpose:
// * Test Babel API features
//
// License:
// * CC-BY-SA 3.0: http://creativecommons.org/licenses/by-sa/3.0/
// * URL: https://warzone.atlassian.net/wiki/display/EGG/Babel+API
//
// /////////////////////////////////////////////////////////////////

void (function BabelTest(_global) {

	var self = {
		file: "Tests/APIs/Babel.js",
		ver : 1.1
	};

	var CheckAvailable = _global.hasOwnProperty("Check"); // is dependency checker installed?

	if (CheckAvailable) { // Dependency Checker in Util API installed

		var dependencies = {
			"APIs/Test.js": Check.ANY_VERSION,
			"APIs/Babel.js": Check.ANY_VERSION
		}
		
		Check.required(dependencies, self);
		
	}

	// /////////////////////////////////////////////////////////////////
	// TEST: MAKE SURE CHAT FUNCTION EXISTS

	Test.module(
		self.file,
		{url: "https://warzone.atlassian.net/wiki/display/EGG/Babel+API"}
	);

	Test("IMPORTANT NOTE", Test.EXPECT( 0 ), function() {
		comment( "These test script does not check that chat() functionality is working." );
	});

	Test("chat() Namespace", Test.EXPECT( 1 ), function() {
		hasNative( "chat", "chat() is defined" );
		
		if (chat.name == "fakeChat") {
			comment( "Note: Using fakeChat(), must be on WZ 3.1" );
		}
	});

	// /////////////////////////////////////////////////////////////////
	// TEST: CONSTANTS

	Test.module(
		self.file+"/Constants",
		{		
			url: "https://warzone.atlassian.net/wiki/display/jsapi/.type",
			setup: function() {
				REQUIRE( "chat() Namespace" );
			}
		}
	);

	Test("JS API constants", Test.EXPECT( 7 ), function() {
		keys = [
			"AREA",
			"DROID",
			"FEATURE",
			"PLAYER_DATA",
			"POSITION",
			"RESEARCH_DATA",
			"STRUCTURE"
		];
		
		keys.forEach(function(key) {
			// don't care whether it's actuall native, just that it's defined
			ok( _global.hasOwnProperty(key), key+" defined" );
		});
	});

	Test("chat.CUSTOM_DATA", Test.EXPECT( 1 ), function() {
		// don't care whether it's actuall native, just that it's defined
		ok( chat.hasOwnProperty("CUSTOM_DATA"), "chat.CUSTOM_DATA defined" );
	});

	Test("chat.PLING", Test.EXPECT( 2 ), function() {
		if ( ok( chat.hasOwnProperty("PLING"), "chat.PLING defined" ) ) {		
			equal( chat.PLING, "‼", "Expected value: ‼" );
		}
	});

	// /////////////////////////////////////////////////////////////////
	// TEST: METHOD DEFINITIONS

	Test.module(
		self.file+"/Methods",
		{		
			url: "https://warzone.atlassian.net/wiki/display/EGG/Babel+API",
			setup: function() {
				REQUIRE( "chat() Namespace" );
			}
		}
	);

	Test("chat.toBabel() defined", Test.EXPECT( 1 ), function() {
		hasFunction( chat, "toBabel", 4 );
	});

	Test("chat.fromBabel() defined", Test.EXPECT( 1 ), function() {
		hasFunction( chat, "fromBabel", 3 );
	});

	Test("chat.isBabel() defined", Test.EXPECT( 1 ), function() {
		hasFunction( chat, "isBabel", 1 );
	});

	Test("chat.removeType() defined", Test.EXPECT( 1 ), function() {
		hasFunction( chat, "removeType", 2 );
	});

	// /////////////////////////////////////////////////////////////////
	// TEST: TOBABEL INVOCATIONS

	// Note: replacer param not tested as that's part of JSON and thus outside scope of these tests

	Test.module(
		self.file+"/chat.toBabel() invocatons",
		{		
			url: "https://warzone.atlassian.net/wiki/pages/viewpage.action?pageId=16777475",
			setup: function() {
				REQUIRE( "chat.toBabel() defined" );
			}
		}
	);

	Test("chat.toBabel(msg)", Test.EXPECT( 1 ), function() {
		var actual = chat.toBabel("test");
		var expected = "ai‼test‼undefined";
		// tests that dialect defaults to "ai"
		equal( actual, expected, expected );
	});

	Test("chat.toBabel(msg with spaces)", Test.EXPECT( 1 ), function() {
		var actual = chat.toBabel("test 1 2 3");
		var expected = "ai‼test 1 2 3‼undefined";
		// tests that dialect defaults to "ai"
		equal( actual, expected, expected );
	});

	Test("chat.toBabel(msg, dialect)", Test.EXPECT( 1 ), function() {
		var actual = chat.toBabel("test", "foo");
		var expected = "foo‼test‼undefined";
		// test that dialect is stored correctly
		equal( actual, expected, expected );
	});

	Test("chat.toBabel(msg, dialect, true)", Test.EXPECT( 1 ), function() {
		var actual = chat.toBabel("test", "foo", true);
		var expected = "foo‼test‼true";
		// this tests that primitive values work ok
		equal( actual, expected, expected );
	});

	Test("chat.toBabel(msg, dialect, object)", Test.EXPECT( 1 ), function() {
		var actual = chat.toBabel("test", "foo", {foo:"bar"});
		var expected = 'foo‼test‼{"foo":"bar"}';
		// this tests that custom objects work ok
		equal( actual, expected, expected );
	});

	Test("chat.toBabel(msg, dialect, array)", Test.EXPECT( 1 ), function() {
		var actual = chat.toBabel("test", "foo", ["bar", true]);
		var expected = 'foo‼test‼["bar",true]';
		// this tests that array objects work ok
		equal( actual, expected, expected );
	});

	Test("chat.toBabel(msg, dialect, droid)", Test.EXPECT( 1 ), function() {
		// get a droid (assumes there is one on map)
		var droid = enumDroid()[0];

		var actual = chat.toBabel("test", "foo", droid);
		var expected = 'foo‼test‼{"type":'+droid.type+',"id":'+droid.id+',"player":'+droid.player+'}';
		// this tests that DROID objects work ok, and are minified
		equal( actual, expected, actual );
	});

	Test("chat.toBabel(msg, dialect, structure)", Test.EXPECT( 1 ), function() {
		// just grab first available struct for now (requires that you start with bases or advanced bases)
		var struct = enumStruct()[0];
/* Adding sat uplink doesn't seem to be working...
   see: http://forums.wz2100.net/viewtopic.php?f=35&t=10338

		// we will need a sat uplink (in particular for subsequent tests to work)
		var struct = enumStruct(me, SAT_UPLINK);

		if (struct.length) {
			struct = struct[0]; // get first uplink struct
		} else { // need to make us a sat up link!
			// id of sat uplink...
			var satUplink = "A0Sat-linkCentre";
			// find a truck
			var truck = enumDroid(me, DROID_CONSTRUCT)[0];
			hackNetOff();
				// make sure sat uplink is enabled
				enableStructure(satUplink, me);
				// find place to put uplink
				var pos = pickStructLocation(truck, satUplink, truck.x, truck.y);
				if (!pos) ABORT( "pickStructLocation() borked" );
				// place structure
				var result = addStructure(satUplink, me, pos.x, pos.y);
				if (!result) comment( "addStructure returned: "+result );
			hackNetOn();
			// get structure object
			struct = enumStruct(me, SAT_UPLINK)[0];
		} */		
		var actual = chat.toBabel("test", "foo", struct);
		var expected = 'foo‼test‼{"type":'+struct.type+',"id":'+struct.id+',"player":'+struct.player+'}';
		// this tests that STRUCTURE objects work ok, and are minified
		equal( actual, expected, actual );
	});

	Test("chat.toBabel(msg, dialect, feature)", Test.EXPECT( 1 ), function() {
		REQUIRE( "chat.toBabel(msg, dialect, structure)" ); // need sat uplink to make sure we see features :s
		// get a feature (assumes there is one on map)
		var feature = enumFeature(-1)[0];
		
		if (!feature) {
			comment( "enumFeature(-1) is failing -- bug #3817?" );
			ABORT( "Could not find any feature objects :(" );
		}

		var actual = chat.toBabel("test", "foo", feature);
		var expected = 'foo‼test‼{"type":'+feature.type+',"id":'+feature.id+',"player":'+feature.player+'}';
		// this tests that FEATURE objects work ok, and are minified
		equal( actual, expected, actual );
	});

	Test("chat.toBabel(msg, dialect, area)", Test.EXPECT( 1 ), function() {
		// fake area object
		var area = {
			type: AREA,
			x : 1, y : 2,
			x2: 3, y2: 4,
			other: true // any additional properties should be retained 
		}

		var actual = chat.toBabel("test", "foo", area);
		var expected = 'foo‼test‼{"type":'+AREA+',"x":1,"y":2,"x2":3,"y2":4,"other":true}';
		// this tests that AREA objects work ok
		equal( actual, expected, actual );
	});

	Test("chat.toBabel(msg, dialect, position)", Test.EXPECT( 1 ), function() {
		// fake position object
		var pos = {
			type: POSITION,
			x : 1, y : 2,
			other: true // any additional properties should be retained 
		}

		var actual = chat.toBabel("test", "foo", pos);
		var expected = 'foo‼test‼{"type":'+POSITION+',"x":1,"y":2,"other":true}';
		// this tests that POSITION objects work ok
		equal( actual, expected, actual );
	});

	Test("chat.toBabel(msg, dialect, position-like)", Test.EXPECT( 1 ), function() {
		// fake position object
		var pos = {
			x : 1, y : 2,
			other: true // any additional properties should be retained 
		}

		var actual = chat.toBabel("test", "foo", pos);
		var expected = 'foo‼test‼{"x":1,"y":2,"other":true,"type":'+POSITION+'}';
		// this tests that POSITION-like objects with no .type have .type added
		equal( actual, expected, actual );
	});

	Test("chat.toBabel(msg, dialect, position-like, removeType)", Test.EXPECT( 1 ), function() {
		REQUIRE( "chat.removeType() defined" );
		
		// fake position object
		var pos = {
			x : 1, y : 2,
			other: true // any additional properties should be retained 
		}

		var actual = chat.toBabel("test", "foo", pos, chat.removeType);
		var expected = 'foo‼test‼{"x":1,"y":2,"other":true}';
		// tests that chat.removeType replacer works, even on POSITION-like objects
		equal( actual, expected, actual );
	});

	Test("chat.toBabel(msg, dialect, custom type)", Test.EXPECT( 1 ), function() {
		REQUIRE( "chat.CUSTOM_DATA" );

		// fake position object
		var pos = {
			type: chat.CUSTOM_DATA,
			x : 1, y : 2,
			other: true // any additional properties should be retained 
		}

		var actual = chat.toBabel("test", "foo", pos);
		// note: chat.CUSTOM_DATA is a string, hence it needs enclosing in quotes in expected value
		var expected = 'foo‼test‼{"type":"'+chat.CUSTOM_DATA+'","x":1,"y":2,"other":true}';
		// this tests that POSITION-like objects with .type retain that .type
		equal( actual, expected, actual );
	});

	Test("chat.toBabel(msg, dialect, research)", Test.EXPECT( 1 ), function() {
		// get a droid (assumes there is one on map)
		var research = enumResearch()[0];

		var actual = chat.toBabel("test", "foo", research);
		var expected = 'foo‼test‼{"type":'+research.type+',"name":"'+research.name+'"}';
		// this tests that RESEARCH_DATA objects work ok, and are minified
		equal( actual, expected, actual );
	});

	Test("chat.toBabel(msg, dialect, player)", Test.EXPECT( 1 ), function() {
		// get a droid (assumes there is one on map)
		var player = playerData[me];

		var actual = chat.toBabel("test", "foo", player);
		var expected = 'foo‼test‼{"type":'+player.type+',"id":'+me+'}';
		// this tests that PLAYER_DATA objects work ok, and are minified
		equal( actual, expected, actual );
	});

	// /////////////////////////////////////////////////////////////////
	// TEST: ISBABEL INVOCATION

	Test.module(
		self.file+"/chat.isBabel() invocaton",
		{		
			url: "https://warzone.atlassian.net/wiki/pages/viewpage.action?pageId=16777469",
			setup: function() {
				REQUIRE( "chat.toBabel() defined" );
				REQUIRE( "chat.isBabel() defined" );
			}
		}
	);
	
	Test("chat.isBabel(msg)", Test.EXPECT( 3 ), function() {		
		equal( chat.isBabel(), false, "Non-String messages don't throw an error" );
		
		equal( chat.isBabel("test"), false, "Non-Babel messages return false" );
		
		equal( chat.isBabel(chat.toBabel()), true, "Only Babel-formatted messages return true, even empty ones" );
	});

	// /////////////////////////////////////////////////////////////////
	// TEST: FROMBABEL INVOCATIONS

	Test.module(
		self.file+"/chat.fromBabel() invocatons",
		{		
			url: "https://warzone.atlassian.net/wiki/pages/viewpage.action?pageId=16777471",
			setup: function() {
				REQUIRE( "chat.toBabel() defined" );
			}
		}
	);

	Test("chat.fromBabel(msg)", Test.EXPECT( 1 ), function() {
		var message = "test";
		var dialect; // should default to "ai"
		var data; // should default to undefined

		var actual = chat.fromBabel( 0, 1, chat.toBabel(message) );
		
		var expected = [ 0, 1, message, "ai", undefined ];
	
		deepEqual( actual, expected, "Successful roundtrip" );
	});

	Test("chat.fromBabel(msg with spaces)", Test.EXPECT( 1 ), function() {
		var message = "test 1 2 3";
		var dialect; // should default to "ai"
		var data; // should default to undefined

		var actual = chat.fromBabel( 0, 1, chat.toBabel(message) );
		
		var expected = [ 0, 1, message, "ai", undefined ];
	
		deepEqual( actual, expected, "Successful roundtrip" );
	});

	Test("chat.fromBabel(msg, dialect)", Test.EXPECT( 1 ), function() {
		var message = "test";
		var dialect = "foo";
		var data; // should default to undefined

		var actual = chat.fromBabel( 0, 1, chat.toBabel(message, dialect) );
		
		var expected = [ 0, 1, message, dialect, undefined ];
	
		deepEqual( actual, expected, "Successful roundtrip" );
	});

	Test("chat.fromBabel(msg, dialect, true)", Test.EXPECT( 1 ), function() {
		var message = "test";
		var dialect = "foo";
		var data    = true;

		var actual = chat.fromBabel( 0, 1, chat.toBabel(message, dialect, data) );
		
		var expected = [ 0, 1, message, dialect, data ];
	
		deepEqual( actual, expected, "Successful roundtrip" );
	});

	Test("chat.fromBabel(msg, dialect, object)", Test.EXPECT( 1 ), function() {
		var message = "test";
		var dialect = "foo";
		var data    = {foo:"bar"};

		var actual = chat.fromBabel( 0, 1, chat.toBabel(message, dialect, data) );
		
		var expected = [ 0, 1, message, dialect, data ];
	
		deepEqual( actual, expected, "Successful roundtrip" );
	});

	Test("chat.fromBabel(msg, dialect, array)", Test.EXPECT( 1 ), function() {
		var message = "test";
		var dialect = "foo";
		var data    = ["bar", true];

		var actual = chat.fromBabel( 0, 1, chat.toBabel(message, dialect, data) );
		
		var expected = [ 0, 1, message, dialect, data ];
	
		deepEqual( actual, expected, "Successful roundtrip" );
	});

	Test("chat.fromBabel(msg, dialect, droid)", Test.EXPECT( 1 ), function() {
		var message = "test";
		var dialect = "foo";
		var data    = enumDroid()[0]; // note: assumes droid exists on map when test is run

		var actual = chat.fromBabel( 0, 1, chat.toBabel(message, dialect, data) );

		var expected = [ 0, 1, message, dialect, data ];
	
		// comment(  chat.toBabel(message, dialect, data) );
		deepEqual( actual, expected, "Successful roundtrip" );
	});

	Test("chat.fromBabel(msg, dialect, structure)", Test.EXPECT( 1 ), function() {
		var message = "test";
		var dialect = "foo";
		var data    = enumStruct()[0]; // note: assumes structure exists on map when test is run

		var actual = chat.fromBabel( 0, 1, chat.toBabel(message, dialect, data) );

		var expected = [ 0, 1, message, dialect, data ];
	
		// comment(  chat.toBabel(message, dialect, data) );
		deepEqual( actual, expected, "Successful roundtrip" );
	});

	Test("chat.fromBabel(msg, dialect, feature)", Test.EXPECT( 1 ), function() {
		var message = "test";
		var dialect = "foo";
		var data    = enumFeature(-1)[0]; // note: assumes feature exists on map when test is run

		if (!data) {
			comment( "enumFeature(-1) is failing -- bug #3817?" );
			ABORT( "Could not find any feature objects :(" );
		}

		var actual = chat.fromBabel( 0, 1, chat.toBabel(message, dialect, data) );
		
		var expected = [ 0, 1, message, dialect, data ];
		
		deepEqual( actual, expected, "Successful roundtrip" );
	});

	Test("chat.fromBabel(msg, dialect, area)", Test.EXPECT( 1 ), function() {
		var message = "test";
		var dialect = "foo";
		var data    = {type: AREA, x : 1, y : 2, x2 : 3, y2 : 4, other: true};

		var actual = chat.fromBabel( 0, 1, chat.toBabel(message, dialect, data) );
		
		var expected = [ 0, 1, message, dialect, data ];
	
		deepEqual( actual, expected, "Successful roundtrip" );
	});

	Test("chat.fromBabel(msg, dialect, position)", Test.EXPECT( 1 ), function() {
		var message = "test";
		var dialect = "foo";
		var data    = {type: POSITION, x : 1, y : 2, other: true};

		var actual = chat.fromBabel( 0, 1, chat.toBabel(message, dialect, data) );
		
		var expected = [ 0, 1, message, dialect, data ];
	
		deepEqual( actual, expected, "Successful roundtrip" );
	});

	Test("chat.fromBabel(msg, dialect, position-like)", Test.EXPECT( 1 ), function() {
		var message = "test";
		var dialect = "foo";
		var data    = {x : 1, y : 2, other: true};

		var actual = chat.fromBabel( 0, 1, chat.toBabel(message, dialect, data) );

		var expectedData = {type: POSITION, x : 1, y : 2, other: true}; // .type added by Babel

		var expected = [ 0, 1, message, dialect, expectedData ];
	
		deepEqual( actual, expected, "Successful roundtrip" );
	});

	Test("chat.fromBabel(msg, dialect, position-like, removeType)", Test.EXPECT( 1 ), function() {
		REQUIRE( "chat.removeType() defined" );
		
		var message = "test";
		var dialect = "foo";
		var data    = {x : 1, y : 2, other: true};

		var actual = chat.fromBabel( 0, 1, chat.toBabel(message, dialect, data, chat.removeType) );
		
		var expected = [ 0, 1, message, dialect, data ];
	
		deepEqual( actual, expected, "Successful roundtrip" );
	});

	Test("chat.fromBabel(msg, dialect, custom type)", Test.EXPECT( 1 ), function() {
		REQUIRE( "chat.CUSTOM_DATA" );
	
		var message = "test";
		var dialect = "foo";
		var data    = {type: chat.CUSTOM_DATA, x : 1, y : 2, other: true};

		var actual = chat.fromBabel( 0, 1, chat.toBabel(message, dialect, data) );

		var expected = [ 0, 1, message, dialect, data ];
	
		deepEqual( actual, expected, "Successful roundtrip" );
	});

	Test("chat.fromBabel(msg, dialect, research)", Test.EXPECT( 1 ), function() {
		var message = "test";
		var dialect = "foo";
		var data    = enumResearch()[0];

		var actual = chat.fromBabel( 0, 1, chat.toBabel(message, dialect, data) );
		
		var expected = [ 0, 1, message, dialect, data ];
	
		deepEqual( actual, expected, "Successful roundtrip" );
	});

	Test("chat.fromBabel(msg, dialect, player)", Test.EXPECT( 1 ), function() {
		var message = "test";
		var dialect = "foo";
		var data    = (CheckAvailable && Check.has("APIs/Players.js", Check.ANY_VERSON, Check.LAZY_LOAD))
			? Players[me]
			: playerData[me];

		var actual = chat.fromBabel( 0, 1, chat.toBabel(message, dialect, data) );
				
		var expected = [ 0, 1, message, dialect, data ];
	
		deepEqual( actual, expected, "Successful roundtrip" );
	});


	// /////////////////////////////////////////////////////////////////
	// INTERNAL: CONFIRM API AVAILABILITY

	if (CheckAvailable) Check.provide(self);

})(this);