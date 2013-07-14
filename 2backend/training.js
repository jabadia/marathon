"use strict";

var request = require('request');
var mongodb = require('mongodb');
var async   = require('async');

var dbname   = "training";
var dbserver = "localhost";
var dbport   = mongodb.Connection.DEFAULT_PORT;

var db;
var users;
var competitions;
var plans;


var mongoClient = new mongodb.MongoClient(new mongodb.Server(dbserver,dbport));
mongoClient.open(function(err,mongoClient)
{
	db = mongoClient.db(dbname);
	async.map(['users','competitions','plans'], 
		function(collection_name, callback)
		{
			db.collection(collection_name,{},callback);
		},
		function(err,results)
		{
			if(err)
				console.log("can't open collection: " + err);

			users        = results[0];
			competitions = results[1];
			plans        = results[2];

		}
	);
});



exports.root = function (req,res) 
{
	res.type("text/plain");
	res.send('api root' + 
		"\ncurrent: " + new Date() + 
		"\nlatest:  " + new Date(parseInt(req.latest_request))
	);
}

// ///////////////////////////////////////////////////////////////////////
//
//                                  users
//
// ///////////////////////////////////////////////////////////////////////

exports.getAllUsers = function(req,res)
{
	users.find().toArray(function(err,users)
	{
		if(err)
			return res.status(500).send('Error 500: ' + err);

		return res.json(users);
	});
}

exports.getUser = function(req,res)
{
	var uid = req.params.uid;

	users.findOne({_id: new mongodb.ObjectID(uid)}, function(err,user)
	{
		if(err)
			return res.status(500).send('Error 500: ' + err);

		if(!user)
			return res.status(404).send('Error 404: user not found id=' + uid);

		return res.json(user);
	})
}

exports.addUser = function(req,res)
{
	var doc = {
		name:         req.body.name || "name undefined",
		birthdate:    req.body.birthdate || "0000-00-00",
	};

	users.insert(doc, {}, function(err,records)
	{
		console.log(records);

		if(err)
			return res.status(500).send('Error 500: ' + err);

		var response = {
			success: true,
			uid: records[0]._id
		};
		res.json(response);		
	})
}

exports.modifyUser = function(req,res)
{
	var uid = req.params.uid;

	var doc = {
		name:         req.body.name || "name undefined",
		birthdate:    req.body.birthdate || "0000-00-00",
	};

	users.update({_id: new mongodb.ObjectID(uid)}, doc, { upsert: false }, function(err,records)
	{
		console.log(err);
		console.log(records);
		if( err )
			return res.status(500).send('Error 500: ' + err);

		if( records == 0)
			return res.status(404).send('Error 404: ' + uid + ' not found');

		var response = {
			success: true,
		}
		res.json(response);		
	})
}

exports.deleteUser = function(req,res)
{
	var uid = req.params.uid;

	users.remove({_id: new mongodb.ObjectID(uid)}, function(err,removed)
	{
		if(err)
			return res.status(500).send('Error 500: ' + err);

		if(!removed)
			return res.status(404).send('Error 404: user not found id=' + uid);

		return res.json(removed);
	})
}


// ///////////////////////////////////////////////////////////////////////
//
//                               competitions
//
// ///////////////////////////////////////////////////////////////////////

exports.getAllCompetitions = function(req,res)
{
	competitions.find().toArray(function(err,competitions)
	{
		if(err)
			return res.status(500).send('Error 500: ' + err);

		return res.json(competitions);
	});
}

exports.getCompetition = function(req,res)
{
	var cid = req.params.cid;

	competitions.findOne({_id: new mongodb.ObjectID(cid)}, function(err,competition)
	{
		if(err)
			return res.status(500).send('Error 500: ' + err);

		if(!competition)
			return res.status(404).send('Error 404: competition not found id=' + cid);

		return res.json(competition);
	})
}

exports.addCompetition = function(req,res)
{
	var doc = {
		name:      req.body.name     || "name undefined",
		date:      req.body.date     || "0000-00-00",
		distance:  req.body.distance || 0 
	};

	competitions.insert(doc, {}, function(err,records)
	{
		console.log(records);

		if(err)
			return res.status(500).send('Error 500: ' + err);

		var response = {
			success: true,
			uid: records[0]._id
		};
		res.json(response);		
	})
}

// ///////////////////////////////////////////////////////////////////////
//
//                                  plans
//
// ///////////////////////////////////////////////////////////////////////

exports.getAllPlans = function(req,res)
{
	plans.find().toArray(function(err,plans)
	{
		if(err)
			return res.status(500).send('Error 500: ' + err);

		return res.json(plans);
	});
}

exports.getPlan = function(req,res)
{
	var pid = req.params.pid;

	plans.findOne({_id: new mongodb.ObjectID(pid)}, function(err,plan)
	{
		if(err)
			return res.status(500).send('Error 500: ' + err);

		if(!plan)
			return res.status(404).send('Error 404: plan not found id=' + pid);

		return res.json(plan);
	})
}

exports.addPlan = function(req,res)
{
	var doc = {
		name:         req.body.name || "name undefined",
		distance:     req.body.distance || 10.0,
		weeks:        req.body.weeks || 18
	};

	plans.insert(doc, {}, function(err,records)
	{
		console.log(records);

		if(err)
			return res.status(500).send('Error 500: ' + err);

		var response = {
			success: true,
			uid: records[0]._id
		};
		res.json(response);		
	})
}

exports.savePlan = function(req,res)
{

}

exports.getPlannedRun = function(req,res)
{

}

exports.savePlannedRun = function(req,res)
{

}

// ///////////////////////////////////////////////////////////////////////
//
//                               user runs
//
// ///////////////////////////////////////////////////////////////////////

exports.getAllUserRuns = function(req,res)
{

}

exports.addUserRun = function(req,res)
{

}

exports.getUserRun = function(req,res)
{

}

exports.saveUserRun = function(req,res)
{

}

