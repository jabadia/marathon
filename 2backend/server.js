"use strict";

var express   = require("express");
var	training  = require("./training");

var app = express();

app.use(express.bodyParser());
app.use(express.logger({immediate:false, format:'dev'}));
app.use('/images', express.static(__dirname + '/images'));

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

app.get(   '/', 			        training.root);
app.get(   '/users',		        training.getAllUsers);
app.get(   '/users/:uid',	        training.getUser);
app.post(  '/users',			    training.addUser);
app.put(   '/users/:uid',           training.modifyUser);
app.delete('/users/:uid',	        training.deleteUser);
 
app.get(   '/competitions',         training.getAllCompetitions);
app.get(   '/competitions/:cid',    training.getCompetition);
app.put(   '/competitions/:cid',	training.saveCompetition);
app.post(  '/competitions',         training.addCompetition);
app.delete('/competitions/:cid',    training.deleteCompetition);
 
app.get(   '/plans',                training.getAllPlans);
app.get(   '/plans/:pid',		    training.getPlan);
app.post(  '/plans',			    training.addPlan);
app.put(   '/plans/:pid',		    training.savePlan);
app.get(   '/plans/:pid/:prid',     training.getPlannedRun);
app.put(   '/plans/:pid/:prid',     training.savePlannedRun);
app.delete('/plans/:pid/:prid',     training.deletePlannedRun);

app.get(   '/users/:uid/runs',      training.getAllUserRuns);
app.post(  '/users/:uid/runs',      training.addUserRun);
app.get(   '/users/:uid/runs/:rid', training.getUserRun);
app.put(   '/users/:uid/runs/:rid', training.saveUserRun);
app.delete('/users/:uid/runs/:rid', training.deleteUserRun);


app.use( training.errorHandler );
// app.use( express.errorHandler() );
app.all('*', err404);


var serverport = process.env.PORT || 4740;
console.log("listening on " + serverport);
app.listen(serverport);
