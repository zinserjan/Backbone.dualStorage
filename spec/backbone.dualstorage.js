// Generated by CoffeeScript 1.7.1

/*
Backbone dualStorage Adapter v1.3.1

A simple module to replace `Backbone.sync` with *localStorage*-based
persistence. Models are given GUIDS, and saved into a JSON object. Simple
as that.
 */
var S4, backboneSync, callbackTranslator, dualsync, getStoreName, localsync, modelUpdatedWithResponse, onlineSync, parseRemoteResponse,
  __indexOf = [].indexOf || function(item) { for (var i = 0, l = this.length; i < l; i++) { if (i in this && this[i] === item) return i; } return -1; };

Backbone.DualStorage = {
  offlineStatusCodes: [408, 502]
};

Backbone.Model.prototype.hasTempId = function() {
  return _.isString(this.id) && this.id.length === 36;
};

getStoreName = function(collection, model) {
  model || (model = collection.model.prototype);
  return _.result(collection, 'storeName') || _.result(model, 'storeName') || _.result(collection, 'url') || _.result(model, 'urlRoot') || _.result(model, 'url');
};

Backbone.Collection.prototype.syncDirty = function() {
  var id, ids, store, _i, _len, _ref, _results;
  store = localStorage.getItem("" + (getStoreName(this)) + "_dirty");
  ids = (store && store.split(',')) || [];
  _results = [];
  for (_i = 0, _len = ids.length; _i < _len; _i++) {
    id = ids[_i];
    _results.push((_ref = this.get(id)) != null ? _ref.save() : void 0);
  }
  return _results;
};

Backbone.Collection.prototype.dirtyModels = function() {
  var id, ids, models, store;
  store = localStorage.getItem("" + (getStoreName(this)) + "_dirty");
  ids = (store && store.split(',')) || [];
  models = (function() {
    var _i, _len, _results;
    _results = [];
    for (_i = 0, _len = ids.length; _i < _len; _i++) {
      id = ids[_i];
      _results.push(this.get(id));
    }
    return _results;
  }).call(this);
  return _.compact(models);
};

Backbone.Collection.prototype.syncDestroyed = function() {
  var id, ids, model, store, _i, _len, _results;
  store = localStorage.getItem("" + (getStoreName(this)) + "_destroyed");
  ids = (store && store.split(',')) || [];
  _results = [];
  for (_i = 0, _len = ids.length; _i < _len; _i++) {
    id = ids[_i];
    model = new this.model;
    model.set(model.idAttribute, id);
    model.collection = this;
    _results.push(model.destroy());
  }
  return _results;
};

Backbone.Collection.prototype.destroyedModelIds = function() {
  var ids, store;
  store = localStorage.getItem("" + (getStoreName(this)) + "_destroyed");
  return ids = (store && store.split(',')) || [];
};

Backbone.Collection.prototype.syncDirtyAndDestroyed = function() {
  this.syncDirty();
  return this.syncDestroyed();
};

S4 = function() {
  return (((1 + Math.random()) * 0x10000) | 0).toString(16).substring(1);
};

window.Store = (function() {
  Store.prototype.sep = '';

  function Store(name) {
    this.name = name;
    this.records = this.recordsOn(this.name);
  }

  Store.prototype.generateId = function() {
    return S4() + S4() + '-' + S4() + '-' + S4() + '-' + S4() + '-' + S4() + S4() + S4();
  };

  Store.prototype.save = function() {
    return localStorage.setItem(this.name, this.records.join(','));
  };

  Store.prototype.recordsOn = function(key) {
    var store;
    store = localStorage.getItem(key);
    return (store && store.split(',')) || [];
  };

  Store.prototype.dirty = function(model) {
    var dirtyRecords;
    dirtyRecords = this.recordsOn(this.name + '_dirty');
    if (!_.include(dirtyRecords, model.id.toString())) {
      dirtyRecords.push(model.id);
      localStorage.setItem(this.name + '_dirty', dirtyRecords.join(','));
    }
    return model;
  };

  Store.prototype.clean = function(model, from) {
    var dirtyRecords, store;
    store = "" + this.name + "_" + from;
    dirtyRecords = this.recordsOn(store);
    if (_.include(dirtyRecords, model.id.toString())) {
      localStorage.setItem(store, _.without(dirtyRecords, model.id.toString()).join(','));
    }
    return model;
  };

  Store.prototype.destroyed = function(model) {
    var destroyedRecords;
    destroyedRecords = this.recordsOn(this.name + '_destroyed');
    if (!_.include(destroyedRecords, model.id.toString())) {
      destroyedRecords.push(model.id);
      localStorage.setItem(this.name + '_destroyed', destroyedRecords.join(','));
    }
    return model;
  };

  Store.prototype.create = function(model) {
    if (!_.isObject(model)) {
      return model;
    }
    if (!model.id) {
      model.set(model.idAttribute, this.generateId());
    }
    localStorage.setItem(this.name + this.sep + model.id, JSON.stringify(model));
    this.records.push(model.id.toString());
    this.save();
    return model;
  };

  Store.prototype.update = function(model) {
    localStorage.setItem(this.name + this.sep + model.id, JSON.stringify(model));
    if (!_.include(this.records, model.id.toString())) {
      this.records.push(model.id.toString());
    }
    this.save();
    return model;
  };

  Store.prototype.clear = function() {
    var id, _i, _len, _ref;
    _ref = this.records;
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
      id = _ref[_i];
      localStorage.removeItem(this.name + this.sep + id);
    }
    this.records = [];
    return this.save();
  };

  Store.prototype.hasDirtyOrDestroyed = function() {
    return !_.isEmpty(localStorage.getItem(this.name + '_dirty')) || !_.isEmpty(localStorage.getItem(this.name + '_destroyed'));
  };

  Store.prototype.find = function(model) {
    var modelAsJson;
    modelAsJson = localStorage.getItem(this.name + this.sep + model.id);
    if (modelAsJson === null) {
      return null;
    }
    return JSON.parse(modelAsJson);
  };

  Store.prototype.findAll = function() {
    var id, _i, _len, _ref, _results;
    _ref = this.records;
    _results = [];
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
      id = _ref[_i];
      _results.push(JSON.parse(localStorage.getItem(this.name + this.sep + id)));
    }
    return _results;
  };

  Store.prototype.destroy = function(model) {
    localStorage.removeItem(this.name + this.sep + model.id);
    this.records = _.reject(this.records, function(record_id) {
      return record_id === model.id.toString();
    });
    this.save();
    return model;
  };

  return Store;

})();

window.Store.exists = function(storeName) {
  return localStorage.getItem(storeName) !== null;
};

callbackTranslator = {
  needsTranslation: Backbone.VERSION === '0.9.10',
  forBackboneCaller: function(callback) {
    if (this.needsTranslation) {
      return function(model, resp, options) {
        return callback.call(null, resp);
      };
    } else {
      return callback;
    }
  },
  forDualstorageCaller: function(callback, model, options) {
    if (this.needsTranslation) {
      return function(resp) {
        return callback.call(null, model, resp, options);
      };
    } else {
      return callback;
    }
  }
};

localsync = function(method, model, options) {
  var isValidModel, preExisting, response, store;
  isValidModel = (method === 'clear') || (method === 'hasDirtyOrDestroyed');
  isValidModel || (isValidModel = model instanceof Backbone.Model);
  isValidModel || (isValidModel = model instanceof Backbone.Collection);
  if (!isValidModel) {
    throw new Error('model parameter is required to be a backbone model or collection.');
  }
  store = new Store(options.storeName);
  response = (function() {
    switch (method) {
      case 'read':
        if (model instanceof Backbone.Model) {
          return store.find(model);
        } else {
          return store.findAll();
        }
        break;
      case 'hasDirtyOrDestroyed':
        return store.hasDirtyOrDestroyed();
      case 'clear':
        return store.clear();
      case 'create':
        if (options.add && !options.merge && (preExisting = store.find(model))) {
          return preExisting;
        } else {
          model = store.create(model);
          if (options.dirty) {
            store.dirty(model);
          }
          return model;
        }
        break;
      case 'update':
        store.update(model);
        if (options.dirty) {
          return store.dirty(model);
        } else {
          return store.clean(model, 'dirty');
        }
        break;
      case 'delete':
        store.destroy(model);
        if (options.dirty) {
          return store.destroyed(model);
        } else {
          if (model.id.toString().length === 36) {
            return store.clean(model, 'dirty');
          } else {
            return store.clean(model, 'destroyed');
          }
        }
    }
  })();
  if (response != null ? response.attributes : void 0) {
    response = response.attributes;
  }
  if (!options.ignoreCallbacks) {
    if (response) {
      options.success(response);
    } else {
      options.error('Record not found');
    }
  }
  return response;
};

parseRemoteResponse = function(object, response) {
  if (!(object && object.parseBeforeLocalSave)) {
    return response;
  }
  if (_.isFunction(object.parseBeforeLocalSave)) {
    return object.parseBeforeLocalSave(response);
  }
};

modelUpdatedWithResponse = function(model, response) {
  var modelClone;
  modelClone = new Backbone.Model;
  modelClone.idAttribute = model.idAttribute;
  modelClone.set(model.attributes);
  modelClone.set(model.parse(response));
  return modelClone;
};

backboneSync = Backbone.sync;

onlineSync = function(method, model, options) {
  options.success = callbackTranslator.forBackboneCaller(options.success);
  options.error = callbackTranslator.forBackboneCaller(options.error);
  return backboneSync(method, model, options);
};

dualsync = function(method, model, options) {
  var error, local, relayErrorCallback, success, temporaryId;
  options.storeName = getStoreName(model.collection, model);
  options.storeExists = Store.exists(options.storeName);
  options.success = callbackTranslator.forDualstorageCaller(options.success, model, options);
  options.error = callbackTranslator.forDualstorageCaller(options.error, model, options);
  if (_.result(model, 'remote') || _.result(model.collection, 'remote')) {
    return onlineSync(method, model, options);
  }
  local = _.result(model, 'local') || _.result(model.collection, 'local');
  options.dirty = options.remote === false && !local;
  if (options.remote === false || local) {
    return localsync(method, model, options);
  }
  options.ignoreCallbacks = true;
  success = options.success;
  error = options.error;
  relayErrorCallback = function(response) {
    var offline, offlineStatusCodes, _ref;
    offlineStatusCodes = Backbone.DualStorage.offlineStatusCodes;
    if (_.isFunction(offlineStatusCodes)) {
      offlineStatusCodes = offlineStatusCodes(response);
    }
    offline = response.status === 0 || (_ref = response.status, __indexOf.call(offlineStatusCodes, _ref) >= 0);
    if (!offline || method === 'read' && !options.storeExists) {
      return error(response);
    } else {
      options.dirty = true;
      return success(localsync(method, model, options));
    }
  };
  switch (method) {
    case 'read':
      if (localsync('hasDirtyOrDestroyed', model, options)) {
        options.dirty = true;
        return success(localsync(method, model, options));
      } else {
        options.success = function(resp, status, xhr) {
          var collection, idAttribute, modelAttributes, responseModel, _i, _len;
          resp = parseRemoteResponse(model, resp);
          if (model instanceof Backbone.Collection) {
            collection = model;
            idAttribute = collection.model.prototype.idAttribute;
            if (!options.add) {
              localsync('clear', collection, options);
            }
            for (_i = 0, _len = resp.length; _i < _len; _i++) {
              modelAttributes = resp[_i];
              model = collection.get(modelAttributes[idAttribute]);
              if (model) {
                responseModel = modelUpdatedWithResponse(model, modelAttributes);
              } else {
                responseModel = new collection.model(modelAttributes);
              }
              localsync('update', responseModel, options);
            }
          } else {
            responseModel = modelUpdatedWithResponse(model, resp);
            localsync('update', responseModel, options);
          }
          return success(resp, status, xhr);
        };
        options.error = function(resp) {
          return relayErrorCallback(resp);
        };
        return onlineSync(method, model, options);
      }
      break;
    case 'create':
      options.success = function(resp, status, xhr) {
        var updatedModel;
        updatedModel = modelUpdatedWithResponse(model, resp);
        localsync(method, updatedModel, options);
        return success(resp, status, xhr);
      };
      options.error = function(resp) {
        return relayErrorCallback(resp);
      };
      return onlineSync(method, model, options);
    case 'update':
      if (model.hasTempId()) {
        temporaryId = model.id;
        options.success = function(resp, status, xhr) {
          var updatedModel;
          updatedModel = modelUpdatedWithResponse(model, resp);
          model.set(model.idAttribute, temporaryId, {
            silent: true
          });
          localsync('delete', model, options);
          localsync('create', updatedModel, options);
          return success(resp, status, xhr);
        };
        options.error = function(resp) {
          model.set(model.idAttribute, temporaryId, {
            silent: true
          });
          return relayErrorCallback(resp);
        };
        model.set(model.idAttribute, null, {
          silent: true
        });
        return onlineSync('create', model, options);
      } else {
        options.success = function(resp, status, xhr) {
          var updatedModel;
          updatedModel = modelUpdatedWithResponse(model, resp);
          localsync(method, updatedModel, options);
          return success(resp, status, xhr);
        };
        options.error = function(resp) {
          return relayErrorCallback(resp);
        };
        return onlineSync(method, model, options);
      }
      break;
    case 'delete':
      if (model.hasTempId()) {
        return localsync(method, model, options);
      } else {
        options.success = function(resp, status, xhr) {
          localsync(method, model, options);
          return success(resp, status, xhr);
        };
        options.error = function(resp) {
          return relayErrorCallback(resp);
        };
        return onlineSync(method, model, options);
      }
  }
};

Backbone.sync = dualsync;

//# sourceMappingURL=backbone.dualstorage.map
