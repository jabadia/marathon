#!/bin/bash

echo "-- Users"
curl http://127.0.0.1:4740/user
echo ""
echo "-- Competitions"
curl http://127.0.0.1:4740/competition
echo ""
