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

// GET /training
// GET /training/:id
// POST /training

//app.param('id', training.validateId);

app.get('/', 			training.root);
// app.get('/training', 		training.getAlltraining);
// app.get('/training/:id', 	training.getPhoto);
// app.post('/training', 	training.postPhoto);
// app.del('/training/:id',  training.deletePhoto);
app.all('*',            err404);


var serverport = process.env.PORT || 4740;
console.log("listening on " + serverport);
app.listen(serverport);
