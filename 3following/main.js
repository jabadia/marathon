"use strict"

var app = angular.module('MarathonApp', ['EsriMap'])

function MainCtrl($scope)
{
	$scope.center = {};	
}

/*
function ZonesCtrl($scope,$rootScope,$http,$timeout,featureservice)
{
	require(["esri/geometry/Point", "esri/SpatialReference", "dojo/domReady!"], 
	function(Point,SpatialReference)
	{
		$scope.$apply(function()
		{
			$scope.zones=['12-01','12-02','12-03','12-04'];

			featureservice('http://54.217.224.125/arcgis/rest/services/Salamanca/salamanca/FeatureServer/0')
				.success(function(data,status)
				{
					console.log(data);
					data.features.forEach(function(f)
					{
						f.attributes.name = f.attributes.Nº_C_M_;
					})
					$scope.zones = data.features;
				})
				.error(function(data,status)
				{
					console.log("error getting features", data, status);
				});

			$scope.sendCommand = function(zone,newState)
			{	
				$scope.panToZone(zone);

				var zoneName = zone.attributes.name;
				var url = "http://127.0.0.1:7878/zone/" + zoneName + "?state=" + newState;
				$scope.url = url;
				$http.get(url).
					success(function(data,status)
					{
						$scope.response = data;
						$timeout(function()
						{
							$rootScope.$broadcast('refresh');
						},1000);
						$timeout(function()
						{
							$rootScope.$broadcast('refresh');
						},2000);
					}).
					error(function(data,status)
					{
						$scope.response = data || "No answer"					
					});
					
				if($scope.currentTimeout)
					$timeout.cancel($scope.currentTimeout);

				$scope.currentTimeout = $timeout(function()
				{
					delete $scope.url;
					delete $scope.response;
				},5000);
			}

			$scope.panToZone = function(zone)
			{
				console.log('sending set-center-zoom event');
				$rootScope.$broadcast('set-center-zoom', zone.geometry, 16);
			}
		})

	});
}
*/