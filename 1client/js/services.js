"use strict";

var api_url = "http://127.0.0.1\\:4740";

angular.module("userService", ['ngResource']).
	factory("User", function($resource)
	{
		return $resource(
			api_url + "/user/:uid",
			{ uid: "@_id" }
		);
	});

angular.module("competitionService", ['ngResource']).
	factory("Competition", function($resource)
	{
		return $resource(
			api_url + "/competition/:cid",
			{ cid: "@_id" }
		);
	});

angular.module("planService", ['ngResource']).
	factory("Plan", function($resource)
	{
		return $resource(
			api_url + "/plan/:pid",
			{ pid: "@_id" }
		);
	});

