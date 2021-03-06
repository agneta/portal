/*   Copyright 2017 Agneta Network Applications, LLC.
 *
 *   Source file: portal/website/source/media/directory.module.js
 *
 *   Licensed under the Apache License, Version 2.0 (the "License");
 *   you may not use this file except in compliance with the License.
 *   You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 *   Unless required by applicable law or agreed to in writing, software
 *   distributed under the License is distributed on an "AS IS" BASIS,
 *   WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 *   See the License for the specific language governing permissions and
 *   limitations under the License.
 */

module.exports = function(options) {
  var vm = options.vm;
  var Portal = options.Portal;
  var $location = options.$location;
  var $rootScope = options.$rootScope;
  var config = options.config;
  var $mdDialog = options.$mdDialog;

  var socket = Portal.socket.media;
  var objects = [];
  var lastResult = null;
  var loadmoreCount = 20;

  function readdir() {
    var dir = vm.dir;

    if (!vm.locationDisabled) {
      if (dir.location.length) {
        $location.search('location', dir.location);
      } else {
        $location.search('location', null);
      }
    }

    objects = [];
    lastResult = null;
    vm.objectsOnDemand.numLoaded_ = 0;
    vm.objectsOnDemand.toLoad_ = 0;
    vm.objectsOnDemand.fetchMoreItems_(1);
  }

  vm.refresh = readdir;

  socket.on('file:upload:complete', readdir);
  socket.on('files:upload:complete', readdir);

  vm.onHover = function(object) {
    objects.map(function(obj) {
      obj.hovered = false;
    });
    object.hovered = true;
  };

  //---------------------------------------------------

  vm.objectsOnDemand = {
    numLoaded_: 0,
    toLoad_: 0,
    getItemAtIndex: function(index) {
      if (index > this.numLoaded_) {
        this.fetchMoreItems_(index);
        return null;
      }
      return objects[index];
    },
    getLength: function() {
      return this.numLoaded_ + 1;
    },
    fetchMoreItems_: function(index) {
      var self = this;
      var marker = null;

      if (lastResult) {
        if (lastResult.truncated) {
          marker = lastResult.nextMarker;
        } else {
          return;
        }
      }

      if (!this.toLoad_) {
        this.toLoad_ = 1;
        return;
      }

      if (this.toLoad_ - this.numLoaded_ > loadmoreCount) {
        return;
      }

      if (this.toLoad_ < index) {
        this.toLoad_ += loadmoreCount;

        $rootScope.loadingMain = true;

        var params = {};

        if (vm.dir.location) {
          params.dir = vm.dir.location;
        }
        if (marker) {
          params.marker = marker;
        }

        console.warn('fetchMoreItems_', index, this.numLoaded_, this.toLoad_);
        var loader = 'loading';
        if (objects.length) {
          loader = 'isLoadingMore';
        }
        vm[loader] = true;
        config.model
          .list(params)
          .$promise.then(function(result) {
            lastResult = result;

            for (var _index in result.objects) {
              var object = result.objects[_index];
              object.onChange = function() {
                vm.refresh();
              };
              if (config.preview) {
                config.preview.set(object);
              }
            }

            $rootScope.loadingMain = false;
            vm.count = result.count;
            objects = objects.concat(result.objects);

            if (vm.onObjects) {
              vm.onObjects(objects);
            }

            self.numLoaded_ = objects.length;
          })
          .finally(function() {
            vm[loader] = false;
          });
      }
    }
  };

  //---------------------------------------------------
  // Selected

  var selectedObjects = [];

  vm.selection = {
    count: function() {
      return selectedObjects.length;
    },
    add: function(object) {
      selectedObjects.push(object);
      object.selected = false;
    },
    removeAll: function() {
      for (var key in selectedObjects) {
        var selectedObject = selectedObjects[key];
        selectedObject.selected = false;
      }
    }
  };

  //---------------------------------------------------

  vm.newFolder = function() {
    $mdDialog.open({
      nested: true,
      partial: 'new-folder',
      data: {
        onApply: function(name) {
          return config.model
            .newFolder({
              dir: vm.dir.location,
              name: name
            })
            .$promise.then(readdir);
        }
      }
    });
  };

  vm.objectClick = function(object) {
    switch (object.type) {
      case 'folder':
        vm.openFolder(object);
        break;
      default:
        vm.openObject(object);
        break;
    }
  };

  // Helps to use toolbar without propagating to another function
  // For example: to prevent folder from opening
  vm.toolbarClick = function($event) {
    $event.stopPropagation();
  };

  vm.isFolder = function(object) {
    return object.type == 'folder';
  };

  vm.contextMenu = function(object) {
    console.log('menu', object);
  };

  vm.openObject =
    vm.openObject ||
    function(object) {
      $mdDialog.open({
        partial: config.partial,
        data: {
          apiMedia: config.api,
          Media: config.model,
          MediaPreview: config.preview,
          location: object.location,
          onChange: function() {
            vm.refresh();
          }
        }
      });
    };
};
