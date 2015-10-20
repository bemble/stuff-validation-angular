/// <reference path="../typings/node/node.d.ts" />
/// <reference path="../typings/angularjs/angular.d.ts" />
/// <reference path="../node_modules/data-validation/dist/data-validation.d.ts" />

function validationService($rootScope:ng.IRootScopeService):ng.IServiceProvider {
  'ngInject';

  var dataValidation:dataValidation.DataValidationModule = require("data-validation");

  class ValidationService extends dataValidation.Validator {
    addRule(ruleName:string, rule:dataValidation.Rule) {
      dataValidation.RulesCollection.addRule(ruleName, rule);
    }

    getValidateAllEventName():string {
      return 'data-validation-validate-all';
    }

    getValidateGroupEventName(groupName:string):string {
      return 'data-validation-validate-group-' + groupName;
    }

    getValidatedModelEventName(objectUniqId:string, propertyName:string):string {
      return 'data-validation-validated-model-' + objectUniqId + '-' + propertyName;
    }

    validateGroup(groupName:string) {
      var eventName = this.getValidateGroupEventName(groupName);
      $rootScope.$broadcast(eventName);
    }

    validateAll() {
      var eventName = this.getValidateAllEventName();
      $rootScope.$broadcast(eventName);
    }

    uniqId() {
      return Math.random().toString(36).substring(7) + Date.now();
    }
  }

  return <any> new ValidationService();
}

(() => {
  var module:ng.IModule = angular.module('dataValidation');
  module.service('validationService', validationService);
})();
