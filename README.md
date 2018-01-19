# loopback-graphql-ext (WIP)

Executing queries on loopback models using GraphQL

## Installation

* Download code from this side
* npm install <b>git://github.com/atul-github/loopback-graphql-ext.git</b>
* Copy code into node_modules\loopback-graphql-ext
* Call init-graphql before application starts (after loopback boot is over)

```
var app = loopback();
.... some other code
var graphqlExt = require('loopback-graphql-ext');
graphqlExt.init(app); //app is loopback application
```

* Run loopback application as you usually do
* Access GraphQL end point on

```
http://localhost:3000/graphql
```
