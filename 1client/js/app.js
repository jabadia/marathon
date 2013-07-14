"use strict";

var app = angular.module('training',['trainingFilters','userService','competitionService', 'planService','ngCookies']);

app.run(function($rootScope, $cookies, User, Competition, Plan)
{	
	// check that the stored ids still exist
	User.get({ uid:  $cookies.selectedUserId || ""}, function(user)
	{
		$rootScope.selectedUserId = user._id;
	});

	Competition.get({ cid: $cookies.selectedCompetitionId || ""}, function(competition)
	{
		$rootScope.selectedCompetitionId = competition._id;
	});

	Plan.get({ pid: $cookies.selectedPlanId || ""}, function(plan)
	{
		$rootScope.selectedPlanId = plan._id;
	});

});
