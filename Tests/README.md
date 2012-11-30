EggPlant - Unit Tests
=====================

The files in under Tests/ folder are unit tests for EggPlant scripts.

For more information on the format of unit tests used in EggPlant, see [Test API](https://warzone.atlassian.net/wiki/display/EGG/Test+API).

Most APIs will use the [dependency checker](https://warzone.atlassian.net/wiki/display/EGG/Dependency+Checking) to lazy-load their test scripts once the Test API has loaded. This way you can avoid loading all the tests simply by not including the Test API. When Test API is loaded, all the associated test scripts will auto-load.