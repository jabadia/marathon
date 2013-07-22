#!/bin/bash

now=`date +"%Y%m%d_%H%M"`
dumpname="${now}_training_dump"
echo "Generando backup en ${dumpname}"
mongodump --db training --out ./${dumpname}
