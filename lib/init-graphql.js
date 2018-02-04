var graphqlHTTP = require('express-graphql');
var createModelSchema = require('./create-schema');

function createSchema(app) {
  var result = createModelSchema(app);
  return result;
}

function mount(app, schema, rootValue, mountPath) {
  //var schema = result.schema;
  //var rootValue = result.rootValue;
  if (!mountPath) {
    mountPath = '/graphiql';
  }
  app.use(mountPath, graphqlHTTP((req) => {
    return {
      schema: schema,
      rootValue: rootValue,
      graphiql: true,
      pretty: true,
      context: { x: 'x', y: 'y' }
      }
    }
  ));
}


function init(app, cb) {
  var result = createSchema(app);
  mount(app, result.schema, result.rootValue);
  if (cb) {
    return cb(result);
  }
}

function initold(app, cb) {
  var result = createSchema(app);
  //var schema = createSchema(app);
  //schema.graphiql = true;
  var schema = result.schema;
  var rootValue = result.rootValue;
  app.use('/graphql', graphqlHTTP((req) => {
    return {
      schema: schema,
      rootValue: rootValue,
      graphiql: true,
      pretty: true,
      context: { x: 'x', y: 'y' }
    }
  }
  ));

  if (cb) {
    return cb();
  }
}

module.exports = {
  init : init,
  createSchema : createSchema,
  mount : mount
}

