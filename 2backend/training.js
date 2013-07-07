"use strict";

var request = require('request');
var mongodb = require('mongodb');

var dbname   = "training";
var dbserver = "localhost";
var dbport   = mongodb.Connection.DEFAULT_PORT;

var db;
var users;
var competitions;


var mongoClient = new mongodb.MongoClient(new mongodb.Server(dbserver,dbport));
mongoClient.open(function(err,mongoClient)
{
	db = mongoClient.db(dbname);
	db.collection('users',{},function(err,collection)
	{
		if(err)
		{
			console.log("can't open users collection: ", err);
			return;
		}
		console.log("users collection ready!");
		users = collection;
	});
	db.collection('competitions',{},function(err,collection)
	{
		if(err)
		{
			console.log("can't open competitions collection: ", err);
			return;
		}
		console.log("competitions collection ready!");
		competitions = collection;
	});
});



exports.root = function (req,res) 
{
	res.type("text/plain");
	res.send('api root' + 
		"\ncurrent: " + new Date() + 
		"\nlatest:  " + new Date(parseInt(req.latest_request))
	);
}

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

	users.findOne({_id: new mongodb.ObjectID(cid)}, function(err,competition)
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


exports.getAllPlans = function(req,res)
{

}

exports.getPlan = function(req,res)
{

}

exports.getPlannedRun = function(req,res)
{

}

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

