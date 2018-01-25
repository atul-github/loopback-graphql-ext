# loopback-graphql-ext (WIP)

Executing queries on loopback models using GraphQL. This gives you intellisense while forming queries in GraphiQL. See [Examples](./EXAMPLE.md)

## Installation

* Download code from this side
* npm install <b>git://github.com/atul-github/loopback-graphql-ext.git</b>
* Copy code into node_modules\loopback-graphql-ext
* Call init() before application starts (AND after loopback boot is over)

```
var app = loopback();
.... some other code
var graphqlExt = require('loopback-graphql-ext');
graphqlExt.init(app); //app is loopback application
```

* Start loopback application as you usually do
* Access GraphQL end point on

```
http://localhost:3000/graphql
```

## What works so far

* where filter
* fields filter
* Limit filter
* Skip filter

Refer to [Examples](./EXAMPLE.md)


### Limitations
* gt/gte/lt/lte/inq etc operators becomes 'keywords' and cannot be part of model property
* Major problem I am facing is to implement flexibility when object can be a string or array. Eg include, order etc 

## Upcoming Features

* Making it component so you don't have to initialize from code
* Include filter
* Order filter
* Mutation
* Authentication/Authorization using Access Token
