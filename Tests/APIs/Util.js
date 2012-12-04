// TEST - UTIL API
//
// Purpose:
// * Test Util API features
//
// License:
// * CC-BY-SA 3.0: http://creativecommons.org/licenses/by-sa/3.0/
// * URL: https://warzone.atlassian.net/wiki/display/EGG/Test+API
//
// /////////////////////////////////////////////////////////////////

void (function TestUtil() {

	var self = {
		file: "Tests/APIs/Util.js",
		ver : 1.0
	};

	var dependencies = {
		"APIs/Util.js": Check.ANY_VERSION,
		"APIs/Test.js": Check.ANY_VERSION
	}
	
	Check.required(dependencies, self);

	// /////////////////////////////////////////////////////////////////
	// TEST: UTIL

	Test.module(
		self.file,
		{
			url: "https://warzone.atlassian.net/wiki/display/EGG/Util+API"
		}
	);

	// /////////////////////////////////////////////////////////////////
	// TEST: PROPERTY DEFINITIONS

	Test.module(
		self.file+"/Property Definitions",
		{
			url: "https://warzone.atlassian.net/wiki/display/EGG/Property+Definitions",
			moduleData: [
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
			]
		}
	);

	Test("addProp() mask constants", Test.EXPECT( 2*11 ), function() {
		// If constants are missing or unexpected values,
		// vast swathes of APIs will break.
		moduleData.forEach( function(key, value) {

			if ( hasNative( key ) ) equal( _global[key], value, key+" == "+value );
			
		} );
	});

	Test("addProp() function", Test.EXPECT( 1 ), function() {
		REQUIRE( "^" );

		ok( typeOf(Object.prototype.addProp)=="function", "addProp() defined" );
	});

	Test("addProp() invocations", Test.EXPECT( 4*11 ), function() {
		REQUIRE( "^" );
	
		var obj = {};
		var testVal;
		var getter = function() { return testVal };
		var setter = function(val) { testVal = val };
		var expected;
	
		moduleData.forEach( function(key) {
		
			comment( key+":" );
		
			if ( key.indexOf("DATA_") == 0 ) { // data property
				obj.addProp(
					_global[key],	// constant value as defined by Util API
					key, 			// use constant name as property key
					false			// value
				);
			} else { // accessor property
				obj.addProp(
					_global[key],	// constant value as defined by Util API
					key,			// use constant name as property key
					getter,			// getter function
					setter			// setter function
				);
			}
		
			// was property added to obj?
			ok ( obj.hasOwnProperty(key), "Property added successfully" );
		
			// check enumerability (NORMAL = enumerable, HIDDEN = not enumerable)
			expected = ( key.indexOf("_HIDDEN") == -1 ); // true if key should be enumerable
			equal( obj.propertyIsEnumerable(key), expected, "Property is"+(expected ? "" : " not")+" enumerable" );
		
			// check writable or getter/setter (as applicable)
			if ( key.indexOf("DATA_") == 0 ) { // writeable check
				expected = (key.indexOf("_READONLY") == -1);
				obj[key] = true; // won't change if read-only (doesn't throw an error either)
				equal( obj[key], expected, "Property is "+(expected ? "writable" : "read-only") );
			} else { // getter/setter check
				testVal = false;
				obj[key] = true;
				equal( obj[key], true, "Property getter/setter functional" );
			}
			
			// check configurability
			expected = ( key.indexOf("_CONFIG") != -1 );
			try { // will throw TypeError if not configurable
				obj.addProp(
					DATA_NORMAL,	// will try and set writable = true, configurable = false, enumerable = true
					key,			// try and overwrite the key
					"changed"		// new value
				);
			} catch(e) {
				// do nothing
			}
			equal( (obj[key]==="changed"), expected, "Property is"+(expected ? "" : " not")+" configurable" );

		} );
		
	});

	Test("addConst() function", Test.EXPECT( 1 ), function() {
		REQUIRE( "addProp() invocations" );

		ok( typeOf(Object.prototype.addConst)=="function", "addConst() defined" );
	});

	Test("addConst() invocation", Test.EXPECT( 5 ), function() {
		REQUIRE( "^" );

		var obj = {};
		
		obj.addConst("test", true);
		equal( true, obj.test, "Constant property added" );

		// should be read-only, non-configurable, non-enumerable
		var descriptor = Object.getOwnPropertyDescriptor(obj, "test");
		equal( descriptor.writable    , false, "Property is read-only" );
		equal( descriptor.enumerable  , false, "Property is not enumerable" );
		equal( descriptor.configurable, false, "Property is not configurable" );
		
		// should throw error if used on non-config property
		try {
			obj.addConst("test", false);
			ok( false, "Threw error when overwriting non-configurable property" );
		} catch(e) {
			ok( true, "Threw error when overwriting non-configurable property" );
		}
	});

	Test("addAccessor() function", Test.EXPECT( 1 ), function() {
		REQUIRE( "addProp() invocations" );

		ok( typeOf(Object.prototype.addAccessor)=="function", "addAccessor() defined" );
	});

	Test("addAccessor() invocation", Test.EXPECT( 3 ), function() {
		REQUIRE( "^" );

		var obj = {};
		
		var testVal = true;
		var getter = function() { return testVal };
		var setter = function(val) { testVal = val };
		
		obj.addAccessor("test", getter, setter);
		equal( obj.test, true, "Accessor property added" );

		obj.test = false;
		equal( testVal, false, "Accessor functioning properly" );
		
		// should throw error if used on non-config property
		try {
			obj.addAccessor("test", getter, setter);
			ok( false, "Threw error when overwriting non-configurable property" );
		} catch(e) {
			ok( true, "Threw error when overwriting non-configurable property" );
		}
	});

	// /////////////////////////////////////////////////////////////////
	// TEST: TYPE CHECKING

	Test.module(
		self.file+"/Type Checking",
		{
			url: "https://warzone.atlassian.net/wiki/display/EGG/Type+Checking",
		}
	);

	Test("typeOf() function", Test.EXPECT( 1 ), function() {
		ok( Object.prototype.hasOwnProperty("typeOf"), "typeOf() defined" );
	});

	Test("typeOf() invocations", Test.EXPECT( 21 ), function() {
		REQUIRE( "typeOf() function" );
		
		var Foo = function Foo(){};

		equal( typeOf({}),					"object",		"{} == 'object'"				);
		equal( typeOf([]),					"array",		"[] == 'array'"					);
		equal( typeOf(function(){}),		"function",		"function(){} == 'function'"	);
		equal( typeOf(Foo),					"function",		"Foo == 'function'"				);
		equal( typeOf(new Foo),				"object",		"new Foo == 'object'"			);
		equal( typeOf(arguments),			"arguments",	"arguments == 'arguments'"		);
		equal( typeOf(new TypeError),		"error",		"new TypeError == 'error'"		);
		equal( typeOf(new Date),			"date",			"new Date == 'date'"			);
		equal( typeOf(/a-z/),				"regexp",		"/a-z/ == 'regexp'"				);
		equal( typeOf(Math),				"math",			"Math == 'math'"				);
		equal( typeOf(JSON),				"json",			"JSON == 'json'"				);
		equal( typeOf(3),					"number",		"3 == 'number'"					);
		equal( typeOf(new Number(3)),		"number",		"new Number(3) == 'number'"		);
		equal( typeOf(NaN),					"nan",			"NaN == 'nan'"					);
		equal( typeOf("a"),					"string",		"'a' == 'string'"				);
		equal( typeOf(new String("a")),		"string",		"new String('a') == 'string'"	);
		equal( typeOf(true),				"boolean",		"true == 'boolean'"				);
		equal( typeOf(new Boolean(true)),	"boolean",		"new Boolean(true) == 'boolean'");
		equal( typeOf(_global),				"global",		"global == 'global'"			);
		equal( typeOf(undefined),			"undefined",	"undefined == 'undefined'"		);
		equal( typeOf(null),				"null",			"null == 'null'"				);
	});

	Test("classOf() function", Test.EXPECT( 1 ), function() {
		ok( Object.prototype.hasOwnProperty("classOf"), "classOf() defined" );
	});

	Test("classOf() invocations", Test.EXPECT( 22 ), function() {
		REQUIRE( "classOf() function" );
		
		var Foo = function Foo(){};
		var Bar = function(){}; // anon function

		equal( classOf({}),					"Object",		"{} == 'Object'"				);
		equal( classOf([]),					"Array",		"[] == 'Array'"					);
		equal( classOf(function(){}),		"Function",		"function(){} == 'Function'"	);
		equal( classOf(Foo),				"Function",		"Foo == 'Function'"				);
		equal( classOf(new Foo),			"Foo",			"new Foo == 'Foo'"				);
		equal( classOf(new Bar),			"<Anonymous>",	"new Bar == '<Anonymous>'"		);
		equal( classOf(arguments),			"Object",		"arguments == 'Object'"			);
		equal( classOf(new TypeError),		"TypeError",	"new TypeError == 'TypeError'"	);
		equal( classOf(new Date),			"Date",			"new Date == 'Date'"			);
		equal( classOf(/a-z/),				"RegExp",		"/a-z/ == 'RegExp'"				);
		equal( classOf(Math),				"Object",		"Math == 'Object'"				);
		equal( classOf(JSON),				"Object",		"JSON == 'Object'"				);
		equal( classOf(3),					"Number",		"3 == 'Number'"					);
		equal( classOf(new Number(3)),		"Number",		"new Number(3) == 'Number'"		);
		equal( classOf(NaN),				"Number",		"NaN == 'Number'"				);
		equal( classOf("a"),				"String",		"'a' == 'String'"				);
		equal( classOf(new String("a")),	"String",		"new String('a') == 'String'"	);
		equal( classOf(true),				"Boolean",		"true == 'Boolean'"				);
		equal( classOf(new Boolean(true)),	"Boolean",		"new Boolean(true) == 'Boolean'");
		equal( classOf(_global),			"Object",		"global == 'Object'"			);
		equal( classOf(undefined),			"Undefined",	"undefined == 'Undefined'"		);
		equal( classOf(null),				"Null",			"null == 'Null'"				);
	});


	Test("isArray property", Test.EXPECT( 1 ), function() {
		ok( Object.prototype.hasOwnProperty("isArray"), "isArray defined" );
	});

	Test("isArray tests", Test.EXPECT( 4 ), function() {
		REQUIRE( "isArray property" );
		
		equal( ({}).isArray, false, "({}).isArray == false" );
		equal( arguments.isArray, false, "arguments.isArray == false" );
		equal( Array.isArray, false, "Array.isArray == false" ); // Array class is a function
		equal( ([]).isArray, true, "([]).isArray == true" ); // check that all arrays get the prop
	});

	Test("isFunction property", Test.EXPECT( 1 ), function() {
		ok( Object.prototype.hasOwnProperty("isFunction"), "isFunction defined" );
	});

	Test("isFunction tests", Test.EXPECT( 5 ), function() {
		REQUIRE( "isFunction property" );
		
		var foo = function Foo(){};
		
		equal( ({}).isFunction, false, "({}).isFunction == false" );
		equal( ([]).isFunction, false, "([]).isFunction == false" );
		equal( Function.isFunction, true, "Function.isFunction == true" );
		equal( foo.isFunction, true, "foo.isFunction == true" ); // check that all functions get the prop
		equal( (new foo).isFunction, false, "(new foo).isFunction == false" ); // should be object
	});


	// /////////////////////////////////////////////////////////////////
	// TEST: GLOBALS

	Test.module(
		self.file+"/Globals",
		{
			url: "https://warzone.atlassian.net/wiki/display/EGG/Globals",
		}
	);

	Test("out() function", Test.EXPECT( 1 ), function() {
		hasNative( "out", "out() defined" );
	});

	Test("out() constants", Test.EXPECT( (6*2)+1 ), function(settings) {
		REQUIRE( "out() function" );
		
		( [	"CONSOLE",
			"DEBUG",
			"ERROR",
			"CHAT",
			"HOST",
			"RETURN"
		] ).forEach( function(key) {
			if ( ok( out.hasOwnProperty(key), "out."+key+" defined" ) ) equal( out[key], key, key+" == '"+key+"'" );
		} );
		
		if ( ok( out.hasOwnProperty("DEFAULT"), "out.DEFAULT defined" ) ) comment( "out.DEFAULT == '"+out.DEFAULT+"'" );
	});

	Test("out() invocation with out.CHAT", Test.EXPECT( 1 ), function() {
		REQUIRE( "out() constants" );

		comment( "Currently unable to test if the message is actually sent" );

		out("test", self, out.CHAT);
		
		ok( true, "It didn't crash" );
	});

	Test("out() invocation with out.CONSOLE", Test.EXPECT( 1 ), function() {
		REQUIRE( "out() constants" );

		comment( "Currently unable to test if the message is actually sent" );

		out("test", self, out.CONSOLE);
		
		ok( true, "It didn't crash" );
	});

	Test("out() invocation with out.DEBUG", Test.EXPECT( 1 ), function() {
		REQUIRE( "out() constants" );

		comment( "Currently unable to test if the message is actually sent" );

		out("test", self, out.DEBUG);
		
		ok( true, "It didn't crash" );
	});

	Test("out() invocation with out.DEFAULT", Test.EXPECT( 1 ), function() {
		REQUIRE( "out() constants" );

		comment( "Currently unable to test if the message is actually sent" );

		out("test", self, out.DEFAULT);
		
		ok( true, "It didn't crash" );
	});

	Test("out() invocation with out.ERROR", Test.EXPECT( 2 ), function() {
		REQUIRE( "out() constants" );

		try {
			out("test", self, out.ERROR);
			ok( false, "out.ERROR method throws an error" );
		} catch(e) {
			ok( true, "out.ERROR method throws an error" );
		}
		
		try {
			out("test", self, out.ERROR, TypeError);
			ok( false, "out.ERROR method with config throws a TypeError" );
		} catch(e) {
			ok( e instanceof TypeError, "out.ERROR method with config throws a TypeError" );
		}
	});

	Test("out() invocation with out.HOST", Test.EXPECT( 1 ), function() {
		REQUIRE( "out() constants" );

		comment( "Currently unable to test if the message is actually sent" );

		out("test", self, out.HOST);
		
		ok( true, "It didn't crash" );
	});

	Test("out() invocation with out.RETURN", Test.EXPECT( 1 ), function() {
		REQUIRE( "out() constants" );

		var actual = out("test", self, out.RETURN).join("; ");
		
		equal( actual, "["+self.file+" v"+self.ver+"]; test" , "Returned expected value" );
	});

	Test("global property", Test.EXPECT( 2 ), function() {
		if ( hasNative( "global" ) ) equal( global, _global, "Points to global object" );
	});

	Test("Native property", Test.EXPECT( 2 ), function() {
		if ( hasNative( "Native" ) ) equal( Native, _global, "Points to global object" );
	});

	Test("toArray() function", Test.EXPECT( 1 ), function() {
		hasNative( "toArray", "toArray() defined" );
	});

	Test("toArray() invocation", Test.EXPECT( 1 ), function() {
		REQUIRE( "toArray() function" );
		
		equal( toArray(arguments).isArray, true, "Successfully converted argument to array" );
	});

	Test("now property", Test.EXPECT( 2 ), function() {
		if ( hasNative( "now" ) ) ok( ((new Date).getTime()-now < 10), "Functioning properly" );
	});

	// /////////////////////////////////////////////////////////////////
	// TEST: FUNCTION MANIPULATION

	Test.module(
		self.file+"/Function Manipulation",
		{
			url: "https://warzone.atlassian.net/wiki/display/EGG/Function+Manipulation",
			moduleData: function(str1, str2) {
				return str1+" "+str2;
			}
		}
	);

	Test("function.curry() function", Test.EXPECT( 1 ), function() {
		ok( Function.prototype.hasOwnProperty("curry"), "Function.prototype.curry() defined" );
	});

	Test("function.curry() invocation", Test.EXPECT( 1 ), function() {
		REQUIRE( "function.curry() function" );
		
		ok.curry(true).call(currentTest, "Mmmm, curry!");
	});

	Test("function.wraps() function", Test.EXPECT( 1 ), function() {
		ok( Function.prototype.hasOwnProperty("curry"), "Function.prototype.curry() defined" );
	});

	Test("function.wraps() invocation", Test.EXPECT( 1 ), function() {
		REQUIRE( "function.wraps() function" );
		REQUIRE( "function.curry() function" );
		
		ok.curry(true).wraps(moduleData.curry("Wrapped")).call(currentTest, "in curry");
	});

	Test("n.times() function", Test.EXPECT( 2 ), function() {
		ok( Number.prototype.hasOwnProperty("times"), "Number.prototype.times() defined" );
		// check that number instances / primitives have it...
		ok( (2).__proto__.hasOwnProperty("times"), "(2).__proto__.times() defined" );
	});

	Test("(2).times() invocation", Test.EXPECT( 2 ), function() {
		REQUIRE( "n.times() function" );
		REQUIRE( "function.wraps() function" );
		REQUIRE( "function.curry() function" );
		
		(2).times(ok.curry(true).wraps(moduleData.curry("Iteration")), currentTest);
	});

	Test("(NaN).times() invocation", Test.EXPECT( 0 ), function() {
		REQUIRE( "n.times() function" );
		
		comment( "Should not do any iterations and therefore not generate any results" );
		
		(NaN).times(ABORT, this); // will throw abort signal if it iterates
	});

	Test("(-1).times() invocation", Test.EXPECT( 0 ), function() {
		REQUIRE( "n.times() function" );
		
		comment( "Should not do any iterations and therefore not generate any results" );
		
		(-1).times(ABORT, this); // will throw abort signal if it iterates
	});

	// /////////////////////////////////////////////////////////////////
	// TEST: INHERITANCE MODEL

	Test.module(
		self.file+"/Inheritance Model",
		{
			url: "https://warzone.atlassian.net/wiki/display/EGG/Inheritance+Model",
		}
	);

	Test("function.inherit() function", Test.EXPECT( 1 ), function() {
		ok( Function.prototype.hasOwnProperty("inherit"), "Function.prototype.inherit() defined" );
	});

	Test("function.inherit() invocation", Test.EXPECT( 6 ), function() {
		REQUIRE( "function.inherit() function" );
	
		var sClass = function() {
			ABORT( "Superclass constructor should not get called during inheritance" );
		}
		
		sClass.prototype.foo = "foo";
		sClass.prototype.bar = "bar";
	
		var klass = function Klass() {
			this.baz = "baz";
		}
		
		klass.inherit(sClass);
		
		klass.prototype.foo = "klass";
		
		var inst = new klass();
		
		equal( inst.baz, "baz", "Class constructor was invoked" );
		equal( inst.foo, "klass", "Class prototypes override superclass prototypes" );
		equal( inst.bar, "bar", "Superclass prototypes are inherited" );
		
		equal( inst.classOf(), "Klass", "Instance has correct class" );
		ok( inst instanceof klass, "Instance is an instance of the class" );
		ok( inst instanceof sClass, "Instance is an instance of the superclass" );
	});

	Test("object.super() function", Test.EXPECT( 2 ), function() {
		REQUIRE( "function.inherit() invocation" );
		
		var sClass = function() {};
		var klass = function Klass() {};

		equal( klass.prototype.hasOwnProperty("super"), false, ".super() method not available before inheritance" );

		klass.inherit(sClass);
		
		equal( klass.prototype.hasOwnProperty("super"), true, ".super() method available after inheritance" );
	});

	Test("object.super() invocations", Test.EXPECT( 6 ), function() {
		REQUIRE( "object.super() function" );
	
		var sClass = function(str) {
			equal( str, "ping", "Superclass constructor invoked with param" );
			return "pong";
		}
		
		sClass.prototype.foo = function(str) {
			equal( str, "ping", "Superclass .foo() invoked with param" );
			return "pong";
		}
	
		var klass = function Klass() {
			ok( true, "Class constructor invoked" );
			
			var ping = this["super"]("ping"); // pls excuse weird syntax, it's due to eval parse error :s
			equal( ping, "pong", "Superclass constructor return value received" );
		}
		
		klass.inherit(sClass);
		
		klass.prototype.foo = function() {
			ok ( true, "Class .foo() invoked" );
			
			var ping = this["super"]("ping"); // pls excuse weird syntax, it's due to eval parse error :s
			equal( ping, "pong", "Superclass .foo() return value received" );
		}
		
		var inst = new klass();
		
		inst.foo();
	});


	// /////////////////////////////////////////////////////////////////
	// INTERNAL: CONFIRM API AVAILABILITY

	Check.provide(self);

})();