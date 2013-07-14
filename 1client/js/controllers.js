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

function WeekCalendarCtrl($scope, $rootScope, User,Competition,Plan)
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