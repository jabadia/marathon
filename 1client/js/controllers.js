"use strict";

function UserListCtrl($scope, $rootScope, $cookies, User)
{
	$scope.users = User.query();

	$scope.toggleAddMode = function()
	{
		$scope.addMode = !$scope.addMode;
		if( $scope.addMode )
			$scope.newUser = new User();
	}

	$scope.save = function()
	{
		console.log("saving! ", $scope.newUser);
		$scope.toggleAddMode();
		$scope.newUser.$save(function()
		{
			$scope.users = User.query();
		});
	}

	$scope.delete = function(user)
	{
		user.$delete(function()
		{
			$scope.users = User.query();
		});
	}

	$scope.select = function(user)
	{
		$rootScope.selectedUserId = user._id;
		$cookies.selectedUserId = user._id;
	}
}

function CompetitionListCtrl($scope, $rootScope, $cookies, Competition)
{
	$scope.competitions = Competition.query();

	$scope.select = function(competition)
	{
		$rootScope.selectedCompetitionId = competition._id;
		$cookies.selectedCompetitionId = competition._id;
	}
}

function PlanListCtrl($scope, $rootScope, $cookies, Plan)
{
	$scope.plans = Plan.query();

	$scope.select = function(plan)
	{
		$rootScope.selectedPlanId = plan._id;
		$cookies.selectedPlanId = plan._id;
	}
}

function WeekCalendarCtrl($scope, $rootScope, User, Competition, Plan, PlannedRun, ActualRun, Utils, $timeout, $filter)
{
	console.log("WeekCalendarCtrl");

	$scope.weeks = [];

	/* -- planned runs --*/

	$scope.addPlannedRun = function(day)
	{
		day.newPlannedRun = new PlannedRun(
		{ 
			pid 	: $scope.plan._id,
			prid 	: day.index,
			distance: 0, 
			comments: "" 
		});
		$timeout(function()
		{
			//$('d' + day.index).find('input')[0].focus();
			console.log("setting focus");
		},100);
	};

	$scope.editPlannedRun = function(day)
	{
		day.newPlannedRun = new PlannedRun(
		{ 
			pid 	: $scope.plan._id,
			prid 	: day.index,
			distance: day.plan.distance, 
			comments: day.plan.comments 
		});
	};

	$scope.savePlannedRun = function(day)
	{
		try
		{
			day.newPlannedRun.distance = Utils.parseDistance(day.newPlannedRun.distance);
		}
		catch(e)
		{
			return;
		}

		console.log("saving ", day.newPlannedRun);
		day.newPlannedRun.$save(function(){
			console.log("saved!!");
			// FALTA: actualizar instantaneamente, asignando a day.plan los valores que vienen en day.newPlannedRun
			delete day.newPlannedRun;
			$scope.plan = Plan.get({pid: $rootScope.selectedPlanId}, function()
			{
				updateWeeks($scope);
			});
		});
	}

	$scope.cancelPlannedRun = function(day)
	{
		delete day.newPlannedRun;
	}

	$scope.deletePlannedRun = function(day)
	{
		var plannedRun = new PlannedRun(
		{
			pid: $scope.plan._id,
			prid: day.index
		});
		plannedRun.$delete(function()
		{
			console.log("deleted!!");
			$scope.plan = Plan.get({pid: $rootScope.selectedPlanId}, function()
			{
				updateWeeks($scope);
			});				
		});
	}

	/* -- actual runs --*/

	$scope.addActualRun = function(day)
	{
		day.newActualRun = new ActualRun(
		{ 
			uid 	: $scope.user._id,
			rid 	: Utils.stringFromDate(day.date),
			distance: 0, 
			time    : 0,
			timeStr : $filter('formatTime')(0)
		});
		$timeout(function()
		{
			//$('d' + day.index).find('input')[0].focus();
			console.log("setting focus");
		},100);
	};

	$scope.editActualRun = function(day)
	{
		day.newActualRun = new ActualRun(
		{ 
			uid 	: $scope.user._id,
			rid 	: Utils.stringFromDate(day.date),
			distance: day.actual.distance, 
			time    : day.actual.time,
			timeStr : $filter('formatTime')(day.actual.time)
		});
	};

	$scope.saveActualRun = function(day)
	{
		try
		{
			day.newActualRun.distance = Utils.parseDistance(day.newActualRun.distance);
			day.newActualRun.time     = Utils.parseTime(day.newActualRun.timeStr);
		}
		catch(e)
		{
			return;
		}

		console.log("saving ", day.newActualRun);
		day.newActualRun.$save(function(){
			console.log("saved!!");
			// FALTA: actualizar instantaneamente, asignando a day.plan los valores que vienen en day.newActualRun
			delete day.newActualRun;
			$scope.runs = ActualRun.query({ uid: $scope.user._id }, function()
			{
			 	updateWeeks($scope);
			});
		});
	}

	$scope.cancelActualRun = function(day)
	{
		delete day.newActualRun;
	}

	$scope.deleteActualRun = function(day)
	{
		var actualRun = new ActualRun(
		{
			uid 	: $scope.user._id,
			rid 	: Utils.stringFromDate(day.date),
		});
		actualRun.$delete(function()
		{
			console.log("deleted!!");
			$scope.runs = ActualRun.query({ uid: $scope.user._id }, function()
			{
			 	updateWeeks($scope);
			});				
		});
	}


	/* -- populate calendar view -- */

	var updateWeeks = function($scope)
	{
		$scope.weeks = [];
		$scope.today = Utils.today();

		if( !($scope.competition && $scope.competition._id) && 
			!($scope.plan && $scope.plan._id) && 
			!($scope.user && $scope.user._id))
			return;

		// create weeks and days
		// if we have a plan && competition, then extend the calendar up to competition date
		// else, extend the calendar for two weeks from now

		// put planned runs into days
		if( $scope.competition && $scope.competition._id && $scope.plan && $scope.plan._id )
		{
			var competitionDate = Utils.dateFromString( $scope.competition.date );

			// console.log($scope.today);
			// console.log(competitionDate);

			var firstMonday = Utils.datePlusDays(Utils.mondayFromDate($scope.today),-14);
			var competitionMonday = Utils.mondayFromDate(competitionDate);

			var daysBetween = Utils.daysBetween(firstMonday,competitionMonday);
			var weeksBetween = daysBetween / 7;

			// console.log(daysBetween, weeksBetween);

			var firstDayIndex = Utils.daysBetween(firstMonday,competitionDate);
			var firstWeekIndex = Math.floor(weeksBetween);

			var date = firstMonday;
			var dayIndex = firstDayIndex;
			for( var w = firstWeekIndex; w >= 0; w--)
			{
				var week = {
					index: w,
					days: [],
					plan: {	distance: 0.0 },
					actual: { distance: 0.0, time: 0, pace: 0 }
				}
				for( var i=0; i<7; i++ )
				{
					var day = {
						index: dayIndex,
						date: date,
						isWeekend: (date.getDay()== 0 || date.getDay()==6)
					}
					var plannedRun = $scope.plan.plannedRuns[dayIndex];
					if( plannedRun )
						day.plan = plannedRun;

					if( $scope.today.getTime() == day.date.getTime() )
						week.isCurrentWeek = day.isToday = true;

					week.days.push(day);

					date = Utils.datePlusDays(date,1);
					dayIndex -= 1;
				}
				$scope.weeks.push(week);
			}
		}

		// put actual runs into days
		if( $scope.user && $scope.user._id )
		{
			$scope.weeks.forEach(function(week)
			{
				week.days.forEach(function(day)
				{
					var date = Utils.stringFromDate(day.date);
					var userRuns = $scope.runs;
					while( userRuns.length && userRuns[0].date < date )
						userRuns.shift();

					if( userRuns.length && userRuns[0].date == date )
					{
						day.actual = {
							distance : userRuns[0].distance,
							time     : userRuns[0].time,
							pace     : userRuns[0].distance? userRuns[0].time / userRuns[0].distance : 0
						}
					}
				});
			});
		}

		// calculate weekly totals
		$scope.weeks.forEach(function(week)
		{
			week.days.forEach(function(day)
			{
				if( day.plan )
					week.plan.distance += day.plan.distance;

				if( day.actual )
				{
					week.actual.distance += day.actual.distance;
					week.actual.time += day.actual.time;
					week.actual.pace = week.actual.time / week.actual.distance;
				}
			});
		});
	}

	$rootScope.$watch('selectedUserId', function(newId,oldId)
	{
		console.log("changed from",oldId,"to",newId);
		if( $rootScope.selectedUserId )
			$scope.user = User.get({uid: $rootScope.selectedUserId}, function()
			{
				$scope.runs = ActualRun.query({ uid: $scope.user._id }, function()
				{
					updateWeeks($scope);
				})
			});
		else
		{			
			$scope.user = null;			
			updateWeeks($scope);
		}
	});

	$rootScope.$watch('selectedCompetitionId', function(newId,oldId)
	{
		console.log("changed from",oldId,"to",newId);
		if( $rootScope.selectedCompetitionId )
			$scope.competition = Competition.get({cid: $rootScope.selectedCompetitionId}, function()
			{
				updateWeeks($scope);
			});
		else
		{			
			$scope.competition = null;			
			updateWeeks($scope);
		}
	});

	$rootScope.$watch('selectedPlanId', function(newId,oldId)
	{
		console.log("changed from",oldId,"to",newId);
		if( $rootScope.selectedPlanId )
			$scope.plan = Plan.get({pid: $rootScope.selectedPlanId}, function()
			{
				updateWeeks($scope);
			});
		else
		{
			$scope.plan = null;			
			updateWeeks($scope);
		}
	});

}