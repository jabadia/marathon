#!/bin/bash

curl \
	 -X POST \
	-H "Content-Type: application/json" \
	-d '{"name":"Javier Abadía","birthdate":"1974-11-11"}' \
	http://127.0.0.1:4740/user

echo ""

curl \
	 -X POST \
	-H "Content-Type: application/json" \
	-d '{"name":"NYC Marathon","date":"2013-11-03","distance":42.195}' \
	http://127.0.0.1:4740/competition


