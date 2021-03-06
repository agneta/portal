/*   Copyright 2017 Agneta Network Applications, LLC.
 *
 *   Source file: portal/website/utilities/generate/dep-extract.js
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
const glob = require('glob');
const path = require('path');
const _ = require('lodash');
const fs = require('fs-extra');
const Promise = require('bluebird');
const yaml = require('js-yaml');
const bower = require('./bower');

module.exports = function(util, dir) {
  const destDir = path.join(dir.base, 'source', 'lib');

  if (!fs.pathExistsSync(path.join(dir.root, 'bower.json'))) {
    util.log('No Bower Compoments found at ' + dir.name + ' dir.');
    return;
  }

  //-----------------------------------------------------------------

  var ignoreDefault = ['src/**'];

  var libs = [];
  var totalFiles = 0;

  dir.modules = path.join(dir.root, 'bower_components');

  util.log();
  util.log('-----------------------------------');
  util.log('Searching for Libraries at ' + dir.name + ' dir...');

  var rules = {};

  return Promise.resolve()
    .then(function() {
      return fs.ensureDir(dir.modules);
    })
    .then(function() {
      return bower(util, dir.root);
    })
    .then(function() {
      return fs.readFile(path.join(dir.base, 'config.yml'), 'utf8');
    })
    .then(function(content) {
      var config = yaml.safeLoad(content);
      rules = config.libraries || {};

      return fs.readdir(dir.modules);
    })
    .then(function(libraries) {
      return Promise.map(libraries, function(library) {
        var rule = rules[library] || {};
        var searchDir = path.join(dir.modules, library);

        rule.include = _.isArray(rule.include) ? rule.include : [rule.include];
        rule.include = rule.include.concat('*.map');

        if (!fs.pathExistsSync(searchDir)) {
          throw new Error('Module does not exist: ' + library);
        }

        if (!fs.statSync(searchDir).isDirectory()) {
          return;
        }

        var ignore;
        rule.ignore = rule.ignore || [];

        if (rule.ignoreDefaults) {
          ignore = [].concat(rule.ignore);
        } else {
          ignore = ignoreDefault.concat(rule.ignore);
        }

        var moduleFiles = [];

        return Promise.map(rule.include, function(include) {
          return Promise.promisify(glob)(include || '*.min.{js,css}', {
            cwd: searchDir,
            ignore: ignore,
            nodir: false,
            nosort: true,
            matchBase: true,
            stat: false
          }).then(function(result) {
            moduleFiles = moduleFiles.concat(result);
          });
        }).then(function() {
          moduleFiles = _.uniq(moduleFiles);

          if (!moduleFiles.length) {
            util.log('No files found for library: ' + library);
            return;
          }
          util.log(`Found ${moduleFiles.length} files for library: ${library}`);

          totalFiles += moduleFiles.length;

          libs.push({
            dir: searchDir,
            files: moduleFiles
          });
        });
      });
    })
    .then(function() {
      var bar = util.progress(totalFiles, {
        title: 'Dependencies for ' + dir.name
      });

      var copyDict = {};
      function copy(source, target) {
        return Promise.resolve().then(function() {
          if (copyDict[target]) {
            return;
          }
          copyDict[target] = true;
          return fs.copy(source, target);
        });
      }

      return Promise.map(
        libs,
        function(lib) {
          var parsedDir = path.parse(lib.dir);
          var rule = rules[parsedDir.name] || {};

          return Promise.map(
            lib.files,
            function(file) {
              var parsed = path.parse(file);

              var sourcePath = path.join(lib.dir, file);
              var destPath = path.join(destDir, rule.dir || '', parsed.base);
              return copy(sourcePath, destPath)
                .then(function() {
                  var parsedPath = path.parse(sourcePath);
                  var parsed = path.parse(parsedPath.name);
                  var pathCheck =
                    path.join(parsedPath.dir, parsed.name) + parsedPath.ext;
                  if (parsed.ext == '.min') {
                    return fs.pathExists(pathCheck).then(function(exists) {
                      if (exists) {
                        var parsed = path.parse(pathCheck);
                        var pathCheckOut = path.join(
                          destDir,
                          rule.dir || '',
                          parsed.base
                        );
                        return copy(pathCheck, pathCheckOut);
                      }
                    });
                  }
                })
                .then(function() {
                  bar.tick({
                    title: path.join(rule.dir || '', parsed.base)
                  });
                });
            },
            {
              concurrency: 3
            }
          );
        },
        {
          concurrency: 1
        }
      );
    })
    .then(function() {
      if (totalFiles) {
        util.log('Success: ' + totalFiles + ' files were transfered');
      } else {
        util.log('No Libraries were found');
      }
      util.log('-----------------------------------');
      util.log();
    });
};
