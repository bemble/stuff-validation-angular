/// <reference path="../typings/angularjs/angular.d.ts" />
/// <reference path="angular.dataValidation.d.ts" />

function validateModelDirective(validationService:angularDataValidation.IValidationService):ng.IDirective {
  'ngInject';

  var directiveLink:ng.IDirectiveLinkFn = (scope:angular.IScope, elm:any, attrs:any, ctrl:any) => {
    ctrl.$options = ctrl.$options || {};
    ctrl.$options.updateOn = ['blur'];

    var propertyName:string = attrs.ngModel.match(/.+\.(.+)$/)[1];
    var viewModel:any = getViewModel(attrs, scope);
    var validationConfiguration:angularDataValidation.IValidationConfiguration = getValidationConfiguration(attrs, scope);

    var rules:(dataValidation.ValidationRule | dataValidation.Rule | string)[] = validationConfiguration && validationConfiguration.rules && validationConfiguration.rules[propertyName];
    if (rules) {
      if (!viewModel.$$validatedModelUniqId) {
        Object.defineProperty(viewModel, '$$validatedModelUniqId', {value: validationService.uniqId()});
      }

      var validatedModelPropertyEventName:string = validationService.getValidatedModelPropertyEventName(viewModel.$$validatedModelUniqId, propertyName);
      var hasDependentProperties:boolean = false;
      if (validationConfiguration.dependencies) {
        var dependenciesKeys:string[] = Object.keys(validationConfiguration.dependencies);
        for (var i = 0; i < dependenciesKeys.length && !hasDependentProperties; i++) {
          var dependentRuleName:string = dependenciesKeys[i];
          hasDependentProperties = validationConfiguration.dependencies[dependentRuleName].indexOf(propertyName) >= 0;
        }
      }
      ctrl.$validators.dataValidation = (modelValue:any, viewValue:any) => {
        var isValid = validationService.validateValue(modelValue, rules) === null;
        // TODO: find good use case of dependencies to see if the event should not be emitted only when the current property is valid
        hasDependentProperties && scope.$emit(validatedModelPropertyEventName);
        return isValid;
      };

      var validate:any = () => {
        ctrl.$validate();
      };

      var allEventName = validationService.getValidateAllEventName();
      scope.$on(allEventName, validate);

      // Groups
      if(validationConfiguration.groups) {
        Object.keys(validationConfiguration.groups).forEach((groupName:string) => {
          if (validationConfiguration.groups[groupName].indexOf(propertyName) >= 0) {
            var groupEventName = validationService.getValidateGroupEventName(groupName);
            scope.$on(groupEventName, validate);
          }
        });
      }

      // Dependencies
      if(validationConfiguration.dependencies && validationConfiguration.dependencies[propertyName]) {
        validationConfiguration.dependencies[propertyName].forEach((dependingPropertyName:string) => {
          var dependingPropertyValidatedEventName:string = validationService.getValidatedModelPropertyEventName(viewModel.$$validatedModelUniqId, dependingPropertyName);
          scope.$on(dependingPropertyValidatedEventName, validate);
        });
      }
    }
  };

  function getViewModel(attrs:any, scope:angular.IScope):any {
    var viewModelExpression = attrs.ngModel.replace(/(.+)\.(.+)$/, '$1');
    return scope.$eval(viewModelExpression);
  };

  function getValidationConfiguration(attrs:any, scope:angular.IScope):angularDataValidation.IValidationConfiguration {
    var validationConfigurationExpression:string = attrs.ngModel.replace(/(.+)\.(.+)$/, '$1.validationConfiguration');
    return scope.$eval(validationConfigurationExpression);
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
