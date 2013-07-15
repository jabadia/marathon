"use strict";

var request = require('request');
var assert  = require('assert');
var mongodb = require('mongodb');
var async   = require('async');


var dburi    = "mongodb://jabadia:jabadia@dharma.mongohq.com:10011/training"

var users;
var competitions;
var plans;


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

	describe('PUT /user/:uid', function()
	{
		var uid;

		before(function(done)
		{
			users.remove({}, function(err,removed)
			{
				assert.equal(err,null, "failed to clear db: " + err);

				request.post({
					url: url + '/user', 
					form: { 
						name: 'Jvr', 
						birthdate: "0000-00-00",
					}
				}, function(err,resp)
				{				
					var data = JSON.parse(resp.body);
					uid = data.uid;
					done();
				});
			});
		});

		after(function(done)
		{
			done();
		});

		it("should modify one particular user", function(done)
		{
			request.put({
				url: url + '/user/' + uid,
				form: { 
					name: 'Javier', 
					birthdate: "1974-11-11",
				}
			}, function(err,resp)
			{				
				var data = JSON.parse(resp.body);
				assert.ok(data.success,"should return success");

				request.get({url: url + '/user/' + uid}, function(err,resp)
				{				
					var data = JSON.parse(resp.body);
					assert.equal(data._id,uid, "should keep same id");
					assert.equal(data.name,'Javier', "should have changed name");
					assert.equal(data.birthdate,'1974-11-11', "should have changed date");
					done();
				});
			});
		});

		it("should fail to modify non-existent user", function(done)
		{
			var badid = "1";
			var nonexistent = "51e35a929a7e0b0f54000004";
			var doc = { 
				name: 'Perico', 
				birthdate: "1920-11-11",
			};

			request.put({
				url: url + '/user/' + badid,
				form: doc
			}, function(err,resp)
			{				
				assert.equal(resp.statusCode,500, "should return error");

				request.put({
					url: url + '/user/' + nonexistent,
					form: doc	
				}, function(err,resp)
				{
					assert.equal(resp.statusCode,404, "should return not found error");
					done();
				});
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

	describe('GET /plan', function()
	{
		before(function(done)
		{
			plans.remove({}, function(err,removed)
			{
				assert.equal(err,null, "failed to clear db: " + err);

				request.post({
					url: url + '/plan', 
					form: { 
						name: '18 week training for NYC Marathon', 
						distance: 42.195,
						weeks: 18
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

		it("should return an array of plans", function(done)
		{
			request.get({url: url + '/plan'}, function(err,resp)
			{				
				var data = JSON.parse(resp.body);
				assert.equal(data.length,1, "should return one element");
				done();
			});
		});

	})

});
