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

function WeekCalendarCtrl($scope, $rootScope, User,Competition,Plan,Utils)
{
	$scope.weeks = [];

	console.log("WeekCalendarCtrl");

	var updateWeeks = function($scope)
	{
		console.log($scope.user);
		console.log($scope.competition);
		console.log($scope.plan);

		$scope.weeks = [];
		$scope.today = Utils.today();

		if( !$scope.competition._id && !$scope.plan._id && !$scope.user._id)
			return;

		if( $scope.competition._id && $scope.plan._id )
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

/*
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
*/
	}
	/*	
	if( $rootScope.selectedUserId )
		$scope.user = User.get({uid: $rootScope.selectedUserId});

	if( $rootScope.selectedCompetitionId )
		$scope.competition = Competition.get({cid: $rootScope.selectedCompetitionId});

	if( $rootScope.selectedPlanId )
		$scope.plan = Plan.get({pid: $rootScope.selectedPlanId});
	*/

	$rootScope.$watch('selectedUserId', function(newId,oldId)
	{
		console.log("changed from",oldId,"to",newId);
		if( $rootScope.selectedUserId )
			$scope.user = User.get({uid: $rootScope.selectedUserId}, function()
			{
				updateWeeks($scope);
			});
	});

	$rootScope.$watch('selectedCompetitionId', function(newId,oldId)
	{
		console.log("changed from",oldId,"to",newId);
		if( $rootScope.selectedCompetitionId )
			$scope.competition = Competition.get({cid: $rootScope.selectedCompetitionId}, function()
			{
				updateWeeks($scope);
			});
	});

	$rootScope.$watch('selectedPlanId', function(newId,oldId)
	{
		console.log("changed from",oldId,"to",newId);
		if( $rootScope.selectedPlanId )
			$scope.plan = Plan.get({pid: $rootScope.selectedPlanId}, function()
			{
				updateWeeks($scope);
			});
	});


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