"use strict";

var map;
var operationalLayers;
var runnersLayer;
var pksLayer;
var bookmarks;
var marathonRoute;

require(["dojo/dom",
	"dojo/_base/array",
	"dojo/_base/Color",
	"dojo/promise/all",
	"dojo/Deferred",
	"dojo/number",
	"dojo/_base/lang",

	"esri/domUtils",
	"esri/map",
	"esri/graphic",
	"esri/geometry/Geometry",
	"esri/geometry/Point",
	"esri/geometry/Polyline",
	"esri/geometry/webMercatorUtils",
	"esri/tasks/GeometryService",
	"esri/tasks/FeatureSet",
	"esri/tasks/RelationParameters",
	"esri/layers/LabelLayer",
	"esri/geometry/Extent",
	"esri/tasks/query",
	"esri/layers/FeatureLayer",

	"esri/symbols/SimpleLineSymbol",
	"esri/symbols/SimpleMarkerSymbol",
	"esri/symbols/SimpleFillSymbol",
	"esri/symbols/TextSymbol",
	"esri/renderers/SimpleRenderer",
	"esri/request",
	"esri/arcgis/utils",

	"esri/geometry/geodesicUtils", "esri/units", "esri/geometry/mathUtils",

	"jquery",
	"dojo/domReady!"
], 
function(dom, array, Color, all, Deferred, number, lang,
	domUtils, Map, Graphic, Geometry, Point, Polyline, webMercatorUtils, GeometryService, FeatureSet, RelationParameters, LabelLayer, Extent, Query, FeatureLayer,
	SimpleLineSymbol, SimpleMarkerSymbol, SimpleFillSymbol, TextSymbol, SimpleRenderer, esriRequest, arcgisUtils,
	geodesicUtils, Units, mathUtils,
	$) 
{
require(["bootstrap-slider.js"], function()
{

	//
	// functions
	//
	function getLayer(title)
	{
		var layer = _.findWhere(operationalLayers, { title: title});
		return layer;
	}

	function def(value, defaultValue)
	{
		return value? value : defaultValue;
	}

	function format_distance(d)
	{
		return number.format(d / 1000, { places:3 }) + " km";
	}

	function format_time(t)
	{
		var hours   = Math.floor( t / 3600 );
		var minutes = Math.floor( t / 60 ) % 60;
		var seconds = t % 60;
		var result = '';
		if(hours > 0)
			result = (hours<10? '0' : '') + hours + ":";
		result += (minutes<10? '0' : '') + minutes + ':' + (seconds<10? '0':'') + seconds;
		return result;
	}

	function calculate_pace(t_s,d_m)
	{
		if( !d_m )
			return 0;

		return t_s / d_m * 1000;
	}

	//
	//
	//

	function initLabels(pksLayer)
	{
		var pksLabelSymbol = new TextSymbol().setColor( new Color("#FFF"));
		pksLabelSymbol.font.setSize("8pt");
		pksLabelSymbol.font.setFamily("arial");
		//pksLabelSymbol.setOffset(-5,0);
		var pksLabelRenderer = new SimpleRenderer(pksLabelSymbol);
		var labels = new LabelLayer({id:"labels"});
		labels.addFeatureLayer(pksLayer, pksLabelRenderer, "${pk}", {
			pointPriorities: "CenterCenter"
		});
		map.addLayer(labels);
	}

	function createBookmarkButtons(bookmarks)
	{
		$('#bookmarks').empty();
		bookmarks.forEach(function(bookmark)
		{
			//var icon = $('<i />').addClass('icon-search');
			var newButton = $('<button />')
				.addClass('btn')
			//	.append(icon)
				.append(" " + bookmark.name)
				.on('click', function(evt)
			{
				$('#bookmarks button').removeClass('btn-primary');
				$(this).addClass('btn-primary');
				map.setExtent(new Extent(bookmark.extent));
			});
			$('#bookmarks').append(newButton);
		});
	}

	function populateRunnersTable(runners)
	{
		$('#runners').empty();
		var rows = [];
		runners.forEach(function(runner)
		{
			console.log(runner);

			var firstLetter = runner.attributes.name[0].toUpperCase();
			if(firstLetter == "M") firstLetter = "M.";

			var checkbox = $('<button />')
				.addClass('btn')
				.text('Follow')
				.on('click', function(evt)
				{
					$(this).toggleClass('btn-info')
					if($(this).hasClass('btn-info'))
						addFollow(runner);
					else
						removeFollow(runner);

					zoomToFollowedRunners();
				})

			var icon = $('<img />')
				.attr('src', 'http://static.arcgis.com/images/Symbols/AtoZ/red'+ firstLetter +'.png')
				.on('click', function(evt)
				{
					console.log(runner.attributes.name);
					estimateRunnerPosition(runner);
					map.centerAndZoom(runner.geometry, 16);
				});

			var pace_s_km = calculate_pace(runner.attributes.total_time_s,runner.attributes.total_distance_m);

			var row = $('<tr />')
				.append( $('<td />').append(checkbox))
				.append( $("<td />").append(icon) )
				.append("<td>" + number.format(runner.attributes.bib,{places:0})  + "</td>")
				.append("<td>" + runner.attributes.name + "</td>")
				.append("<td>" + format_distance(runner.attributes.total_distance_m) + "</td>")
				.append("<td>" + format_time(runner.attributes.total_time_s) + "</td>")
				.append("<td>" + format_time(pace_s_km) + " / km.</td>")
			rows.push(row);
		})
		var header_cells = ['Follow','Go to','Bib','Name','Distance','Time','Pace',''].map(function(title){ return $('<th />').text(title); });
		$('#runners').append($('<thead />').append($('<tr />').append(header_cells)));
		$('#runners').append($('<tbody />').append(rows));
	}

	function replaceFeatureLayer(layer)
	{
		var index = map.graphicsLayerIds.indexOf(layer.id);
		var newLayer = new FeatureLayer( layer.url, {
			mode: esri.layers.FeatureLayer.MODE_SNAPSHOT,
			outFields: ['*']
		});
		newLayer.setRenderer( layer.renderer );
		map.removeLayer(layer);
		map.addLayer(newLayer,index);
		return newLayer;
	}

	function setFlickerFree(layer)
	{
		var graphicsLayer = new GraphicsLayer({id: layer.id + '_temp', opacity:0.8});
		map.addLayer(graphicsLayer);
		layer.on('update-start',function(evt)
		{
			graphicsLayer.clear();
			layer.graphics.forEach(function(g)
			{
				graphicsLayer.add(g.toJson());
			});
		});
		layer.on('update-end',function(evt)
		{
			graphicsLayer.clear();
		});		
	}

	//
	// follow runners
	//
	var following = []
	function addFollow(runner)
	{
		console.log(following);
		if( following.indexOf(runner) == -1)
			following.push(runner);
		console.log(following);
	}

	function removeFollow(runner)
	{
		console.log(following);
		following = _.without(following, runner);
		console.log(following);
	}

	function zoomToFollowedRunners()
	{
		if( following.length == 1 )
		{
			map.centerAndZoom(following[0].geometry, 16);
		}
		else if( following.length > 1)
		{
			var xmin = following[0].geometry.x;
			var xmax = xmin;
			var ymin = following[0].geometry.y;
			var ymax = ymin;
			following.forEach(function(runner)
			{
				xmin = Math.min( runner.geometry.x, xmin );
				xmax = Math.max( runner.geometry.x, xmax );
				ymin = Math.min( runner.geometry.y, ymin );
				ymax = Math.max( runner.geometry.y, ymax );
			});
			var sr = map.spatialReference;
			var extent = new Extent(xmin,ymin,xmax,ymax,sr);
			map.setExtent(extent.expand(2));
		}
	}


	function estimateRunnerPosition(runner)
	{
		if( marathonRoute )
		{			
			var pos = getPointAlongLine(marathonRoute, runner.attributes.total_distance_m);
			runner.setGeometry(pos);
		}
	}

	function distance(p0,p1)
	{
		// return mathUtils.getLength(p0,p1);

		var pl = new Polyline({ "paths" : [[[p0.x,p0.y],[p1.x,p1.y]]], "spatialReference": map.spatialReference });
		var pl_gc = webMercatorUtils.webMercatorToGeographic(pl);
		var lengths = geodesicUtils.geodesicLengths([pl_gc], Units.METERS);
		return lengths[0];
	}

	function getPointAlongLine(line,dist)
	{
		var sr = map.spatialReference;
		var distanceCovered = 0;
		var i=0,npoints = line.paths[0].length;
		while(distanceCovered <= dist && i<npoints-1)
		{
			var currentPoint = line.getPoint(0,i);
			var nextPoint    = line.getPoint(0,i+1);
			var currentDistance = distance(currentPoint,nextPoint);

			console.log(currentDistance, distanceCovered, dist)

			if( distanceCovered + currentDistance >= dist )
			{
				var t = (dist - distanceCovered) / currentDistance;
				var x = currentPoint.x * (1-t) + nextPoint.x * t;
				var y = currentPoint.y * (1-t) + nextPoint.y * t;

				console.log('P',t,x,y);
				return new Point(x,y,sr);
			}
			else
			{
				distanceCovered += currentDistance;
				i += 1;
			}
		}
		return line.getPoint(0,npoints-1);
	}

	function updateAllRunnerPositions(runners)
	{
		runners.forEach(function(runner)
		{
			console.log('refreshing', runner.attributes.name);
			estimateRunnerPosition(runner);
		});
	}

	function refreshRunners(evt)
	{
		console.log('refreshRunners');
		runnersLayer.refresh();
	}


	//
	// main
	//
	arcgisUtils.createMap("f858831138e74b8087351ab7dd2a37f6", "map", { 
		mapOptions: { fadeOnZoom: true },
		ignorePopups: true
	}).then( function(response)
	{
		map = response.map;
		console.log(response);		

		map.on('update-start', function(evt)
		{
			console.log('update-start');
			$('.icon-globe').addClass('icon-spin blue');
		});
		map.on('update-end', function(evt)
		{
			console.log('update-end');
			$('.icon-globe').removeClass('icon-spin blue');
		});

		operationalLayers = response.itemInfo.itemData.operationalLayers;

		// runners
		runnersLayer = map.getLayer( getLayer("runners").id );
		runnersLayer = replaceFeatureLayer( runnersLayer );
		runnersLayer.on('update-end',function(evt)
		{
			var runners = runnersLayer.graphics;
			populateRunnersTable(runners);
			updateAllRunnerPositions(runners);
			zoomToFollowedRunners();
		});
		//setFlickerFree(runnersLayer);

		// bookmarks
		bookmarks = response.itemInfo.itemData.bookmarks;

		// route
		var routeLayer = replaceFeatureLayer( map.getLayer( getLayer("NYC - Route").id ) );
		routeLayer.on('update-end',function(evt)
		{
			marathonRoute = evt.target.graphics[0].geometry;
		});

		// pk labels
		pksLayer = map.getLayer( getLayer("NYC - PKs").id );
		initLabels(pksLayer);

		// bookmark buttons
		createBookmarkButtons(bookmarks);

		// refresh button
		$('#refresh-button').on('click', refreshRunners);
		$('#zoom-button').on('click', zoomToFollowedRunners);
	});


})
});
