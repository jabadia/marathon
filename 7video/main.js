"use strict";


//
// video
//
var ytplayer = null;

function lerp(p0,p1,x)
{
	return ( (x-p0[0]) / (p1[0]-p0[0]) * (p1[1]-p0[1]) ) + p0[1];
}

function lerp2(p0,p1,x)
{
	return ( (x-p0[1]) / (p1[1]-p0[1]) * (p1[0]-p0[0]) ) + p0[0];
}

var distance_time_points = [
	[0,0],
	[3200,74.548],
	[3900,87.858],
	[6000,143.291],
	[10100,242.41],
	[12600,305.682],
	[14900,378.506],
	[16200,421.349],
	[17100,450.359],
	[19500,527.728],
	[20300,558],
	[20500,565.173],
	[21500,601.335],
	[22300,625.827],
	[24400,677.659],
	[26500,748.718],
	[31900,910.574],
	[32600,929.127],
	[34000,984.52],
	[35300,1023.757],
	[36000,1048.75],
	[36800,1073.179],
	[38000,1132.554],
	[41100,1254.931],
	[41900,1284.225],
	[42190,1303.538]
];


function metersToSeconds(m)
{
	var i=0;

	while( distance_time_points[i][0] < m && i<distance_time_points.length)
		++i;

	if( i== distance_time_points.length )
		return distance_time_points[i-1][1];

	return lerp( distance_time_points[i], distance_time_points[i+1], m);
}

function secToMeters(s)
{
	var i=0;

	while( distance_time_points[i][1] < s && i<distance_time_points.length)
		++i;

	if( i== distance_time_points.length )
		return distance_time_points[i-1][0];

	return lerp2( distance_time_points[i], distance_time_points[i+1], s);
}

function play()
{
	ytplayer.playVideo();
	$('#play-button').addClass('btn-success');
	$('#pause-button').removeClass('btn-success');
}

function pause()
{
	ytplayer.pauseVideo();
	$('#pause-button').addClass('btn-success');
	$('#play-button').removeClass('btn-success');
}

function onYouTubePlayerReady(playerId)
{
	ytplayer = document.getElementById("myytplayer");
	initVideo();
}

function initVideo()
{
	ytplayer.seekTo(0, true);
	ytplayer.pauseVideo();
	console.log(ytplayer);

	$('#play-button').on('click', play);
	$('#pause-button').on('click', pause);
}

function tick()
{
	if( ytplayer.getPlayerState() == 1 /* playing */)
	{
		var sec = ytplayer.getCurrentTime();
		var dist = secToMeters(sec);

		// falta actualizar el slider
		console.log(dist);		
	}
}

var map;
var operationalLayers;
var runnersLayer;
var pksLayer;
var marathonRoute;
var playing;

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

	function format_period(t)
	{
		var seconds = t / 1000;
		if( seconds < 60 )
			return seconds + " s";
		else if( seconds < 3600 )
			return Math.floor(seconds / 60) + " min";
		else
			return Math.floor(seconds / 3600) + " hours";
	}

	function calculate_pace(t_s,d_m)
	{
		if( !d_m )
			return 0;

		return t_s / d_m * 1000;
	}

	function parse_distance(str)
	{
		if( str == "")
			return 0;

		str = String(str);
		str = str.replace(',','.');
		str = str.replace('km','.').replace('m','').replace(' ','');
		var distance = parseFloat(str);
		console.log("parsing " + str + " into " + distance)
		if( isNaN(distance) )
			throw new Error('bad value');
		if( distance < 1000)
			distance *= 1000;
		return distance;
	}
	
	function parse_time(str)
	{
		if( str == "")
			return 0;

		var time = 0;
		var hours=0,mins=0,secs=0;
		var components;

		str = str.replace('h',':');
		str = str.replace("'",":");
		str = str.replace('"','');

		if( str.indexOf(':') != -1)
		{
			components = str.split(':');
			if( components.length == 3 )
			{
				hours = parseInt(components[0]);
				components.shift();
			}
			if( components.length == 2 )
			{
				mins = parseInt(components[0]);
				secs = parseInt(components[1]); 
				if( isNaN(mins) || isNaN(secs) )
					throw new Error('bad value');

				if( hours == 0 && mins < 4) // se asume que 1:15 es 1h y 15min, en lugar de 1min y 15sec
				{
					hours = mins;
					mins = secs;
					secs = 0;
				}
			}
		}
		else
		{
			hours = 0;
			mins = parseInt(str);
			secs = 0;
			if( isNaN(mins) )
				throw new Error('bad value');
		}
		time = hours * 3600 + mins * 60 + secs;
		console.log('parsing ' + str + ' into ' + time );
		return time;
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


	function estimateRunnerPosition(runner)
	{
		if( !marathonRoute )
			return;

		var pos = getPointAlongLine(marathonRoute, runner.attributes.total_distance_m);
		runner.setGeometry(pos);
	}

	function distance(p0,p1)
	{
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

			//console.log(currentDistance, distanceCovered, dist)

			if( distanceCovered + currentDistance >= dist )
			{
				var t = (dist - distanceCovered) / currentDistance;
				var x = currentPoint.x * (1-t) + nextPoint.x * t;
				var y = currentPoint.y * (1-t) + nextPoint.y * t;

				// console.log('P',t,x,y);
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

		operationalLayers = response.itemInfo.itemData.operationalLayers;

		// runners
		runnersLayer = map.getLayer( getLayer("runners").id );
		runnersLayer.hide();

		// route
		var routeLayer = replaceFeatureLayer( map.getLayer( getLayer("NYC - Route").id ) );
		routeLayer.on('update-end',function(evt)
		{
			marathonRoute = evt.target.graphics[0].geometry;
		});

		// pk labels
		pksLayer = map.getLayer( getLayer("NYC - PKs").id );
		initLabels(pksLayer);

		var markerSymbol = new SimpleMarkerSymbol();
		markerSymbol.setPath("M16,3.5c-4.142,0-7.5,3.358-7.5,7.5c0,4.143,7.5,18.121,7.5,18.121S23.5,15.143,23.5,11C23.5,6.858,20.143,3.5,16,3.5z M16,14.584c-1.979,0-3.584-1.604-3.584-3.584S14.021,7.416,16,7.416S19.584,9.021,19.584,11S17.979,14.584,16,14.584z");
		markerSymbol.setOffset(0,18);
		markerSymbol.setSize(35);
		markerSymbol.setColor(new Color("#FFFF33"));

		var slider = $('.slider').slider()
			.on('slide', function(evt)
			{
				var dist = slider.getValue() * 100;
				var pos = getPointAlongLine(marathonRoute, dist);
				map.graphics.clear();
				map.graphics.add( new Graphic(pos,markerSymbol));
				var centerPos = new Point(
					pos.x + map.extent.getWidth() * 0.20, 
					pos.y - map.extent.getHeight() * 0.10, pos.spatialReference);
				map.centerAt(centerPos);

				$('#distance-field').val( format_distance( dist ) );

				var sec = metersToSeconds(dist);
				console.log(dist,sec);
				ytplayer.seekTo(sec,true);
				pause();
			})
			.data('slider');

		window.setInterval(tick,1000);
	});


})
});
