"use strict";

var request = require('request');

exports.root = function (req,res) 
{
	res.type("text/plain");
	res.send('api root' + 
		"\ncurrent: " + new Date() + 
		"\nlatest:  " + new Date(parseInt(req.latest_request))
	);
}

