/// <reference path="../typings/tsd.d.ts" />
/// <reference path="../node_modules/data-validation/dist/data-validation.d.ts" />

describe('ValidationService', () => {
    var $rootScope:any, service:any;
    var dataValidation:dataValidation.DataValidationModule;

    beforeEach(angular.mock.module('dataValidation'));

    beforeEach(angular.mock.inject(($injector:angular.auto.IInjectorService) => {
        dataValidation = require("data-validation");
        service = $injector.get('validationService');
        $rootScope = $injector.get('$rootScope');
    }));

    it('can add rule to the rule collection', () => {
        spyOn(dataValidation.RulesCollection, 'addRule');
        service.addRule('fooBar', {});
        expect(dataValidation.RulesCollection.addRule).toHaveBeenCalledWith('fooBar', {});
    });

    describe('getValidateAllEventName', () => {
        it('returns data-validation-validate-all', () => {
            var eventName = service.getValidateAllEventName();
            expect(eventName).toBeDefined();
            expect(typeof eventName).toBe('string');
            expect(eventName).toEqual('data-validation-validate-all');
        });
    });

    describe('getValidateGroupEventName', () => {
        it('returns data-validation-validate-group-[groupName]', () => {
            var eventName = service.getValidateGroupEventName('foo');
            expect(eventName).toBeDefined();
            expect(typeof eventName).toBe('string');
            expect(eventName).toEqual('data-validation-validate-group-foo');

            eventName = service.getValidateGroupEventName('bar');
            expect(eventName).toEqual('data-validation-validate-group-bar');
        });
    });

    describe('getValidatedModelEventName', () => {
        it('returns data-validation-validated-model-[id]-[name]', () => {
            var eventName = service.getValidatedModelEventName('foo', 'bar');
            expect(eventName).toBeDefined();
            expect(typeof eventName).toBe('string');
            expect(eventName).toEqual('data-validation-validated-model-foo-bar');
        });
    });

    describe('uniqId', () => {
        it('returns a uniq string', () => {
            var id = service.uniqId();
            var id2 = service.uniqId();
            expect(id).toBeDefined();
            expect(typeof id).toBe('string');
            expect(id).not.toEqual(id2);
        });
    });

    describe('validateAll', () => {
        it('causes $rootScope to broadcast the event given by getValidateAllEventName', () => {
            spyOn($rootScope, '$broadcast');
            spyOn(service, 'getValidateAllEventName').and.callThrough();
            service.validateAll();

            expect(service.getValidateAllEventName).toHaveBeenCalled();
            var eventName = service.getValidateAllEventName();
            expect($rootScope.$broadcast).toHaveBeenCalledWith(eventName);
        });
    });

    describe('validateGroup', () => {
        it('causes $rootScope to broadcast the event given by getValidateGroupEventName', () => {
            spyOn($rootScope, '$broadcast');
            spyOn(service, 'getValidateGroupEventName').and.callThrough();

            service.validateGroup('foo');
            expect(service.getValidateGroupEventName).toHaveBeenCalledWith('foo');
            var eventName = service.getValidateGroupEventName('foo');
            expect($rootScope.$broadcast).toHaveBeenCalledWith(eventName);

            service.validateGroup('bar');
            expect(service.getValidateGroupEventName).toHaveBeenCalledWith('bar');
            eventName = service.getValidateGroupEventName('bar');
            expect($rootScope.$broadcast).toHaveBeenCalledWith(eventName);
        });
    });
});
