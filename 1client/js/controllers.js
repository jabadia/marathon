"use strict";

function WeekCalendarCtrl($scope)
{
	$scope.weeks = [];

	for(var i=0; i<18; i++)
	{
		var week = {
			id: i,
			index: 18-i,
			days: []
		}
		for(var day_id=0; day_id<7; day_id++)
		{
			var day = {
				id: day_id
			}
			week.days.push(day);
		}
		$scope.weeks.push(week);
	}

	/*
	)	
	{
		id: 0,
		index: 18,
		days: [
		{
			id: 0,
			plan: {
				distance: 10
			},
			actual: {
				distance: 10.12,
				time: 57 * 60 + 12,
				pace: 4 * 60 + 34,
			}
		},
		{
			id: 1
		},
		{
			id: 2,
			plan: {
				distance: 10
			},
		},
		{
			id: 3,
		},
		{
			id: 4,
		},
		{
			id: 5,
		},
		{
			id: 6,
		},

		]
	}
	];
	*/
}