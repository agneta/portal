/*   Copyright 2017 Agneta Network Applications, LLC.
 *
 *   Source file: portal/website/source/dialog/page-source.js
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

/*global CodeMirror*/
/*global jsyaml*/

(function() {
  agneta.directive('AgEditorCode', function($timeout) {
    var myCodeMirror;
    var vm = this;

    setTimeout(function() {
      var editorElm = document.querySelector('#source-editor');
      //console.log(editorElm);

      myCodeMirror = CodeMirror.fromTextArea(editorElm, {
        lineNumbers: true,
        mode: 'text/x-yaml',
        theme: 'monokai',
        gutters: ['CodeMirror-lint-markers'],
        lint: true
      });

      var changing = false;
      myCodeMirror.on('changes', function() {
        if (changing) {
          return;
        }
        changing = true;
        $timeout(function() {
          onDone(myCodeMirror.getValue());
          changing = false;
        }, 1400);
      });

      loadData();
    }, 100);

    function loadData() {
      if (!myCodeMirror) {
        return;
      }
      myCodeMirror.setValue(getData());
      $timeout(function() {
        myCodeMirror.refresh();
      }, 100);
    }

    function onDone(newVal) {
      if (!vm.page) {
        return;
      }
      var data;
      try {
        data = jsyaml.safeLoad(newVal, {
          schema: jsyaml.DEFAULT_SAFE_SCHEMA
        });
      } catch (e) {
        return;
      }
      vm.page.data = null;

      $timeout(function() {
        vm.page.data = data;
      }, 100);
    }
    function getData() {
      vm.clearHiddenData();
      return jsyaml.dump(vm.page.data, {
        skipInvalid: true,
        schema: jsyaml.DEFAULT_SAFE_SCHEMA
      });
    }
  });
})();
