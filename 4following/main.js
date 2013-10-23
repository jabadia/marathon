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
	domUtils, Map, Graphic, Geometry, Point, Polyline, webMercatorUtils, GeometryService, FeatureSet, RelationParameters, LabelLayer, Extent, Query,
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
		var pos = getPointAlongLine(marathonRoute, runner.attributes.total_distance_m);
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
			marathonRoute = evt.target.graphics[0].geometry;
			console.log(marathonRoute);
		});

		var markerSymbol = new SimpleMarkerSymbol();
		//markerSymbol.setPath("M16,4.938c-7.732,0-14,4.701-14,10.5c0,1.981,0.741,3.833,2.016,5.414L2,25.272l5.613-1.44c2.339,1.316,5.237,2.106,8.387,2.106c7.732,0,14-4.701,14-10.5S23.732,4.938,16,4.938zM16.868,21.375h-1.969v-1.889h1.969V21.375zM16.772,18.094h-1.777l-0.176-8.083h2.113L16.772,18.094z");
		markerSymbol.setPath("M16,3.5c-4.142,0-7.5,3.358-7.5,7.5c0,4.143,7.5,18.121,7.5,18.121S23.5,15.143,23.5,11C23.5,6.858,20.143,3.5,16,3.5z M16,14.584c-1.979,0-3.584-1.604-3.584-3.584S14.021,7.416,16,7.416S19.584,9.021,19.584,11S17.979,14.584,16,14.584z");
		markerSymbol.setOffset(0,15);
		markerSymbol.setColor(new Color("#3498db"));

		// slider
		var slider = $('.slider').slider()
			.on('slide', function(evt)
			{
				console.log(evt);
				console.log(slider);
				var dist = slider.getValue() * 1000;
				var pos = getPointAlongLine(marathonRoute, dist);
				map.graphics.clear();
				map.graphics.add( new Graphic( pos, markerSymbol));
			})
			.data('slider');

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


})
});
