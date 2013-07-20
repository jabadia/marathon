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

function WeekCalendarCtrl($scope, $rootScope, User, Competition, Plan, PlannedRun, Utils)
{
	console.log("WeekCalendarCtrl");

	$scope.weeks = [];

	$scope.addPlannedRun = function(day)
	{
		day.newPlannedRun = new PlannedRun(
		{ 
			pid 	: $scope.plan._id,
			prid 	: day.index,
			distance: 0, 
			comments: "" 
		});
	};

	$scope.savePlannedRun = function(day)
	{
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

	var updateWeeks = function($scope)
	{
		$scope.weeks = [];
		$scope.today = Utils.today();

		if( !($scope.competition && $scope.competition._id) && 
			!($scope.plan && $scope.plan._id) && 
			!($scope.user && $scope.user._id))
			return;

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
					{
						day.plan = {};
						day.plan.distance = plannedRun.distance;
					}

					if( $scope.today.getTime() == day.date.getTime() )
					{
						week.isCurrentWeek = day.isToday = true;
					}
					week.days.push(day);

					date = Utils.datePlusDays(date,1);
					dayIndex -= 1;
				}
				week.days.forEach(function(day)
				{
					if( day.plan )
					{
						week.plan.distance += day.plan.distance;
					}
					if( day.actual )
					{
						week.actual.distance += day.actual.distance;
						week.actual.time += day.actual.time;
						week.actual.pace = week.actual.time / week.actual.distance;
					}
				});
				$scope.weeks.push(week);
			}
		}
	}

	$rootScope.$watch('selectedUserId', function(newId,oldId)
	{
		console.log("changed from",oldId,"to",newId);
		if( $rootScope.selectedUserId )
			$scope.user = User.get({uid: $rootScope.selectedUserId}, function()
			{
				updateWeeks($scope);
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