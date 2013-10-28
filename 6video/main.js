"use strict";


//
// video
//
var ytplayer = null;

function kmToSeconds(km)
{
	var sec = km / 42.192 * (21 * 60 + 44);
	return sec;
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

function advance(evt)
{
	var delta = parseInt( $(this).attr('data-delta') );
	var sec = ytplayer.getCurrentTime();
	ytplayer.seekTo(sec + delta);
	ytplayer.pauseVideo();
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
	// $('#go-button').on('click', function(evt)
	// {
	// 	var km = $('#seek-to-km').val();
	// 	var sec = kmToSeconds(km);
	// 	console.log(sec);
	// 	ytplayer.seekTo(sec,true);
	// 	console.log( ytplayer.getAvailablePlaybackRates());
	// 	ytplayer.setPlaybackRate(0.2);
	// 	play();
	// });

	$('.advance').on('click', advance);
	$('#sync-button').on('click', sync);
	$('#clear-button').on('clicl',clear);
}

function sync()
{
	var dist = $('#distance-field').val();
	var sec = ytplayer.getCurrentTime();
	$('#time-field').val(sec);

	$('#sync-points').append('<li>' + dist + ',' + sec + '</li>');
}

function clear()
{
	$('#sync-points').empty();
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
		markerSymbol.setOffset(0,15);
		markerSymbol.setColor(new Color("#3498db"));

		var slider = $('.slider').slider()
			.on('slide', function(evt)
			{
				var dist = slider.getValue() * 100;
				var pos = getPointAlongLine(marathonRoute, dist);
				map.graphics.clear();
				map.graphics.add( new Graphic(pos,markerSymbol));
				map.centerAt(pos);

				$('#distance-field').val( dist );

				var sec = ytplayer.getCurrentTime();
				$('#time-field').val(sec);
			})
			.data('slider');
	});


})
});
