var clone = require('lodash').clone;
var Graph = require('./graph.js').Graph;
var Node = require('./graph.js').Node;
var inheritsFrom = require('./util.js').inheritsFrom;
var initMiddleware = require('./util.js').initMiddleware;
var initWorkspace = require('./util.js').initWorkspace;
var Link = require('./graph.js').Link;

module.exports.Model = Model;
module.exports.ModelConfig = ModelConfig;
module.exports.ModelProperty = ModelProperty;
module.exports.ModelMethod = ModelMethod;
module.exports.ModelRelation = ModelRelation;

function ModelConfig(wkspace, id, modelDef, options) {
  Node.call(this, wkspace, "ModelConfig", id, {dataSource: modelDef.dataSource, public: true});
  this.options = options;
}

function ModelProperty (wkspace, modelId, name, data) {
  var id = modelId + "." + name;
  Node.call(this, wkspace, "ModelProperty", id, data);
  this.model = wkspace.getNode("ModelDefinition", modelId);
}

function ModelMethod (wkspace, modelId, name, data) {
  var id = modelId + "." + name;
  Node.call(this, wkspace, "ModelMethod", id, data);
  this.model = wkspace.getNode("ModelDefinition", modelId);
}

function ModelRelation (wkspace, modelId, relationName, fromModel, toModel) { 
  var id = modelId + "." + relationName;
  Link.call(this, id, "ModelRelation", fromModel, toModel);  
}

function Model(Workspace, id, modelDef, options) {
  Node.call(this, Workspace, "ModelDefinition", id, this);
  this.properties = {};
  this.methods = {};
  this.relations = {};
  this.options = options;
}

inheritsFrom(ModelConfig, Node);
inheritsFrom(ModelProperty, Node);
inheritsFrom(ModelMethod, Node);
inheritsFrom(ModelRelation, Link);
inheritsFrom(Model, Node);