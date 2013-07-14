"use strict";

var app = angular.module('training',['trainingFilters','userService','competitionService', 'ngCookies']);

app.run(function($rootScope, $cookies)
{
	$rootScope.selectedUserId = $cookies.selectedUserId || {};
	$rootScope.selectedCompetitionId = $cookies.selectedCompetitionId || {};
});
