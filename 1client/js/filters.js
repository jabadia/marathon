"use strict";

angular.module("trainingFilters",[]).
	filter('formatDistance',function($filter)
	{
		return function(input, units)
		{
			units = units || "km";
			return $filter('number')(input,1) + " " + units;
		}
	}).
	filter('formatTime',function()
	{
		return function(input)
		{
			var time = "";
			var min = Math.floor(input/60);
			var sec = Math.floor(input - (min * 60));
			var hour = Math.floor(min/60);
			if(sec < 10) sec = "0" + sec;
			if(hour)
			{
				min = min - hour * 60;
				time += hour + "h";
			}
			time += min + "'" + sec + '"';
			return time;
		}
	}).
	filter('formatDate',function()
	{
		return function(input)
		{
			var year = input.getFullYear();
			var month = input.getMonth()+1;
			var day = input.getDate();

			if(month < 10) month = "0" + month;
			if(day < 10) day = "0" + day;

			return [day,month,year].join('-');
		}		
	});