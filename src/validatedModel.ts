/// <reference path="../typings/angularjs/angular.d.ts" />
/// <reference path="angular.dataValidation.d.ts" />

function validateModelDirective(validationService:angularDataValidation.IValidationService):ng.IDirective {
  'ngInject';

  var directiveLink:ng.IDirectiveLinkFn = (scope:angular.IScope, elm:any, attrs:any, ctrl:any) => {
    ctrl.$options = ctrl.$options || {};
    ctrl.$options.updateOn = ['blur'];

    var propertyName = attrs.ngModel.match(/.+\.(.+)$/)[1];
    var viewModelExpression = attrs.ngModel.replace(/(.+)\.(.+)$/, '$1');
    var validationConfigurationExpression:string = attrs.ngModel.replace(/(.+)\.(.+)$/, '$1.validationConfiguration');

    var viewModel = scope.$eval(viewModelExpression);
    var validationConfiguration:angularDataValidation.IValidationConfiguration = scope.$eval(validationConfigurationExpression);

    var rules:(dataValidation.ValidationRule | dataValidation.Rule | string)[] = validationConfiguration && validationConfiguration.rules && validationConfiguration.rules[propertyName];
    if (rules) {
      if (!viewModel.$$validatedModelUniqId) {
        Object.defineProperty(viewModel, '$$validatedModelUniqId', {value: validationService.uniqId()});
      }

      ctrl.$validators.dataValidation = (modelValue:any, viewValue:any) => {
        return validationService.validateValue(modelValue, rules) === null;
      };

      var validate = () => {
        ctrl.$validate();
      };

      var allEventName = validationService.getValidateAllEventName();
      scope.$on(allEventName, validate);

      if (validationConfiguration.groups) {
        Object.keys(validationConfiguration.groups).forEach((groupName:string) => {
          if (validationConfiguration.groups[groupName].indexOf(propertyName) >= 0) {
            var groupEventName = validationService.getValidateGroupEventName(groupName);
            scope.$on(groupEventName, validate);
          }
        });
      }
    }
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
