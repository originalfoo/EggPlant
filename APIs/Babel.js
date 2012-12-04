// BABEL API: AI-to-AI MESSAGE SYSTEM
//
// Purpose:
// * Standard protocol for AI-to-AI communication
// * Make it easy for AIs to send and receive JS API and custom objects over chat()
//
// Supported object types:
// * https://warzone.atlassian.net/wiki/display/jsapi/Objects
// * And any primitive, array or object :)
// * Functions and other grim stuff automatically filtered
//
// License:
// * CC-BY-SA 3.0: http://creativecommons.org/licenses/by-sa/3.0/
// * URL: http://forums.wz2100.net/viewtopic.php?f=5&t=10329
//
// /////////////////////////////////////////////////////////////////

void (function BabelAPI(_global) {

	var self = {
		file: "APIs/Babel.js",
		ver : 1.0
	};

	var CheckAvailable = _global.hasOwnProperty("Check"); // is dependency checker installed?

	if (CheckAvailable) {
	
		var dependencies = {
			"APIs/Util.js"  : Check.ANY_VERSION
		}
		
		Check.required(dependencies, self);
	}

	// /////////////////////////////////////////////////////////////////
	// DIANOSTIC ROUTINES
	// https://warzone.atlassian.net/wiki/display/EGG/Diag+API
/*	
	if (CheckAvailable) {
		Check.doWhen(
			{"APIs/Diag.js": Check.ANY_VERSION}, self,
			"Diags/Babel.js",
			Check.LAZY_LOAD
		);
	}
*/
	// /////////////////////////////////////////////////////////////////
	// TEST ROUTINES
	// https://warzone.atlassian.net/wiki/display/EGG/Test+API
	
	if (CheckAvailable) {
		Check.doWhen(
			{"APIs/Test.js": Check.ANY_VERSION}, self,
			"Tests/APIs/Babel.js",
			Check.LAZY_LOAD
		);
	}

	// /////////////////////////////////////////////////////////////////
	// INTERNAL: CREATE READ-ONLY PROPERTY
	// makeConst(object, propertyName, value);
	//
	// Based on: https://warzone.atlassian.net/wiki/pages/viewpage.action?pageId=14811547
	
	// internal function for making a property with following settings:
	var oDesc = {writable: false, configurable: false};
	
	var ENUMERABLE = true; // fake constant to aid code readability elsewhere
	
	function makeConst(obj, key, value, enumerable) {
		oDesc.value = value;
		oDesc.enumerable = !!enumerable;
	    Object.defineProperty( obj, key, oDesc );
	}

	// /////////////////////////////////////////////////////////////////
	// INTERNAL: PATCH MISSING API FEATURE
	// api( featureName, value );
	//
	// Based on: https://warzone.atlassian.net/wiki/display/EGG/Define+API

	var api = _global.hasOwnProperty("Define")
		? ( function(key, value) {
				if ( !Define.has(key) ) Define( key, value ); // create it as a const in global scope
			} )
		: ( function(key, value) {
				if ( !_global.hasOwnProperty(key) ) {
					makeConst( _global, key, value ); // create it as const property on global object
				}
			} );

	// /////////////////////////////////////////////////////////////////
	// PUBLIC: FAKE CHAT FUNCTION FOR WZ 3.1
	// https://warzone.atlassian.net/wiki/display/EGG/Babel+on+Warzone+3.1

	api("chat",
		function fakeChat(to, msg) {
			if ( to == me ) { // trigger eventChat() -- for unit testing on wz3.1
				eventChat(me, me, msg);
			} else { // output to console
				console( "fakeChat("+to+", '"+msg+"')" );
			}
		}
	);

	var wz31 = ( chat.name == "fakeChat" ); // we can skip some crack-filling if this is false

	// /////////////////////////////////////////////////////////////////
	// PUBLIC: ADD MISSING CONSTANTS
	// If JS API constant is missing, add it to JS API
	// https://warzone.atlassian.net/wiki/display/EGG/Babel+on+Warzone+3.1
	// https://warzone.atlassian.net/wiki/display/EGG/Data+types

	if (wz31) { // check for missing constants
		api( "POSITION"     , 5 );
		api( "PLAYER_DATA"  , 7 );
		api( "RESEARCH_DATA", 8 );

	}

	// make sure playerData has custom .id property to make working with it easier
	// also make sure it has .type = PLAYER_DATA on old versions of WZ
	playerData.forEach( function(player, id) {
		if (!player.hasOwnProperty("id")) makeConst(playerData[id], "id", id, ENUMERABLE);
		if (!player.hasOwnProperty("type")) makeConst(playerData[id], "type", PLAYER_DATA, ENUMERABLE);		
	} );

	// /////////////////////////////////////////////////////////////////
	// PUBLIC: chat.CUSTOM_DATA CONSTANT
	// https://warzone.atlassian.net/wiki/display/EGG/Data+types

	makeConst( chat, "CUSTOM_DATA", "CUSTOM_DATA" );

	// /////////////////////////////////////////////////////////////////
	// INTERNAL: IDENTIFY TYPE OF WZ JS API OBJECT
	// Some releases of WZ 3.1 were missing '.type' properties on JS API objects
	// This function fixes that.
	
	// NOTE: Might make this pluggable in future...?

	var identifyTypeOf = function(data) {
		
		identifyTypeOf.apiObject.some( function has(match, identifiedObjType) {
		
			if ( match.every(function listed(key) { // is this something we recognise?
				return data.hasOwnProperty(key);
			}) ) { // yes, found what we're looking for
				data.type = identifiedObjType;
				return true;
			}
			
		} );
		
		return data;
	}
	
	// these are the objects that sometimes have missing .type property, and the keys we look for to identify them
	identifyTypeOf.apiObject = [];
	identifyTypeOf.apiObject[POSITION] = ["x", "y"]; // https://warzone.atlassian.net/wiki/display/EGG/Position-like+Objects
	if (wz31) identifyTypeOf.apiObject[RESEARCH_DATA] = ["started", "done", "name"];

	// /////////////////////////////////////////////////////////////////
	// INTERNAL: BABEL CONSTANTS - DO *NOT* CHANGE
	// PLING is used to split component parts of Babel messages

	makeConst( chat, "PLING" , "‼" );

	// /////////////////////////////////////////////////////////////////
	// PUBLIC: IS MESSAGE BABEL FORMATTED?
	// Returns true if the message was sent via this API, false otherwise
	// https://warzone.atlassian.net/wiki/pages/viewpage.action?pageId=16777469

	makeConst( chat, "isBabel",
		function(msg) {
			return ( String(msg).indexOf(chat.PLING) > 0 ); // must be at char 1 or above
		}
	);

	// /////////////////////////////////////////////////////////////////
	// PUBLIC: DECOMPILE BABEL MESSAGE
	// Returns array that looks like: [sender, to, message, dialect, data]
	// https://warzone.atlassian.net/wiki/pages/viewpage.action?pageId=16777471

	var UNRECOGNISED = -1;
	var DIALECT = 0;
	var MESSAGE = 1;
	var DATA = 2;

	var hasPlayersAPI = (CheckAvailable)
		? Check.has("APIs/Players.js", Check.ANY_VERSION) // will try to auto-load if not installed
		: false;

	makeConst( chat, "fromBabel",
		function(sender, to, babel) {

			var chunks, gameObj;
			
			if (babel.indexOf(chat.PLING) == UNRECOGNISED) {
				chunks = [];
				// https://warzone.atlassian.net/wiki/display/EGG/Error+Dialect
				chunks[DIALECT] = "error";
				chunks[MESSAGE] = "chat.fromBabel(): Unrecognised message format";
				chunks[DATA]    = babel; // dump in received msg
			} else {
				chunks = babel.split(chat.PLING); // [dialect, message, data]
				try {
					// parse JSON data
					chunks[DATA] = (chunks.length > DATA)
						? ( chunks[DATA] == "undefined" ? undefined : JSON.parse(chunks[DATA]) )
						: undefined;
					// reconstruct JS API objects if applicable
					if (chunks[DATA] && chunks[DATA].hasOwnProperty("type")) {
						switch (chunks[DATA].type) {
							case PLAYER_DATA: {
							
								// return enhanced Players Object if Players API installed
								chunks[DATA] = (hasPlayersAPI)
									? Players[chunks[DATA].id]
									: playerData[chunks[DATA].id];
								break;
								
							}
							case RESEARCH_DATA: {
							
								chunks[DATA] = getResearch( chunks[DATA].name );
								if ( wz31 && !chunks[DATA].hasOwnProperty("type") ) {
									chunks[DATA].type = RESEARCH_DATA;
								}
								break;
								
							}
							case DROID:
							case FEATURE:
							case STRUCTURE: {
							
								try {
									// will throw error if obj not found on WZ 3.1 RC3 and earlier...
									gameObj = objFromId( {id:chunks[DATA].id, player:chunks[DATA].player} );
									if (!gameObj) {
										throw new Error("meh."); // might as well re-use the try..catch block heh
									} else {
										chunks[DATA] = gameObj;
									}
								} catch(e) {
									throw new ReferenceError("Game object no longer exists on map");
								}
								break;
								
							}
						} // end switch
					}
				} catch(e) {
					// https://warzone.atlassian.net/wiki/display/EGG/Error+Dialect
					chunks[DIALECT] = "error";
					chunks[MESSAGE] = "chat.fromBabel(): "+e.message;
					chunks[DATA]    = babel; // dump in received msg
				}
			}
			
			// chunks currently looks like this:
			// [dialect, message, data]
			
			chunks.unshift( chunks.splice(MESSAGE, 1)[0] );
			
			// chunks now looks like this:
			// [message, dialect, data]
			
			chunks.unshift( sender, to );
			
			// our final chunks:
			// [sender, to, message, dialect, data]
			
			return chunks;
		}
	);

	// /////////////////////////////////////////////////////////////////
	// PUBLIC: REMOVE OBJECT TYPE
	// Removes the .type property from an object during JSON stringification
	// https://warzone.atlassian.net/wiki/display/EGG/Position-like+Objects

	makeConst( chat, "removeType",
		function(key, value) {
			return (key == "type")
				? undefined
				: value;
		}
	);

	// /////////////////////////////////////////////////////////////////
	// PUBLIC: COMPILE BABEL MESSAGE
	// Converts parms in to a babel message
	// https://warzone.atlassian.net/wiki/pages/viewpage.action?pageId=16777475

	var reps = []; // replacers to minify certain JS API objects, they get rebuilt during chat.fromBabel()
	reps[PLAYER_DATA]   = ["type", "id"];
	reps[RESEARCH_DATA] = ["type", "name"];
	reps[DROID]         = ["type", "id", "player"];
	reps[FEATURE]       = ["type", "id", "player"];
	reps[STRUCTURE]     = ["type", "id", "player"];

	makeConst( chat, "toBabel",
		function(msg, dialect, data, replacer) {

			// compile ai prefix
			dialect = ( dialect || "ai" ); // eg. default to "ai" dialect

			// convert obj to string
			switch ( typeof data ) {
				case "null":
				case "undefined":
				case "number":
				case "boolean":
				case "string":
				case "array": {
					data = JSON.stringify(data);
					break;
				}
				case "object": {
					if ( !data.hasOwnProperty("type") && replacer !== chat.removeType ) data = identifyTypeOf( data );
					// now work out how to stringify it...
					switch ( (data.hasOwnProperty("type") ? data.type : chat.CUSTOM_DATA) ) {
						case AREA:
						case POSITION:
						case chat.CUSTOM_DATA: {
							data = JSON.stringify( data, replacer );
							break;
						}
						case DROID:
						case FEATURE:
						case STRUCTURE:
						case PLAYER_DATA:
						case RESEARCH_DATA: {
							data = JSON.stringify( data, reps[data.type] );
							break;
						}
						default: {
							data = JSON.stringify( data, replacer );
						}
					} //end switch ( data.type )
					
					break; // case "object"
				}
				default: { // don't send it!
					data = "";
				}
			} //end switch (typeof data)
			
			// return the compiled message (note: dialect now before msg)
			return dialect + chat.PLING + msg + chat.PLING + data; // dialect‼message‼data
		}
	);

	// /////////////////////////////////////////////////////////////////
	// INTERNAL: CONFIRM API AVAILABILITY

	if (CheckAvailable) Check.provide(self);

})(this);