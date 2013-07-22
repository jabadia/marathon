#!/bin/bash

if [ -z "$1"]; then
	echo "indica el backup que quieres restaurar"
else
	mongorestore ./$1
fi