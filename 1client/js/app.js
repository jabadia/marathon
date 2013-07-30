"use strict";

var app = angular.module('training',[
	'trainingFilters',
	'userService','competitionService', 'planService','plannedRunService','actualRunService',
	'ngCookies', 'utilityService','ui.bootstrap']);

app.run(function($rootScope, $cookies, User, Competition, Plan)
{	
	$rootScope.selectedUser = null;
	$rootScope.selectedCompetition = null;
	$rootScope.selectedPlan = null;

	// check that the stored ids still exist
	if( $cookies.selectedUserId )
		User.get({ uid:  $cookies.selectedUserId }, function(user)
		{
			$rootScope.selectedUser = user;
		});

	if( $cookies.selectedCompetitionId )
		Competition.get({ cid: $cookies.selectedCompetitionId }, function(competition)
		{
			$rootScope.selectedCompetition = competition;
		});

	if( $cookies.selectedPlanId )
		Plan.get({ pid: $cookies.selectedPlanId}, function(plan)
		{
			$rootScope.selectedPlan = plan;
		});

});
