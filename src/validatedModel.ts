/// <reference path="../typings/angularjs/angular.d.ts" />

function validateModelDirective(validationService:any):ng.IDirective {
  'ngInject';

  var directiveLink:ng.IDirectiveLinkFn = (scope:angular.IScope, elm:any, attrs:any, ctrl:any) => {
    ctrl.$options = ctrl.$options || {};
    ctrl.$options.updateOn = ['blur'];

    var propertyName = attrs.ngModel.match(/.+\.(.+)$/)[1];
    var viewModelExpression = attrs.ngModel.replace(/(.+)\.(.+)$/, "$1");
    var validationRulesExpression:string = attrs.ngModel.replace(/(.+)\.(.+)$/, "$1.validationRules.$2");
    var validationGroupsExpression:string = attrs.ngModel.replace(/(.+)\.(.+)$/, "$1.validationGroups");
    var viewModel = scope.$eval(viewModelExpression);
    var validationRules:any = scope.$eval(validationRulesExpression);
    var validationGroups:any = scope.$eval(validationGroupsExpression) || {};

    if(!viewModel.$$validatedModelUniqId) {
      Object.defineProperty(viewModel, '$$validatedModelUniqId', {value: validationService.uniqId()});
    }

    ctrl.$validators.dataValidation = (modelValue:any, viewValue:any) => {
      return validationService.validateValue(modelValue, validationRules) === null;
    };

    var validate = () => {
      ctrl.$setDirty(true);
    };

    var allEventName = validationService.getValidateAllEventName();
    scope.$on(allEventName, validate);

    Object.keys(validationGroups).forEach((groupName:string) => {
      if (validationGroups[groupName].indexOf(propertyName) >= 0) {
        var groupEventName = validationService.getValidateGroupEventName(groupName);
        scope.$on(groupEventName, validate);
      }
    });
  };

  return <ng.IDirective> {
    require: 'ngModel',
    restrict: 'A',
    link: directiveLink
  };
}

(() => {
  var module:ng.IModule = angular.module('dataValidation');
  module.directive('validatedModel', validateModelDirective);
})();
