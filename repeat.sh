#!/bin/bash
for i in `seq 1 200`;
do
	node index.js -u agentf90 -p $1 -k $2 -s $3 -v
done
