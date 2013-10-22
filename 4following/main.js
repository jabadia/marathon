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
	"esri/geometry/webMercatorUtils",
	"esri/tasks/GeometryService",
	"esri/tasks/FeatureSet",
	"esri/tasks/RelationParameters",
	"esri/layers/LabelLayer",
	"esri/geometry/Extent",
	"esri/tasks/query",

	"esri/symbols/SimpleLineSymbol",
	"esri/symbols/SimpleMarkerSymbol",
	"esri/symbols/SimpleFillSymbol",
	"esri/symbols/TextSymbol",
	"esri/renderers/SimpleRenderer",
	"esri/request",
	"esri/arcgis/utils",

	"esri/geometry/geodesicUtils", "esri/units", "esri/geometry/mathUtils",

	"jquery","dojo/domReady!"
], 
function(dom, array, Color, all, Deferred, number, lang,
	domUtils, Map, Graphic, Geometry, Point, webMercatorUtils, GeometryService, FeatureSet, RelationParameters, LabelLayer, Extent, Query,
	SimpleLineSymbol, SimpleMarkerSymbol, SimpleFillSymbol, TextSymbol, SimpleRenderer, esriRequest, arcgisUtils,
	geodesicUtils, Units, mathUtils,
	$) 
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
		runners.features.forEach(function(runner)
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
						addFollow(runner)
					else
						removeFollow(runner)
				})

			var icon = $('<img />')
				.attr('src', 'http://static.arcgis.com/images/Symbols/AtoZ/red'+ firstLetter +'.png')
				.on('click', function(evt)
				{
					console.log(runner.attributes.name);
					map.centerAndZoom(runner.geometry, 16);
					estimateRunnerPosition(runner);
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

	function estimateRunnerPosition(runner)
	{
		console.log(marathonRoute);
		var pos = getPointAlongLine(marathonRoute.geometry, runner.attributes.total_distance_m);
		console.log(pos);
		runner.setGeometry(pos);
	}

	function distance(p0,p1)
	{
		// return mathUtils.getLength(p0,p1);

		var pl = new Polyline({ "paths" : [[[p0.x,p0.y],[p1.x,p1.y]]], "spatialReference": map.spatialReference });
		var pl_gc = webMercatorUtils.webMercatorToGeographic(pl);
		var lengths = geodesicUtils.geodesicLengths([pl_gc], Units.METERS);
		return lengths[0];
	}

	function getPointAlongLine(line,distance)
	{
		var sr = map.spatialReference;
		var distanceCovered = 0;
		var i=0,npoints = line.paths[0].length;
		while(distanceCovered <= distance && i<npoints-1)
		{
			var currentPoint = line.getPoint(0,i);
			var nextPoint    = line.getPoint(0,i+1);
			var currentDistance = distance(currentPoint,nextPoint);

			if( distanceCovered + currentDistance >= distance )
			{
				var t = currentDistance / (distance - distanceCovered);
				var x = currentPoint.x * (1-t) + nextPoint.x * t;
				var y = currentPoint.y * (1-t) + nextPoint.y * t;
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

		operationalLayers = response.itemInfo.itemData.operationalLayers;
		runnersLayer = map.getLayer( getLayer("runners").id );
		pksLayer = map.getLayer( getLayer("NYC - PKs").id );
		bookmarks = response.itemInfo.itemData.bookmarks;
		map.getLayer( getLayer("NYC - Route").id ).on('update-end',function(evt)
		{
			marathonRoute = evt.target.graphics[0];
			console.log(marathonRoute);
		});

		// pk labels
		initLabels(pksLayer);

		// bookmark buttons
		createBookmarkButtons(bookmarks);

		// runners table
		var query = new Query();
		query.where = "1=1";
		query.outFields = ["*"];
		runnersLayer.queryFeatures(query).then(populateRunnersTable);
	});


});
