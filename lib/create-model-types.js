var {buildSchema} = require('graphql');
var { GraphQLSchema } = require('graphql'); // CommonJS
//import {GraphQLSchema, GraphQLObjecType, GraphQLString} from 'graphql'
var loopback = require('loopback');


function converType(t) {
  var typename = t.type.name;
  switch (typename) {
    case 'Integer':
    case 'Number':
      return 'Int';
    case 'String':
      return 'String';
    case 'Boolean':
      return 'Boolean';
    default:
      return null;
  }
}




function convertFromLoopbackType(t) {
  var temp = converType(t);
  if (temp) {
    return temp;
  }
  var typename = t.type.name;
  if (Array.isArray(t.type)) {
    var arrayType = t.type[0].name;
    if (arrayType === 'ModelConstructor') {
      return '[' + t.type[0].modelName + ']';
    }
    return '[String]';
  }
  else if (t.type.name === 'ModelConstructor') {
    return t.type.modelName;
  }
  return 'String';
}

//creating Model Type like Customer, ACL etc
function createType(m) {
  var typeDef = 'type ' + m.modelName + ' { \n';
  //console.log(m);
  Object.keys(m.definition.properties).forEach((k, index) => {
    var p = m.definition.properties[k];
    var s = null;
    if (k === 'id' && p.id && p.generated) {
      s = k + ': ID' + '\n';
    }
    else {
      s = k + ': ' + convertFromLoopbackType(p) + '\n';
    }
    typeDef += s;
  });
  typeDef += ' }\n\n';
  return typeDef;
}

// create Model type like CustomerModel, InventoryModel etc which has find/findbyid functions
function createModelType(m) {
  var typeDef = 'type ' + m.modelName + 'Model { \n';

  //typeDef += ' find : [' + m.modelName + '] \n';
  //typeDef += ' findx(where:' + m.modelName + 'WhereFilter) : [' + m.modelName + '] \n';
  typeDef += ' find(filter:' + m.modelName + 'Filter) : [' + m.modelName + '] \n';
  typeDef += ' findById(id:String!) : ' + m.modelName + ' \n';


  //typeDef += ' test(where:' + m.modelName + 'Filter) : [' + m.modelName + '] \n';

  typeDef += ' } \n\n';
  return typeDef;
}


function createFieldWhereFilter(m) {
  var typeDef = 'input ' + m.modelName + 'WhereFilter { \n';
  //console.log(m);

  var inqFilter = 'input inq' + m.modelName + 'WhereFilter { \n';

  Object.keys(m.definition.properties).forEach((k, index) => {
    var p = m.definition.properties[k];
    var t = converType(p);
    if (!t)
      return;
    typeDef += ' ' + k + ' : ' + t + ' \n';

    inqFilter += ' ' + k + ': [' + t + '] \n';

  });

  inqFilter += ' } \n\n';

  inqFilter = inqFilter + inqFilter.replace('input inq', 'input nin');

  typeDef += ' and : [' + m.modelName + 'WhereFilter] \n';
  typeDef += ' or : [' + m.modelName + 'WhereFilter] \n';
  typeDef += ' gt : ' + m.modelName + 'WhereFilter \n';
  typeDef += ' gte : ' + m.modelName + 'WhereFilter \n';
  typeDef += ' lt : ' + m.modelName + 'WhereFilter \n';
  typeDef += ' lte : ' + m.modelName + 'WhereFilter \n';
  typeDef += ' inq : inq' + m.modelName + 'WhereFilter \n';
  typeDef += ' nin : nin' + m.modelName + 'WhereFilter \n';
  typeDef += ' } \n\n';

  typeDef = inqFilter + '\n' + typeDef;

  return typeDef;
}


function createFieldsFilter(m) {
  var typeDef = 'input ' + m.modelName + 'FieldsFilter { \n';

  Object.keys(m.definition.properties).forEach((k, index) => {
    var p = m.definition.properties[k];
    var t = converType(p);
    if (!t)
      return;
    typeDef += ' ' + k + ' : Boolean \n';
  });

  typeDef += ' } \n\n';

  return typeDef;
}

//function createRelationClause(m) {
//  var typeDef = 'input ' + m.modelName + 'IncludeFilter { \n';

//  Object.keys(m.definition.properties).forEach((k, index) => {
//    var p = m.definition.properties[k];
//    var t = converType(p);
//    if (!t)
//      return;
//    typeDef += ' ' + k + ' : Boolean \n';
//  });

//  typeDef += ' } \n\n';

//  return typeDef;
//}

function createModelFilter(m) {
  var typeDef = 'input ' + m.modelName + 'Filter { \n';
  typeDef += ' where : ' + m.modelName + 'WhereFilter \n';
  typeDef += ' fields : ' + m.modelName + 'FieldsFilter \n';
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

function createSchema(app) {
  var modelNames = [];
  var modelObjects = [];
  var schemaString = '';

  Object.keys(app.models).map((m, index) => {
    modelNames.push(m);
    var model = app.models[m];
    var modelTypeDef = createType(model);
    schemaString += modelTypeDef;

    modelTypeDef = createFieldWhereFilter(model);
    schemaString += modelTypeDef;

    modelTypeDef = createFieldsFilter(model);
    schemaString += modelTypeDef;

    modelTypeDef = createModelFilter(model);
    schemaString += modelTypeDef;


    modelTypeDef = createModelType(model);
    schemaString += modelTypeDef;
  });

  schemaString += 'type Query { ';

  Object.keys(app.models).map((m, index) => {
    var model = app.models[m];
    if (!model.pluralModelName) {
      model.pluralModelName = model.modelName + 's';
    }
    var s = '';
    s = model.pluralModelName + ' : ' + model.modelName + 'Model \n';
    schemaString += s;
  });

  schemaString += ' } ';



  var schema = buildSchema(schemaString);

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

  // The root provides a resolver function for each API endpoint
  var rootValue = {};


  class Model {
    constructor(name) {
      this.modelName = name;
    }
    find({filter}, y, z) {
      return getData(this.modelName, filter);
    }
    findx({where}, y, z) {
      return getData(this.modelName, { where: where });
    }
    findById({id}) {
      return getDataById(this.modelName, id);
    }
  }

  Object.keys(app.models).map((m, index) => {
    var model = app.models[m];
    rootValue[model.pluralModelName] = function () {
      return new Model(model.modelName);
    }
  });
  return { schema, rootValue };
}

module.exports = createSchema;

