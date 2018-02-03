# Play with loopback-graphql-ext 

## Install example sample app and loopback-graphql-ext on top of it

```
git clone https://github.com/strongloop/loopback-example-relations.git
cd loopback-example-relations
npm install
npm install git://github.com/atul-github/loopback-graphql-ext.git 
```

## Edit server.js to load extension

Edit <b>server/server.js</b> and add following once application boot and just before start

```
var graphqlExt = require('loopback-graphql-ext');
graphqlExt.init(app); //app is loopback application
  // start the server if `$ node server.js`
  if (require.main === module)
    app.start();
```

## Start the application
```
node .
```

## Open GraphiQL Editor at http://localhost:3000/graphql


### Examples

* Querying Models with very similar looking loopback queries

### Example 1 - getting Customer records
```
  Customers{
    find{
      id
      name
      age
      billingAddress{
        id
        street
        city
        state
        zipCode
      }
    }
  }
```

### Example 2 - using simple filter
```
  Customers{
    find (filter:{where:{name : "Customer D"}}) {
      id
      name
      age
    }
  }
```

### Example 3 - where age is greater than or eqal to 22
```
  Customers{
    find (filter:{where:{ gte  :{ age : 22 }}}) {
      id
      name
      age
    }
  }
```


### Example 4 - using 'and' filter
```
  Customers{
    find (filter:{where: { and : [{ gt  :{ age : 22 }}, {name:"Customer C"}]   } }    ) {
      id
      name
      age
   }
  }
```
<b>Note: See the limitation. gt is used before property which is not similar to loopback. </b>

### Example 5 - using 'and' filter and 'inq' filter
```
  Customers{
    find (filter:{where: { and : [{ gt  :{ age : 22 }},  {inq:{ name : ["Customer C", "Customer D"]}}  ]   } }    ) {
      id
      name
      age
    }
  }
```

### Example 6 - additional nesting in filter with 'or' condition

```
 Customers{
    find (filter:{where: {or : [ { and : [{ gt  :{ age : 22 }},  {inq:{ name : ["Customer C", "Customer D"]}}  ]   }, {id : 1} ] }   }    ) {
      id
      name
      age
    }
  }
```

### Example 6 - using limit filter

```
{
  Customers{
    find(filter:{ limit:2, where:{gt:{age:20}}}){
      id
      name
      age
    }
  }
}
```

### Example 7 - using skip 

```
  Customers{
    find(filter:{where:{gt:{id:1 }}, skip : 1} ) {
      id
      name
      age
    }
  }
```

### Example 8 - using Order filter (single field)
```
  Customers{
    find(filter:{order : name}) {
      id
      name
      age
    }
  }
```

### Example 9 - using Order filter (multiple fields)
```
  Customers{
    find(filter:{order : [name, age]}) {
      id
      name
      age
    }
  }
```

### Example 10 - using Order filter (multiple fields)
```
  Customers{
    find(filter:{order : [name_DESC, age]}) {
      id
      name
      age
    }
  }
```

Note: See the use of DESC (descending). Not able to make like loopback ( order : [name desc, age] ) 

  




