"use strict";

var map;
var operationalLayers;
var runnersLayer;
var pksLayer;
var bookmarks;
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

				// unfollow all
				following = [];
				$('#runners button').removeClass('btn-info');
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
					
					// unfollow all
					following = [];
					$('#runners button').removeClass('btn-info');
				});

			var pace_s_km = calculate_pace(runner.attributes.total_time_s,runner.attributes.total_distance_m);

			var row = $('<tr />')
				.append( $('<td />').append(checkbox))
				.append( $("<td />").append(icon) )
				.append("<td>" + /*number.format(runner.attributes.bib,{places:0})*/ runner.attributes.bib  + "</td>")
				.append("<td>" + runner.attributes.name + "</td>")
				.append("<td>" + format_distance(runner.attributes.total_distance_m) + "</td>")
				.append("<td>" + format_time(runner.attributes.total_time_s) + "</td>")
				.append("<td>" + format_time(pace_s_km) + " per km.</td>")
				.append("<td>" + format_period( new Date() - runner.attributes.latest_timestamp) + " ago</td>")
			rows.push(row);
		})
		var header_cells = ['Follow','Go to','Bib','Name','Distance','Time','Pace','Timestamp'].map(function(title){ return $('<th />').text(title); });
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
		console.log(following);
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

	function updateRunnerFeature(bib,distance,time)
	{
		console.log(bib,format_distance(distance),format_time(time));

		// 1. find OBJECTID
		var runner = _.find( runnersLayer.graphics, function(f) { return f.attributes.bib ==bib; } );
		if( !runner)
		{
			var deferred = new Deferred();
			deferred.reject('bib not found');
			return deferred;
		}
		console.log( runner );

		// 2. calculate new position
		runner.attributes.total_distance_m = distance;
		runner.attributes.total_time_s = time;
		var position = estimateRunnerPosition(runner);

		// 3. send updated feature to server
		var url = runnersLayer.url + "/updateFeatures";
		var features = [{ 
				attributes: {
					OBJECTID: runner.attributes.OBJECTID, 
					bib: bib,
					total_distance_m: distance,
					total_time_s: time,
					latest_timestamp: new Date()
				},
				geometry: position
			}];
		var params = {
			f: 'json',
			features: JSON.stringify(features)
		}
		var req = esri.request({
			url: url,
			content: params,
			handleAs: 'json'
		},
		{
			usePost: true
		});

		return req;
	}

	function play()
	{
		$('#play-button').addClass('btn-success');
		$('#stop-button').removeClass('btn-success');

		playing = true;
	}

	function stop()
	{
		$('#stop-button').addClass('btn-success');
		$('#play-button').removeClass('btn-success');

		playing = false;

	}

	function tick()
	{
		if( ! playing )
			return;

		console.log('tick()');

		var runners = runnersLayer.graphics;
		runners.forEach( function(runner)
		{
			// calculate current distance
			var now = new Date();
			var delta_s = (now - runner.attributes.latest_timestamp) / 1000;

			if( delta_s > 40*60*60) // more than 40 min since last update
			{

			}
			else
			{
				var distance = delta_s * (runner.attributes.total_distance_m / runner.attributes.total_time_s);
				console.log('Updating',runner.attributes.name, delta_s, distance, format_time( calculate_pace(runner.attributes.total_time_s, runner.attributes.total_distance_m)));
				runner.attributes.total_distance_m += distance;
				runner.attributes.total_time_s += delta_s;
				runner.attributes.latest_timestamp = now;
				estimateRunnerPosition(runner);
			}

			console.log(delta_s);
		});

		zoomToFollowedRunners();
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
			// keep following runners...
			following = [];
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
		$('#play-button').on('click', play);
		$('#stop-button').on('click', stop);

		/*
		$('#satellite-button').on('click', function() { map.setBasemap('hybrid'); $('.basemap').removeClass('btn-success'); $(this).addClass('btn-success');});
		$('#gray-button').on('click', function() { map.setBasemap('gray'); $('.basemap').removeClass('btn-success'); $(this).addClass('btn-success');});
		*/

		// update form
		//
		$('#update-runner-block').show();
		$('#bib-input').val(15073);
		$('#distance-input').val(3);
		$('#time-input').val('17:30');
		$('form').on('submit', function(evt)
		{
			evt.preventDefault();
			var bib      = $('#bib-input').val();
			var distance = parse_distance( $('#distance-input').val() );
			var time     = parse_time( $('#time-input').val() );
			if( bib )
			{				
				updateRunnerFeature(bib,distance,time).then(refreshRunners);
			}
			return false;
		});

		play();
		window.setInterval(tick, 2000);
	});


});
