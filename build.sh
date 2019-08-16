#!/bin/bash
echo "stopping container"
docker stop qat
docker rm qat
echo "pulling changes"
git pull
echo "building"
docker build -t pishifat/qat .
echo "running"
docker run --name qat -p 80:3000 -d pishifat/qat
