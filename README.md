# data-validation-angular

Angular module to easily validate data.

## How it works?

First thing, it's based on the node module [data-validation](https://github.com/pierrecle/data-validation).

## Install

* Lazy method : copy/paste what you want from `dist` folder
* Not-expected-method: `npm install data-validation-angular`
* Front-end method: `bower install data-validation-angular`

## Examples of usage

```html
<html>
  <head>
    <meta charset="utf-8">
    <title>Test</title>
    <style>
      input {
        display: inline-block;
        transition: all 250ms ease-in;
      }
      input[validated-model] + span {
        display: inline-block;
        color: red;
        opacity: 0;
        transition: opacity 250ms ease-in;
      }
      input.ng-dirty.ng-valid {
        border: green;
        background-color: greenyellow;
      }
      input.ng-dirty.ng-invalid {
        border: red;
        background-color: orangered;
      }
      input[validated-model].ng-dirty.ng-invalid + span {
        opacity: 1;
      }
    </style>
  </head>
  <body>
    <div ng-app="testApp" ng-controller="controller as ctrl2">
      <button ng-click="ctrl2.validate()">Validate all</button>
      <button ng-click="ctrl2.validateGroup()">Validate group</button>
      <h2>Simple elements</h2>
      <label>Value 1:</label><input ng-model="ctrl2.vm.value1" validated-model><span>/!\ Error!</span>
      <label>Value 2:</label><input ng-model="ctrl2.vm.value2" validated-model><span>/!\ Error!</span>
      <h2>Array of objects</h2>
      <button ng-click="ctrl2.addElement()">Add element</button>
      <div ng-repeat="v in ctrl2.vm.valueArray">
          <input ng-model="v.lol" validated-model><span>/!\ Error!</span>
      </div>
      <pre>{{ctrl.vm | json}}</pre>
    </div>

    <script src="../node_modules/angular/angular.js"></script>
    <script src="../build/data-validation.angular.min.js"></script>
    <script>
      (function() {
        var app = angular.module('testApp', ['dataValidation']);

        app.controller('controller', controller);

        function controller(validationService) {
          this.vm = {
            value1: null,
            value2: null,
            valueArray: [],
            validationGroups: {
                test: ['value2']
            },
            validationRules: {
                value1: ['required'],
                value2: ['required']
            }
          };

          this.addElement = function() {
            this.vm.valueArray.push({lol:null, validationRules: {lol: ['required']}});
          };

          this.validate = function() {
            validationService.validateAll();
          };

          this.validateGroup = function() {
            validationService.validateGroup('test');
          };
        };
      })();
    </script>
  </body>
</html>
```
