"use strict";

var express   = require("express");
var	training  = require("./training");

var app = express();

app.use(express.bodyParser());
app.use(express.logger('short'));
// app.use(training.timestampLatestRequest);
app.use('/images', express.static(__dirname + '/images'));
// app.use(training.getToken);

function err404(req,res)
{
	res.status(404).send('invalid api call');
}

app.all('*', function(req, res, next) {
	res.header('Access-Control-Allow-Origin', '*');
	res.header('Access-Control-Allow-Headers', 'X-Requested-With,Content-Type');
	res.header('Access-Control-Allow-Methods', 'PUT, GET, POST, DELETE, OPTIONS');
	// res.header('Access-Control-Allow-Headers', 'Content-Type');
	next();
});

app.options('*', function(req,res,next) {
	res.end();
})

// Competition
// Plan
// + PlannedRun
// User
// + Run

//app.param('id', training.validateId);

app.get(   '/', 			   training.root);
app.get(   '/user',		       training.getAllUsers);
app.get(   '/user/:uid',	   training.getUser);
app.post(  '/user',			   training.addUser);
app.put(   '/user/:uid',       training.modifyUser);
app.delete('/user/:uid',	   training.deleteUser);

app.get( '/competition',       training.getAllCompetitions);
app.get( '/competition/:cid',  training.getCompetition);
app.post('/competition',       training.addCompetition);

app.get( '/plan',              training.getAllPlans);
app.get( '/plan/:pid',		   training.getPlan);
app.get( '/plan/:pid/:prid',   training.getPlannedRun);
app.get( '/user/:uid/run',     training.getAllUserRuns);
app.post('/user/:uid/run',     training.addUserRun);
app.get( '/user/:uid/run/:rid',training.getUserRun);
app.put( '/user/:uid/run/:rid',training.saveUserRun);

app.all('*',            err404);


var serverport = process.env.PORT || 4740;
console.log("listening on " + serverport);
app.listen(serverport);
