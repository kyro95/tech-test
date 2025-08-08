![Build](https://github.com/kyro95/tech-test/actions/workflows/node.js.yml/badge.svg?branch=main)

# tech-test

[![Tech stack](https://skillicons.dev/icons?i=npm,nodejs,nestjs,ts,mysql,jest)](https://skillicons.dev)
<br/>
A nestjs simple test repo to handle users, products and orders.  
Wanna try out the API for yourself? Download [Postman](https://www.postman.com/downloads/).  
Check out the documentation on how to setup a gRPC collection as well [here](https://learning.postman.com/docs/sending-requests/grpc/grpc-request-interface/). You can also find a [postman collection](https://cloudy-trinity-572494.postman.co/workspace/My-Workspace~0de2b6b5-289f-4054-8f83-a922ccfb183c/collection/68933e66ebf56f8d888baecd?action=share&creator=23892098&active-environment=23892098-f8757c56-bd57-4b72-8152-dc0399307206) about this API

## Run project

The following commands will guide you through installing the dependencies and running the application.  
Setup first the `.env` file. Feel free to copypaste `example.env` and set your custom enviroment.

```bash
# Install deps
$ npm install

# production mode
$ npm run start:prod

# development
$ npm run start

# or if you wanna start in watch mode (build each time the code changes)
# production mode
$ npm run start:prod
```

<br/>

## Run tests

This section will guide you through running the unit/e2e tests

> ⚠️ **Important:** Before running the tests, make sure to **stop the default Docker profile** if it’s up otherwise main db is going to get polluted.
> Run instead using the `--profile test` flag.

```bash
# unit tests
$ npm run test

# e2e tests
$ npm run test:e2e

# test coverage
$ npm run test:cov
```

<br/>

## Docker

Just use default if you wanna launch a dockerized instance of the application or test if you wanna launch the unit/e2e tests.

Docker profiles:

- default - runs app and app database
- test - runs only test db for e2e tests
- dev - runs only app database for running the application locally.

```bash
# Available profiles: default, test, dev

# Init/Start container
$ docker-compose --profile default up -d --build

# Shutdown container
$ docker-compose --profile default down

# Delete container and volumes
$ docker-compose --profile default down -v
```
