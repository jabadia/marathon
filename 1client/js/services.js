"use strict";

var api_url = "http://127.0.0.1\\:4740";

angular.module("userService", ['ngResource']).
	factory("User", function($resource)
	{
		return $resource(
			api_url + "/users/:uid",
			{ uid: "@_id" }
		);
	});

angular.module("competitionService", ['ngResource']).
	factory("Competition", function($resource)
	{
		return $resource(
			api_url + "/competitions/:cid",
			{ cid: "@_id" }
		);
	});

angular.module("planService", ['ngResource']).
	factory("Plan", function($resource)
	{
		return $resource(
			api_url + "/plans/:pid",
			{ pid: "@_id" }			
		);
	});

angular.module("plannedRunService", ['ngResource']).
	factory("PlannedRun", function($resource)
	{
		return $resource(
			api_url + "/plans/:pid/:prid",
			{ pid: "@pid", prid: "@prid" },
			{
				'save': { method: 'PUT'}
			}
		);
	});

angular.module("actualRunService", ['ngResource']).
	factory("ActualRun", function($resource)
	{
		return $resource(
			api_url + "/users/:uid/runs/:rid",
			{ uid: "@uid", rid: "@rid" },
			{
				'save': { method: 'PUT'}
			}
		);
	});

angular.module("utilityService",[]).
	factory('Utils', function()
	{
		return {
			today: function()
			{
				var now = new Date();
				return new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate() ));
			},
			dateFromString: function(s)
			{
				var components = s.split('-');
				return new Date(Date.UTC( Number(components[0]), Number(components[1])-1, Number(components[2]) ));
			},
			stringFromDate: function(d)
			{
				var year = d.getUTCFullYear();
				var month = d.getUTCMonth() + 1;
				var day = d.getUTCDate();

				if( month < 10) month = "0" + month;
				if( day < 10) day = "0" + day;

				return [year,month,day].join('-');
			},
			mondayFromDate: function(dt)
			{
				var dayOfWeeek = dt.getUTCDay();

				if( dayOfWeeek == 0)
					return this.datePlusDays(dt,-6);
				else
					return this.datePlusDays(dt,-dayOfWeeek+1)
			},
			daysToMilliseconds: function(days)
			{
				return days * 1000 * 60 * 60 * 24;
			},
			millisecondsToDays: function(ms)
			{
				return ms /(1000 * 60 * 60 * 24);
			},
			datePlusDays: function(dt,days)
			{
				var ms = dt.getTime() + this.daysToMilliseconds(days);
				return new Date(ms);
			},
			daysBetween: function(dt0,dt1)
			{
				var ms = dt1.getTime()-dt0.getTime();
				return this.millisecondsToDays(ms);
			},
			parseDistance: function(str)
			{
				str = String(str);
				str = str.replace(',','.');
				str = str.replace('km','.').replace('m','').replace(' ','');
				var distance = parseFloat(str);
				console.log("parsing " + str + " into " + distance)
				if( isNaN(distance) )
					throw new Error('bad value');
				return distance;
			},
			parseTime: function(str)
			{
				var time = 0;
				var hours=0,mins=0,secs=0;
				var components;

				str = str.replace('h',':');
				str = str.replace("'",":");
				str = str.replace('"','');

				if( str.indexOf(':') != -1)
				{
					components = str.split(':');
					if( components.length == 3 )
					{
						hours = parseInt(components[0]);
						components.shift();
					}
					if( components.length == 2 )
					{
						mins = parseInt(components[0]);
						secs = parseInt(components[1]); 
						if( isNaN(mins) || isNaN(secs) )
							throw new Error('bad value');

						if( hours == 0 && mins < 5) // se asume que 1:15 es 1h y 15min, en lugar de 1min y 15sec
						{
							hours = mins;
							mins = secs;
							secs = 0;
						}
					}
				}
				else
				{
					hours = 0;
					mins = parseInt(str);
					secs = 0;
					if( isNaN(mins) )
						throw new Error('bad value');
				}
				time = hours * 3600 + mins * 60 + secs;
				console.log('parsing ' + str + ' into ' + time );
				return time;
			}
		}
	});

