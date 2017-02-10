'use strict';
const app = require('../../../../');
const expect = require('../../../helpers/expect');
const fs = require('fs-extra');
const loopback = require('loopback');
const ModelClass = require('../../../../component/datamodel/model');
const path = require('path');
const testSupport = require('../../../helpers/test-support');
const util = require('util');
const workspaceManager = require('../../../../component/workspace-manager');
const TYPE_OF_TEST = 'acceptance';

const ModelDefinition = app.models.ModelDefinition;
const ModelMethod = app.models.ModelMethod;
const ModelProperty = app.models.ModelProperty;
const ModelRelation = app.models.ModelRelation;

app.on('booted', function() {
  app.emit('ready');
});

module.exports = function() {
  const testsuite = this;
  this.Given(/^that I have loaded the workspace '(.+)'$/,
  function(templateName, next) {
    testsuite.workspaceDir =
      testSupport.givenSandboxDir(TYPE_OF_TEST, templateName);
    testsuite.workspace =
      workspaceManager.getWorkspaceByFolder(testsuite.workspaceDir);
    testsuite.workspaceId = testsuite.workspace.getId();
    next();
  });

  this.When(/^I create model '(.+)'$/, function(modelName, next) {
    testsuite.modelId = 'common.models.' + modelName;
    const model = {
      id: testsuite.modelId,
      facetName: 'common',
      name: modelName,
      readonly: true,
      strict: true,
      public: true,
      idInjection: true,
    };
    const options = {workspaceId: testsuite.workspaceId};
    testsuite.modelName = modelName;
    ModelDefinition.create(model, options, function(err, data) {
      if (err) return next(err);
      testsuite.expectedModel = model;
      testsuite.expectedModel.properties = {};
      testsuite.expectedModel.methods = {};
      testsuite.expectedModel.relations = {};
      next();
    });
  });

  this.Then(/^the model definition is created$/, function(next) {
    const storedModel = testsuite.workspace.getModel(testsuite.modelId);
    const file = storedModel.getFilePath();
    fs.readJson(file, function(err, data) {
      if (err) return next(err);
      expect(testsuite.expectedModel).to.eql(data);
      next();
    });
  });

  this.Given(/^the model '(.+)' exists in workspace '(.+)'$/,
  function(modelName, workspaceName, next) {
    testsuite.modelId = 'common.models.' + modelName;
    const dir = testSupport.givenSandboxDir(TYPE_OF_TEST, workspaceName);
    testsuite.workspace = workspaceManager.getWorkspaceByFolder(dir);
    testsuite.workspaceId = testsuite.workspace.getId();
    const storedModel = testsuite.workspace.getModel(testsuite.modelId);
    expect(storedModel).to.not.to.be.undefined();
    expect(storedModel).to.be.an.instanceOf(ModelClass);
    next();
  });

  this.When(/^I add property '(.+)' of type '(.+)'$/,
    function(propertyName, type, next) {
      testsuite.propertyId = propertyName;
      const propertyDef = {
        modelId: testsuite.modelId,
        name: propertyName,
        type: type,
      };
      const options = {workspaceId: testsuite.workspaceId};
      ModelProperty.create(propertyDef, options, function(err, data) {
        if (err) return next(err);
        testsuite.expectedProperty = propertyDef;
        next();
      });
    });

  this.Then(/^the model property is created$/, function(next) {
    const model = testsuite.workspace.getModel(testsuite.modelId);
    const file = model.getFilePath();
    fs.readJson(file, function(err, data) {
      if (err) return next(err);
      const property = data &&
        data.properties &&
        data.properties[testsuite.expectedProperty.name];
      expect(property).to.not.to.be.undefined();
      expect(testsuite.expectedProperty).to.eql(property);
      next();
    });
  });

  this.Given(/^I add relation '(.+)' from '(.+)' to '(.+)'$/,
  function(relationName, fromModelName, toModelName, next) {
    testsuite.fromModelName = fromModelName;
    testsuite.toModelName = toModelName;
    testsuite.relationName = relationName;
    next();
  });

  this.When(/^the relation is of type '(.+)' and foreignKey '(.+)'$/,
    function(relationType, foreignKey, next) {
      const relationDef = {
        id: testsuite.relationName,
        type: relationType,
        foreignKey: foreignKey,
        modelId: testsuite.fromModelName,
        model: testsuite.toModelName,
        facetName: 'common.models',
      };
      const options = {workspaceId: testsuite.workspaceId};
      testsuite.expectedRelation = relationDef;
      ModelRelation.create(relationDef, options, function(err) {
        if (err) return next(err);
        next();
      });
    });

  this.Then(/^the model relation is created$/, function(next) {
    const relationDef = testsuite.expectedRelation;
    const facetName = relationDef.facetName;
    const fromModelName = relationDef.modelId;
    delete relationDef.id;
    delete relationDef.facetName;
    delete relationDef.modelId;
    const model =
      testsuite.workspace.getModel(facetName + '.' + fromModelName);
    const file = model.getFilePath();
    fs.readJson(file, function(err, data) {
      if (err) return next(err);
      const relation = data &&
        data.relations &&
        data.relations[testsuite.relationName];
      expect(relation).to.not.to.be.undefined();
      expect(testsuite.expectedRelation).to.eql(relation);
      next();
    });
  });

  this.Given(/^I add model method '(.+)' in workspace '(.+)'$/,
  function(methodName, workspaceName, next) {
    testsuite.methodName = methodName;
    testsuite.modelMethod = {accepts: [], returns: []};
    next();
  });

  this.When(/^the method has an argument '(.+)' type '(.+)'$/,
    function(name, type, next) {
      const argument = {arg: name, type: type};
      testsuite.modelMethod.accepts.push(argument);
      next();
    });

  this.When(/^the method has a return parameter '(.+)' type '(.+)'$/,
    function(name, type, next) {
      const param = {arg: name, type: type};
      testsuite.modelMethod.returns.push(param);
      next();
    });

  this.When(/^I call the model method api$/,
    function(next) {
      testsuite.modelMethod.name = testsuite.methodName;
      testsuite.modelMethod.modelId = testsuite.modelId;
      const options = {workspaceId: testsuite.workspaceId};
      ModelMethod.create(testsuite.modelMethod, options, function(err) {
        if (err) return next(err);
        next();
      });
    });

  this.Then(/^the model method is created$/, function(next) {
    const model = testsuite.workspace.getModel(testsuite.modelId);
    const file = model.getFilePath();
    fs.readJson(file, function(err, data) {
      if (err) return next(err);
      const method = data &&
        data.methods &&
        data.methods[testsuite.methodName];
      expect(method).to.not.to.be.undefined();
      expect(testsuite.modelMethod).to.eql(method);
      next();
    });
  });
};
