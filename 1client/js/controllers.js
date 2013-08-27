"use strict";

function UserListCtrl($scope, $rootScope, $cookies, User)
{
	$scope.users = User.query();

	$scope.addUser = function()
	{
		console.log("add!");
		$scope.editingUser = new User();
	}

	$scope.editUser = function()
	{
		if( $scope.selectedUser )
		{
			console.log("edit!");
			$scope.editingUser = angular.copy($scope.selectedUser);
		}
	}

	$scope.save = function()
	{
		console.log("saving! ", $scope.editingUser);
		if($scope.editingUser._id )
		{
			$scope.select($scope.editingUser);
			$scope.editingUser.$save(function()
			{
				delete $scope.editingUser;
				$scope.users = User.query();
			});
		}
		else
		{
			User.add({}, $scope.editingUser, function(result)
			{
				$scope.editingUser._id = result.uid;
				$scope.select($scope.editingUser);
				delete $scope.editingUser;
				$scope.users = User.query();
			});
		}
	}

	$scope.cancel = function()
	{
		delete $scope.editingUser;
	}

	$scope.delete = function()
	{
		if( $scope.selectedUser )
		{
			$scope.selectedUser.$delete(function()
			{
				$scope.select(null);			
				$scope.users = User.query();
			})
		}
	}

	$scope.select = function(user)
	{
		$rootScope.selectedUser = angular.copy(user);
		$cookies.selectedUserId = user? user._id : "";
	}
}

function CompetitionListCtrl($scope, $rootScope, $cookies, Competition)
{
	$scope.competitions = Competition.query();

	$scope.addCompetition = function()
	{
		console.log("add!");
		$scope.editingCompetition = new Competition();
	}

	$scope.editCompetition = function()
	{
		if( $scope.selectedCompetition )
		{
			console.log("edit!");
			$scope.editingCompetition = angular.copy($scope.selectedCompetition);
		}
	}

	$scope.save = function()
	{
		console.log("saving! ", $scope.editingCompetition);
		if($scope.editingCompetition._id )
		{
			$scope.select($scope.editingCompetition);
			$scope.editingCompetition.$save(function()
			{
				delete $scope.editingCompetition;
				$scope.competitions = Competition.query();
			});
		}
		else
		{
			Competition.add({}, $scope.editingCompetition, function(result)
			{
				$scope.editingCompetition._id = result.cid;
				$scope.select($scope.editingCompetition);
				delete $scope.editingCompetition;
				$scope.competitions = Competition.query();
			});
		}
	}

	$scope.cancel = function()
	{
		delete $scope.editingCompetition;
	}

	$scope.delete = function()
	{
		if( $scope.selectedCompetition )
		{
			$scope.selectedCompetition.$delete(function()
			{
				$scope.select(null);			
				$scope.competitions = Competition.query();
			})
		}
	}

	$scope.select = function(competition)
	{
		$rootScope.selectedCompetition = angular.copy(competition);
		$cookies.selectedCompetitionId = competition? competition._id : "";
	}
}

function PlanListCtrl($scope, $rootScope, $cookies, Plan)
{
	$scope.plans = Plan.query();

	$scope.select = function(plan)
	{
		$rootScope.selectedPlan = plan;
		$cookies.selectedPlanId = plan? plan._id : "";
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
			pid 	: $scope.selectedPlan._id,
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
			pid 	: $scope.selectedPlan._id,
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
			$scope.selectedPlan = Plan.get({pid: $scope.selectedPlan._id}, function()
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
			pid: $scope.selectedPlan._id,
			prid: day.index
		});
		plannedRun.$delete(function()
		{
			console.log("deleted!!");
			$scope.selectedPlan = Plan.get({pid: $scope.selectedPlan._id}, function()
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
			uid 	: $scope.selectedUser._id,
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
			uid 	: $scope.selectedUser._id,
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
			$scope.actualRuns = ActualRun.query({ uid: $scope.selectedUser._id }, function()
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
			uid 	: $scope.selectedUser._id,
			rid 	: Utils.stringFromDate(day.date),
		});
		actualRun.$delete(function()
		{
			console.log("deleted!!");
			$scope.actualRuns = ActualRun.query({ uid: $scope.selectedUser._id }, function()
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

		if( !($scope.selectedCompetition && $scope.selectedCompetition._id) && 
			!($scope.selectedPlan && $scope.selectedPlan._id) && 
			!($scope.selectedUser && $scope.selectedUser._id))
			return;

		// create weeks and days
		// if we have a plan && competition, then extend the calendar up to competition date
		// else, extend the calendar for two weeks from now

		// put planned runs into days
		if( $scope.selectedCompetition && $scope.selectedCompetition._id && $scope.selectedPlan && $scope.selectedPlan._id )
		{
			var competitionDate = Utils.dateFromString( $scope.selectedCompetition.date );

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
					var plannedRun = $scope.selectedPlan.plannedRuns[dayIndex];
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
		if( $scope.selectedUser && $scope.selectedUser._id )
		{
			$scope.weeks.forEach(function(week)
			{
				week.days.forEach(function(day)
				{
					var date = Utils.stringFromDate(day.date);
					var userRuns = angular.copy($scope.actualRuns);
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

	$rootScope.$watch('selectedUser', function(newUser,oldUser)
	{
		var oldUserId = oldUser? oldUser._id : "-";
		var newUserId = newUser? newUser._id : "-";
		console.log("user changed from",oldUserId,"to",newUserId);
		if( oldUserId != newUserId )
		{
			if( newUser && newUser._id )
			{				
				$scope.actualRuns = ActualRun.query({ uid: newUser._id }, function(runs)
				{					 
					updateWeeks($scope);
				});
			}
			else
			{
				delete $scope.actualRuns;
				updateWeeks($scope);
			}
		}
		else
		{
			updateWeeks($scope);
		}
	});

	$rootScope.$watch('selectedCompetition', function(newCompetition,oldCompetition)
	{
		console.log("competition changed from",oldCompetition? oldCompetition._id : "-","to",newCompetition? newCompetition._id : "-");
		updateWeeks($scope);
	});

	$rootScope.$watch('selectedPlan', function(newPlan,oldPlan)
	{
		console.log("plan changed from",oldPlan? oldPlan._id : "-","to",newPlan? newPlan._id : "-");
		if( newPlan && !newPlan.plannedRuns )
		{
			$scope.selectedPlan = Plan.get({pid: $scope.selectedPlan._id}, function()
			{
				updateWeeks($scope);
			});
		}
		else
			updateWeeks($scope);
	});

}