/// <reference path="../typings/tsd.d.ts" />
/// <reference path="../src/angular.dataValidation.d.ts" />

describe('ValidatedModel', () => {
  var $compile:ng.ICompileService, $rootScope:ng.IRootScopeService, $scope:any, element:any, ngModelController:any;
  var validationService:any;

  function initDirective() {
    element = angular.element('<input name="test" ng-model="vm.test" validated-model>');
    $compile(element)($scope);
    ngModelController = element.controller('ngModel');
  }

  beforeEach(angular.mock.module('dataValidation'));

  beforeEach(angular.mock.inject(($injector:angular.auto.IInjectorService) => {
    $rootScope = <ng.IRootScopeService> $injector.get('$rootScope');
    $compile = <ng.ICompileService> $injector.get('$compile');
    validationService = $injector.get('validationService');
  }));

  beforeEach(angular.mock.inject(($injector:angular.auto.IInjectorService) => {
    $scope = $rootScope.$new();

    var validationConfiguration:angularDataValidation.IValidationConfiguration = {
      rules: {
        test: ['required'],
        test2: ['required'],
        test3: ['required'],
        test4: ['required']
      },
      groups: {
        'fooGroup': ['test'],
        'fooGroup2': ['test']
      },
      dependencies: {
        test2: ['test3'],
        test3: ['test', 'test2']
      }
    };
    $scope.vm = {
      test: null,
      test2: null,
      test3: null,
      test4: null,
      validationConfiguration: validationConfiguration
    };

    spyOn(validationService, 'uniqId').and.callThrough();
    spyOn(validationService, 'validateValue').and.callThrough();
    spyOn(validationService, 'getValidateAllEventName').and.callThrough();
    spyOn($scope, '$on').and.callThrough();

    initDirective();
  }));

  it('set the updateOn option to blur', () => {
    expect(ngModelController.$options).toBeDefined();
    expect(ngModelController.$options.updateOn).toEqual(['blur']);
  });

  it('adds a validator name dataValidation', () => {
    expect(ngModelController.$validators.dataValidation).toBeDefined();
  });

  it('calls validationService.validateValue with the model value and the found the validation rules', () => {
    ngModelController.$validators.dataValidation('foo', 'bar');
    expect(validationService.validateValue).toHaveBeenCalledWith('foo', ['definedAndNotNan', 'required']);
  });

  it('calls the validation when model value change', () => {
    $scope.$digest();
    $scope.vm.test = 123;
    $scope.$digest();
    expect(validationService.validateValue.calls.count()).toEqual(2);
  });

  it('works with standard validation', () => {
    $scope.$digest();
    $scope.vm.test = null;
    $scope.$digest();
    expect(ngModelController.$invalid).toBe(true);
    $scope.vm.test = 123;
    $scope.$digest();
    expect(ngModelController.$valid).toBe(true);
  });

  describe('events binding', () => {
    it('listen on validationService.getValidateAllEventName and validationService.getValidateGroupEventName to validate all and groups', () => {
      expect(validationService.getValidateAllEventName).toHaveBeenCalled();
      expect($scope.$on.calls.argsFor(1)[0]).toEqual('data-validation-validate-all');
      expect($scope.$on.calls.argsFor(2)[0]).toEqual('data-validation-validate-group-fooGroup');
      expect($scope.$on.calls.argsFor(3)[0]).toEqual('data-validation-validate-group-fooGroup2');
    });

    it('validate the model when validateAll event is broadcasted', () => {
      spyOn(ngModelController, '$validate');
      $rootScope.$broadcast('data-validation-validate-all');
      $scope.$digest();
      expect(ngModelController.$validate).toHaveBeenCalled();
    });
    it('validate the model when a validate group event of a group that contains the model is broadcasted', () => {
      spyOn(ngModelController, '$validate');
      $rootScope.$broadcast('data-validation-validate-group-fooGroup');
      $scope.$digest();
      expect(ngModelController.$validate).toHaveBeenCalled();
    });

    it('does not validate the model when a random event is broadcasted', () => {
      spyOn(ngModelController, '$validate');
      $rootScope.$broadcast('not-listened');
      $scope.$digest();
      expect(ngModelController.$validate).not.toHaveBeenCalled();
    });
  });

  describe('validationDependencies', () => {
    it('add a $$validatedModelUniqId property to the model', () => {
      expect(validationService.uniqId).toHaveBeenCalled();
      var computedId = validationService.uniqId.calls.mostRecent().returnValue;
      expect($scope.vm.$$validatedModelUniqId).toEqual(computedId);
    });

    describe('$$validatedModelUniqId already set', () => {
      beforeEach(angular.mock.inject(($injector:angular.auto.IInjectorService) => {
        $scope = $rootScope.$new();
        $scope.vm = { test: null };
        Object.defineProperty($scope.vm, '$$validatedModelUniqId', {value:'foo'});

        initDirective();
      }));

      it('does not set $$validatedModelUniqId property', () => {
        expect($scope.vm.$$validatedModelUniqId).toEqual('foo');
      });
    });
  });
});
