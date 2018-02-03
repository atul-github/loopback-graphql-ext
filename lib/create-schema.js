var {buildSchema} = require('graphql');
var { GraphQLSchema, GraphQLObjectType, GraphQLString, GraphQLID,GraphQLList, GraphQLInputObjectType,
  GraphQLBoolean,
  GraphQLFloat,
  GraphQLEnumType,
  GraphQLInt,GraphQLScalarType} = require('graphql'); 
var loopback = require('loopback');
var { Kind } = require('graphql/language');

function createFieldsFilter(m) {
  var typeDef = 'input ' + m.modelName + 'FieldsFilter { \n';

  Object.keys(m.definition.properties).forEach((k, index) => {
    var p = m.definition.properties[k];
    var t = convertType(p);
    if (!t)
      return;
    typeDef += ' ' + k + ' : Boolean \n';
  });

  typeDef += ' } \n\n';

  return typeDef;
}

function objectifyFilter(f) {

  Object.keys(f).forEach((key, index) => {
    if (!f[key])
      return;
    if (!Object.getPrototypeOf(f[key])) {
      f[key] = Object.assign({}, f[key]);
    }
    if (typeof f[key] === 'object')
      objectifyFilter(f[key]);
  });

  return f;
}
function rearrangeFilter(f) {

  Object.keys(f).forEach((key, index) => {

    if (key.toLowerCase() === 'inq'
      || key.toLowerCase() === 'gt'
      || key.toLowerCase() === 'gte'
      || key.toLowerCase() === 'lt'
      || key.toLowerCase() === 'lte'
      || key.toLowerCase() === 'nin') {
      var inqProperties = Object.keys(f[key]);
      if (inqProperties.length > 0) {
        var firstProp = inqProperties[0];
        f[key][key] = f[key][firstProp];
        delete f[key][firstProp];

        f[firstProp] = f[key];
        delete f[key];
      }
    }
    else if (typeof f[key] === 'object')
      rearrangeFilter(f[key]);
  });

  return f;
}
function convertBasicType(typename) {
  switch (typename) {
    case 'Integer':
    case 'Number':
      return GraphQLInt;
    case 'String':
      return GraphQLString;
    case 'Boolean':
      return GraphQLBoolean;
    default:
      return null;
  }
}
function convertType(t, k) {
  if (k === 'id' && t.id && t.generated) {
    return GraphQLID;
  }
  var typename = t.type.name;
  return convertBasicType(typename);
}
function convertFromLoopbackType(t, k) {
  var temp = convertType(t, k);
  if (temp) {
    return temp;
  }
  var typename = t.type.name;
  if (Array.isArray(t.type)) {
    var arrayType = t.type[0].name;
    if (arrayType === 'ModelConstructor') {
      return new GraphQLList(createModelType(t.type[0]));
      //return new GraphQLList(GraphQLString);// new   '[' + t.type[0].modelName + ']';
    }
    var temp = convertBasicType(t.type[0].name);
    if (temp)
      return new GraphQLList(temp);
    else
      new GraphQLList(GraphQLString);;
  }
  else if (t.type.name === 'ModelConstructor') {
    return createModelType(t.type);
    //return GraphQLString; //t.type.modelName;
  }
  return GraphQLString; //'String';
}
var allModelTypes = {};

function createModelType(m) {
  if (allModelTypes[m.modelName]) {
    return allModelTypes[m.modelName];
  }
  var o = {
    name: m.modelName,
    description: m.settings.description,
    fields : {}
  };

  Object.keys(m.definition.properties).forEach((k, index) => {
    var p = m.definition.properties[k];
    o.fields[k] = { type: convertFromLoopbackType(p, k) };
  });

  allModelTypes[m.modelName] = new GraphQLObjectType(o);
  return allModelTypes[m.modelName];
}


function createOrderFilter(m) {

  var enumValues = {};

  Object.keys(m.definition.properties).forEach((k, index) => {
    var p = m.definition.properties[k];
    var t = convertType(p);
    if (!t) {
      return;
    }
    enumValues[k] = { value: k };
    //enumValues[k + '_ASC'] = { value: k + ' ASC' };
    enumValues[k + '_DESC'] = { value: k + ' DESC' };
  });

  const z = new GraphQLEnumType({
    name: 'order' + m.modelName,
    values: enumValues
  });
  return z;
}


function createModelWhereFilter(m) {

  const modelInqFilter = new GraphQLInputObjectType(
    {
      name: 'inq' + m.modelName + 'WhereFilter',
      fields: () => {
        var temp = {};
        Object.keys(m.definition.properties).forEach((k, index) => {
          var p = m.definition.properties[k];
          var t = convertType(p);
          if (!t) {
            return;
          }
          temp[k] = { type: new GraphQLList(t) };
        });
        return temp;
      }
    }
  );

  const modelWhereFilter = new GraphQLInputObjectType(
    {
      name: m.modelName + 'WhereFilter',
      fields: () => {
        var temp = {};
        Object.keys(m.definition.properties).forEach((k, index) => {
          var p = m.definition.properties[k];
          var t = convertType(p);
          if (!t) {
            return;
          }
          temp[k] = { type: t };
        });
        temp.and = { type: new GraphQLList(modelWhereFilter) };
        temp.or = { type: new GraphQLList(modelWhereFilter) };
        temp.gt = { type: modelWhereFilter };
        temp.gte = { type: modelWhereFilter };
        temp.lt = { type: modelWhereFilter };
        temp.lte = { type: modelWhereFilter };
        temp.inq = { type: modelInqFilter };
        temp.nin = { type: modelInqFilter };
        return temp;
      }
    }
  );
  return modelWhereFilter;
}

function createModelFilter(m) {
  var o = {
    name: m.modelName + 'Filter',
    fields: {}
  };
  o.fields.where = {
    type: createModelWhereFilter(m)
  };
  o.fields.limit = {
    type: GraphQLInt
  };
  o.fields.skip = {
    type: GraphQLInt
  };
  o.fields.order = {
    type: new GraphQLList(createOrderFilter(m))  //createScaler(m)
  }
  return new GraphQLInputObjectType(o);
}

function getData(modelName, filter) {
  var f = {};
  try {
    if (typeof filter === 'string')
      f = JSON.parse(filter);
    else
      f = filter;
  }
  catch (x) { }
  if (f) {
    f = objectifyFilter(f);
    f = rearrangeFilter(f);
  }

  var p = new Promise((resolve, reject) => {
    var model = loopback.findModel(modelName);
    model.find(f, function (err, results) {
      if (!err)
        return resolve(results);
      else
        return reject(err);
    });
  });
  return p;
}

var allModelClasses = {};
function createModelClass(m) {

  var t = createModelType(m);
  var o = {
    name: m.modelName + 'Model',
    fields: {
      find: {
        type: new GraphQLList(t),
        args: { filter: { type: createModelFilter(m) } },
        resolve: function (source, {filter}) {
          //console.log('xxxcame');
          return getData(m.modelName, filter);
        }
      },
    }
  };
  allModelClasses[m.modelName] = new GraphQLObjectType(o);
  return allModelClasses[m.modelName];
}


function createSchema(app) {
  var queryType = {
    name: 'RootQuery',
    description: 'root query',
    fields: {}
  };
  Object.keys(app.models).map((m, index) => {
    var model = app.models[m];
    if (!model.pluralModelName) {
      model.pluralModelName = model.modelName + 's';
    }
    var t = createModelClass(model); //createModelType(model);
    queryType.fields[model.pluralModelName] = {
      type: t,
      modelName : model.modelName,
      resolve: function () {
        return {};
      }
    };
  });

  
  const rootQuery = new GraphQLObjectType(
    queryType
  );

  //var schema = buildSchema(schemaString);
  var schema = new GraphQLSchema({ query: rootQuery });

  function getDataById(modelName, id) {
    var p = new Promise((resolve, reject) => {
      var model = loopback.findModel(modelName);
      model.findById(id, function (err, results) {
        if (!err)
          return resolve(results);
        else
          return reject(err);
      });
    });
    return p;
  }

  return { schema , rootValue : null };
}

module.exports = createSchema;
