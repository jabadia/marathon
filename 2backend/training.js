"use strict";

var request = require('request');
var mongodb = require('mongodb');
var async   = require('async');

//var dburi    = "mongodb://jabadia:jabadia@dharma.mongohq.com:10011/training"
var dburi    = "mongodb://localhost:27017/training"

var users;
var competitions;
var plans;

mongodb.Db.connect(dburi, function(err,client)
{
	async.map(['users','competitions','plans'], 
		function(collection_name, callback)
		{
			client.collection(collection_name,{},callback);
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



exports.root = function (req,res,next)
{
	res.type("text/plain");
	res.send('api root' + 
		"\ncurrent: " + new Date() + 
		"\nlatest:  " + new Date(parseInt(req.latest_request))
	);
}

exports.errorHandler = function(err,req,res,next)
{
	console.error(err.stack);
	res.setHeader('Content-Type', 'application/json');
	if( err.notFound )
	{
		var error = { error: err.message + " " + err.notFound }
		res.status(404).json(error);
	}
	else
	{
		var error = { error: 'Internal Server Error'}
		res.status(500).json(error);
	}
}

// ///////////////////////////////////////////////////////////////////////
//
//                                  users
//
// ///////////////////////////////////////////////////////////////////////

exports.getAllUsers = function(req,res,next)
{
	users.find().toArray(function(err,users)
	{
		if(err)
			return next(err);
		else
			return res.json(users);
	});
}

exports.getUser = function(req,res,next)
{
	var uid = req.params.uid;

	users.findOne({_id: new mongodb.ObjectID(uid)}, function(err,user)
	{
		if(err)
			return next(err);

		if(!user)
		{
			var error = new Error('user not found');
			error.notFound = uid;
			next(error);
		}

		return res.json(user);
	})
}

exports.addUser = function(req,res,next)
{
	var doc = {
		name:         req.body.name || "name undefined",
		birthdate:    req.body.birthdate || "0000-00-00",
	};

	users.insert(doc, {}, function(err,records)
	{
		console.log(records);

		if(err)
			return next(err);

		var response = {
			success: true,
			uid: records[0]._id
		};
		res.json(response);		
	})
}

exports.modifyUser = function(req,res,next)
{
	var uid = req.params.uid;

	var doc = {
		name:         req.body.name || "name undefined",
		birthdate:    req.body.birthdate || "0000-00-00",
	};

	users.update({_id: new mongodb.ObjectID(uid)}, doc, { upsert: false }, function(err,records)
	{
		if(err)
			return next(err);

		if( records == 0)
		{
			var error = new Error('user not found');
			error.notFound = uid;
			next(error);
		}

		var response = {
			success: true,
		}
		res.json(response);		
	})
}

exports.deleteUser = function(req,res,next)
{
	var uid = req.params.uid;

	users.remove({_id: new mongodb.ObjectID(uid)}, function(err,removed)
	{
		if(err)
			return next(err);

		if(!removed)
		{
			var error = new Error('user not found');
			error.notFound = uid;
			next(error);
		}

		return res.json(removed);
	})
}


// ///////////////////////////////////////////////////////////////////////
//
//                               competitions
//
// ///////////////////////////////////////////////////////////////////////

exports.getAllCompetitions = function(req,res,next)
{
	competitions.find().toArray(function(err,competitions)
	{
		if(err)
			return next(err);

		return res.json(competitions);
	});
}

exports.getCompetition = function(req,res,next)
{
	var cid = req.params.cid;

	competitions.findOne({_id: new mongodb.ObjectID(cid)}, function(err,competition)
	{
		if(err)
			return next(err);

		if(!competition)
		{
			var error = new Error('competition not found');
			error.notFound = cid;
			next(error);
		}

		return res.json(competition);
	})
}

exports.addCompetition = function(req,res,next)
{
	var doc = {
		name:      req.body.name             || "name undefined",
		date:      req.body.date             || "0000-00-00",
		distance:  Number(req.body.distance) || 0 
	};

	competitions.insert(doc, {}, function(err,records)
	{
		console.log(records);

		if(err)
			return next(err);

		var response = {
			success: true,
			cid: records[0]._id
		};
		res.json(response);		
	})
}

// ///////////////////////////////////////////////////////////////////////
//
//                                  plans
//
// ///////////////////////////////////////////////////////////////////////

exports.getAllPlans = function(req,res,next)
{
	plans.find().toArray(function(err,plans)
	{
		if(err)
			return res.status(500).send('Error 500: ' + err);

		return res.json(plans);
	});
}

exports.getPlan = function(req,res,next)
{
	var pid = req.params.pid;

	plans.findOne({_id: new mongodb.ObjectID(pid)}, function(err,plan)
	{
		if(err)
			return next(err);

		if(!plan)
		{
			var error = new Error('plan not found');
			error.notFound = pid;
			next(error);
		}

		return res.json(plan);
	})
}

exports.addPlan = function(req,res,next)
{
	var doc = {
		name:         req.body.name             || "name undefined",
		distance:     Number(req.body.distance) || 10.0,
		weeks:        Number(req.body.weeks)    || 18,
		plannedRuns:  {}
	};

	plans.insert(doc, {}, function(err,records)
	{
		console.log(records);

		if(err)
			return next(err);

		var response = {
			success: true,
			pid: records[0]._id
		};
		res.json(response);		
	})
}

exports.savePlan = function(req,res,next)
{

}

exports.getPlannedRun = function(req,res,next)
{

}

exports.savePlannedRun = function(req,res,next)
{
	var pid  = req.params.pid;
	var prid = req.params.prid;

	var plannedRun = {
		distance: 	Number(req.body.distance) || 0.0,
		comments:   req.body.comments
	};
	var doc = {};
	doc['plannedRuns.' + prid] = plannedRun;
	plans.update({_id: new mongodb.ObjectID(pid)}, {$set:doc}, {}, function(err,count)
	{
		if(err)
			return next(err);

		var response = {
			success: true,
		};
		res.json(response);		
	})
}

exports.deletePlannedRun = function(req,res,next)
{
	var pid  = req.params.pid;
	var prid = req.params.prid;

	var doc = {};
	doc['plannedRuns.' + prid] = {};
	plans.update({_id: new mongodb.ObjectID(pid)}, {$unset:doc}, {}, function(err,count)
	{
		if(err)
			return next(err);

		var response = {
			success: true,
		};
		res.json(response);		
	})
}

// ///////////////////////////////////////////////////////////////////////
//
//                               user runs
//
// ///////////////////////////////////////////////////////////////////////

exports.getAllUserRuns = function(req,res,next)
{

}

exports.addUserRun = function(req,res,next)
{

}

exports.getUserRun = function(req,res,next)
{

}

exports.saveUserRun = function(req,res,next)
{

}

