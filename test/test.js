"use strict";

var request = require('request');
var assert  = require('assert');
var mongodb = require('mongodb');
var async   = require('async');


var dbname   = "training";
var dbserver = "localhost";
var dbport   = mongodb.Connection.DEFAULT_PORT;

var db;
var users;
var competitions;


describe('Backend REST API Test', function()
{
	//
	// test configuration
	//
	var url = 'http://127.0.0.1:4740';


	//
	// common functions
	//
	before(function(done)
	{
		var mongoClient = new mongodb.MongoClient(new mongodb.Server(dbserver,dbport));
		mongoClient.open(function(err,mongoClient)
		{
			db = mongoClient.db(dbname);
			async.map(['users','competitions'], 
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

					done();
				}
			);
		});		
	});

	//
	// tests begin here
	//
	describe('GET /user', function() 
	{
		before(function(done)
		{
			users.remove({}, function(err,removed)
			{
				assert.equal(err,null, "failed to clear db: " + err);

				request.post({
					url: url + '/user', 
					form: { 
						name: 'Javier', 
						birthdate: "1974-11-11",
					}
				}, function(err,resp)
				{				
					done();
				});
			});
		});

		after(function(done)
		{
			done();
		});

		it("should return an array of users", function(done)
		{
			request.get({url: url + '/user'}, function(err,resp)
			{				
				var data = JSON.parse(resp.body);
				assert.equal(data.length,1, "should return one element");
				done();
			});
		});
	});


	describe('GET /competition', function() 
	{
		before(function(done)
		{
			competitions.remove({}, function(err,removed)
			{
				assert.equal(err,null, "failed to clear db: " + err);

				request.post({
					url: url + '/competition', 
					form: { 
						name: 'NYC Marathon', 
						date: "2013-11-03",
						distance: 42.195
					}
				}, function(err,resp)
				{				
					done();
				});
			});
		});

		after(function(done)
		{
			done();
		});

		it("should return an array of competitions", function(done)
		{
			request.get({url: url + '/competition'}, function(err,resp)
			{				
				var data = JSON.parse(resp.body);
				assert.equal(data.length,1, "should return one element");
				done();
			});
		});
	});

});
