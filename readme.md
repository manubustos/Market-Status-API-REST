Order and price query project using Bittrex API.

## Requirements

- Docker

## Using

In order to run the API you must open the console in the root directory and run (with docker opened) the command:

> docker compose up

Docker will take care of installing all the dependencies and start the program.

## Explanation

The implementation was done using a single docker container:

- api: The system API, which runs with node 16 and is accessed from the path http://localhost:8888. The paths are
  - Tips of the orderbook: /orderbook-tips/:pairName
  - Calculation of the effective price of an order: /effective-price/:pairName?type={buy|sell}&amount={number}
  - Calculation of the effective price of an order with price limit: /effective-price/:pairName?type={buy|sell}&amount={number}&priceLimit={number}
