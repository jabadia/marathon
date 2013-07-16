"use strict";

angular.module("trainingFilters",[]).
	filter('formatDistance',function($filter)
	{
		return function(input, units)
		{
			units = units || "km";
			return $filter('number')(input,3) + " " + units;
		}
	}).
	filter('formatTime',function()
	{
		return function(input)
		{
			var min = Math.floor(input/60);
			var sec = input - (min * 60)
			if(sec < 10) sec = "0" + sec;
			return min + "'" + sec + '"';
		}
	}).
	filter('formatDate',function()
	{
		return function(input)
		{
			var year = input.getFullYear();
			var month = input.getMonth()+1;
			var day = input.getDate();

			return [day,month,year].join('-');
		}		
	});