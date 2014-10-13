#!/usr/bin/env bash

curl -X POST -H "Content-Type: application/json" -d '{ "commonName":"Texas Star", "scientificName":"Lindheimera Texana", "flowerColor":"yellow" }' http://localhost:8086/api/v1/flowers
curl -X POST -H "Content-Type: application/json" -d '{ "commonName":"Evening Primrose", "scientificName":"Oenothera speciosa", "flowerColor":"pink" }' http://localhost:8086/api/v1/flowers
curl -X POST -H "Content-Type: application/json" -d '{ "commonName":"Crimson Clover", "scientificName":"Trifolium incarnatum", "flowerColor":"red" }' http://localhost:8086/api/v1/flowers
#
curl -X GET http://localhost:8086/api/v1/flowers
#
echo 'processing complete'

