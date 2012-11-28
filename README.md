EggPlant AI
===========

EggPlant is an AI (bot player) for the classic RTS game, [Warzone 2100](http://wz2100.net/). It's in early stages of development -- you can follow my ramblings about it in the [WZ forums](http://forums.wz2100.net/viewtopic.php?f=35&t=8801).

I'm hoping for an initial beta release in Q1 2013.

EggPlant APIs
=============

I decided to create a series of [APIs](https://warzone.atlassian.net/wiki/display/EGG/Developer+Guide), and have each API deal with a component of the AIs architecture. This way I can easily change it's component parts without having to wade through a single massive script.

I have future plans to use EggPlant AI and/or it's APIs to build challenges and maybe even campaign missions, so if EggPlant seems over-engineered from an AI perspective please bear my future plans in mind. The AI is just the tip of the iceberg :)

Currently, I'm working on the foundations -- things like dependency checking, unit testing, caching, etc. Many of these APIs can easily be used in other projects.

All APIs, with the sole exception of Test API, rely on the [Util API](https://warzone.atlassian.net/wiki/display/EGG/Util+API) which provides a load of features that are used to construct APIs, in particular the [Dependency Checker](https://warzone.atlassian.net/wiki/display/EGG/Dependency+Checking).

The [Test API](https://warzone.atlassian.net/wiki/display/EGG/Test+API), which is loosely based on [QUnit](http://qunitjs.com/) is designed to run stand-alone, as I imagine it will be more widely used by other developers. Even though it doesn't rely on Util API, it will automatically use it's features (dependency checking, type checking, etc) if it's available. If you want to discuss the Test API, use [this forum topic](http://forums.wz2100.net/viewtopic.php?f=35&t=10254) -- feedback is always most welcome!

I'll be releasing more APIs as they reach a point where I'm not refactoring them every 5 minutes. My goal is to have near-complete code coverage by unit tests, and full documentation with examples, before releasing an API.

Folder Structures
-----------------

There are lots and lots of files in EggPlant, so I decided to group them in to folders as follows (note: many of these folders not yet pushed to github):

* [APIs](https://github.com/aubergine10/EggPlant/tree/master/APIs) -- the main APIs, they are all documented in the [wiki](https://warzone.atlassian.net/wiki/display/EGG/Developer+Guide)
* [Config](https://github.com/aubergine10/EggPlant/tree/master/Config) -- basic config/settings for APIs
* Chats -- Chat commands (requires [Chat API](https://warzone.atlassian.net/wiki/display/EGG/Chat+API))
* Defines -- Shims, polyfils, and other tweaks to native JS API features (requires [Define API](https://warzone.atlassian.net/wiki/display/EGG/Define+API))
* Diags -- Diagnostic routines (requires [Diag API](https://warzone.atlassian.net/wiki/display/EGG/Diag+API))
* [Tests](https://github.com/aubergine10/EggPlant/tree/master/Tests) -- unit test scripts (requires [Test API](https://warzone.atlassian.net/wiki/display/EGG/Test+API))

License
=======

Everything in EggPlant is licensed as [CC-BY-SA 3.0](http://creativecommons.org/licenses/by-sa/3.0/) so you're free to grab it and use it in your own projects. All I ask is that you include some attribution by having a link to [https://warzone.atlassian.net/wiki/display/EGG](https://warzone.atlassian.net/wiki/display/EGG).