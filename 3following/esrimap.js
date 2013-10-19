"use strict"

var globalmap = {};

angular.module('EsriMap',[]).

directive('esrimap', function()
{
	return {
		restrict: 'E',
		template: '<div id="mapDiv"></div>',
		replace: true,
		transclude: true,
		scope: {
			center: '=center'
		},
		link: function(scope,elem,attrs)
		{
			require(["esri/graphic","esri/map", "esri/geometry/geodesicUtils", "esri/units", "esri/arcgis/utils", "dojo/domReady!"], 
			function(Graphic,Map,geodesicUtils,Units,arcgisUtils)
			{
				console.log('linking!');

				arcgisUtils.createMap(attrs.webmapId,"mapDiv").
				then(function(response)
				{
					globalmap = scope.map = response.map;
					console.log(response);

					setupMapEvents();
				});

				// scope.map = new Map("mapDiv", {
				// 	center: [-3.0, 40.0],
				// 	zoom: 5,
				// 	basemap: "gray"
				// });				

				function setupMapEvents()
				{
					// notify extent change events to outside world via 'center' variable
					scope.map.on('extent-change', function(e)
					{
						scope.$apply(function()
						{
							console.log('extent changed!');
							var center = e.extent.getCenter();
							scope.center = center;
							console.log(center);
						})
					})

					// watch outside world 'set-center' event and pan map whenever it is emited
					scope.$on('set-center-zoom', function(event,center,zoom)
					{
						console.log('set-center-zoom event received');
						console.log(center);
						scope.map.centerAt(center).then(function()
						{ 
							scope.$apply(function() 
							{ 
								scope.center = center;
							})
							scope.map.setLevel(zoom);
						});
					});

					scope.$on('refresh', function(event)
					{
						scope.map.layerIds.forEach(function(l)
						{
							var layer = scope.map.getLayer(l);
							layer.refresh();
						})
					})
				}
			});
		} // link
	}
}).

factory('featureservice',['$http', function($http)
{
	console.log("featureservice service");
	return function(url,queryParams)
	{
		var params = 
		{
			where: 			 "1=1",
			outFields: 		 "*",
			returnGeometry:  true,
			returnIdsOnly: 	 false,
			returnCountOnly: false,
			f: 				 "pjson"	
		}

		if(queryParams)
			angular.extend(params,queryParams);

		delete $http.defaults.headers.common['X-Requested-With'];
		return $http.get(url + '/query', { params: params });
	}
}]); // directive()
