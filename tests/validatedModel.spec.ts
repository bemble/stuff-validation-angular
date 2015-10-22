/// <reference path="../typings/tsd.d.ts" />
/// <reference path="../src/angular.dataValidation.d.ts" />

describe('ValidatedModel', () => {
  var $compile:ng.ICompileService, $rootScope:ng.IRootScopeService, $scope:any, elements:ng.IAugmentedJQuery[] = [], ngModelControllers:any[] = [];
  var validationService:any;

  function initDirective() {
    for(var i = 1; i <= 4; i++){
      var element:ng.IAugmentedJQuery = angular.element('<input name="test" ng-model="vm.test'+i+'" validated-model>');
      elements.push(element);
      $compile(element)($scope);
      ngModelControllers.push(element.controller('ngModel'));
    }
  }

  beforeEach(angular.mock.module('dataValidation'));

  beforeEach(angular.mock.inject(($injector:angular.auto.IInjectorService) => {
    elements.length = 0;
    ngModelControllers.length = 0;
    $rootScope = <ng.IRootScopeService> $injector.get('$rootScope');
    $compile = <ng.ICompileService> $injector.get('$compile');
    validationService = <angularDataValidation.IValidationService> $injector.get('validationService');
  }));

  beforeEach(angular.mock.inject(($injector:angular.auto.IInjectorService) => {
    $scope = $rootScope.$new();

    var validationConfiguration:angularDataValidation.IValidationConfiguration = {
      rules: {
        test1: ['required'],
        test2: ['required'],
        test3: ['required'],
        test4: ['required']
      },
      groups: {
        'fooGroup': ['test1'],
        'fooGroup2': ['test1']
      },
      dependencies: {
        test2: ['test3'],
        test3: ['test1']
        // TODO: BUG with dependencies loop
        // test3: ['test1', 'test2']
      }
    };
    $scope.vm = {
      test1: null,
      test2: null,
      test3: null,
      test4: null,
      validationConfiguration: validationConfiguration
    };

    spyOn(validationService, 'uniqId').and.callThrough();
    spyOn(validationService, 'validateValue').and.callThrough();
    spyOn(validationService, 'getValidateAllEventName').and.callThrough();
    spyOn(validationService, 'getValidatedModelPropertyEventName').and.callThrough();
    spyOn($scope, '$on').and.callThrough();

    initDirective();
  }));

  it('set the updateOn option to blur', () => {
    expect(ngModelControllers[0].$options).toBeDefined();
    expect(ngModelControllers[0].$options.updateOn).toEqual(['blur']);
  });

  it('adds a validator name dataValidation', () => {
    expect(ngModelControllers[0].$validators.dataValidation).toBeDefined();
  });

  it('calls validationService.validateValue with the model value and the found the validation rules', () => {
    ngModelControllers[0].$validators.dataValidation('foo', 'bar');
    expect(validationService.validateValue).toHaveBeenCalledWith('foo', ['definedAndNotNan', 'required']);
  });

  it('calls the validation when model value change', () => {
    $scope.$digest();
    validationService.validateValue.calls.reset();
    // Do not use a property with dependencies, the count won't be 1
    $scope.vm.test4 = 123;
    $scope.$digest();
    expect(validationService.validateValue.calls.count()).toEqual(1);
  });

  it('works with standard validation', () => {
    $scope.$digest();
    $scope.vm.test1 = null;
    $scope.$digest();
    expect(ngModelControllers[0].$invalid).toBe(true);
    $scope.vm.test1 = 123;
    $scope.$digest();
    expect(ngModelControllers[0].$valid).toBe(true);
  });

  describe('events binding', () => {
    it('listen on validationService.getValidateAllEventName and validationService.getValidateGroupEventName to validate all and groups', () => {
      expect(validationService.getValidateAllEventName).toHaveBeenCalled();
      expect($scope.$on.calls.argsFor(1)[0]).toEqual('data-validation-validate-all');
      expect($scope.$on.calls.argsFor(2)[0]).toEqual('data-validation-validate-group-fooGroup');
      expect($scope.$on.calls.argsFor(3)[0]).toEqual('data-validation-validate-group-fooGroup2');
    });

    it('validate the model when validateAll event is broadcasted', () => {
      spyOn(ngModelControllers[0], '$validate');
      $rootScope.$broadcast('data-validation-validate-all');
      $scope.$digest();
      expect(ngModelControllers[0].$validate).toHaveBeenCalled();
    });
    it('validate the model when a validate group event of a group that contains the model is broadcasted', () => {
      spyOn(ngModelControllers[0], '$validate');
      $rootScope.$broadcast('data-validation-validate-group-fooGroup');
      $scope.$digest();
      expect(ngModelControllers[0].$validate).toHaveBeenCalled();
    });

    it('does not validate the model when a random event is broadcasted', () => {
      spyOn(ngModelControllers[0], '$validate');
      $rootScope.$broadcast('not-listened');
      $scope.$digest();
      expect(ngModelControllers[0].$validate).not.toHaveBeenCalled();
    });
  });

  describe('dependencies', () => {
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

    it('emit an event when the value is validated and another property depends on the current', () => {
      spyOn($scope, '$emit').and.callThrough();
      expect(validationService.getValidatedModelPropertyEventName).toHaveBeenCalled();
      var event1Name = validationService.getValidatedModelPropertyEventName.calls.first().returnValue;
      var event4Name = validationService.getValidatedModelPropertyEventName.calls.mostRecent().returnValue;

      $scope.vm.test1 = 123;
      $scope.$digest();
      expect($scope.$emit).toHaveBeenCalledWith(event1Name);

      $scope.vm.test4 = 123;
      $scope.$digest();
      expect($scope.$emit).not.toHaveBeenCalledWith(event4Name);
    });

    it('call the validation on every dependent rule', () => {
      ngModelControllers.forEach((controller:any) => {
        spyOn(controller, '$validate').and.callThrough();
      });

      $scope.vm.test3 = 123;
      $scope.$digest();
      expect(ngModelControllers[1].$validate).toHaveBeenCalled();
      expect(ngModelControllers[0].$validate).not.toHaveBeenCalled();

      $scope.vm.test1 = 123;
      $scope.$digest();
      expect(ngModelControllers[2].$validate).toHaveBeenCalled();
      expect(ngModelControllers[3].$validate).not.toHaveBeenCalled();
    });
  });
});
