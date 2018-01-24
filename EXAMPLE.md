### Experiment with loopback example project

#### Install example app

```
git clone https://github.com/strongloop/loopback-example-relations.git
cd loopback-example-relations
npm install
npm install git://github.com/atul-github/loopback-graphql-ext.git 
```

Edit <b>server/server.js</b> and add following once application boot and just before start

```
var graphqlExt = require('loopback-graphql-ext');
graphqlExt.init(app); //app is loopback application
  // start the server if `$ node server.js`
  if (require.main === module)
    app.start();
```

Start the application
```
node .
```

#### Example 1 - getting Customer records
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

#### Example 2 - using simple filter
```
  Customers{
    find (filter:{where:{name : "Customer D"}}) {
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

#### Example 3 - where age is greater than or eqal to 22
```
  Customers{
    find (filter:{where:{ gte  :{ age : 22 }}}) {
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


#### Example 4 - using 'and' filter
```
  Customers{
    find (filter:{where: { and : [{ gt  :{ age : 22 }}, {name:"Customer C"}]   } }    ) {
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
<b>Note: See the limitation. gt is used before property which is not similar to loopback. </b>

#### Example 5 - using 'and' filter and 'inq' filter
```
  Customers{
    find (filter:{where: { and : [{ gt  :{ age : 22 }},  {inq:{ name : ["Customer C", "Customer D"]}}  ]   } }    ) {
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

#### Example 6 - additional nesting in filter with 'or' condition

```
 Customers{
    find (filter:{where: {or : [ { and : [{ gt  :{ age : 22 }},  {inq:{ name : ["Customer C", "Customer D"]}}  ]   }, {id : 1} ] }   }    ) {
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



<b>Note: See the limitation. gt is used before property which is not similar to loopback. </b>

