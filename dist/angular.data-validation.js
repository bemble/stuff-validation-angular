/*
 data-validation-angular v.0.1.0, https://github.com/pierrecle/data-validation-angular#readme
 data-validation v.0.1.0, https://github.com/pierrecle/data-validation#readme
 Licence LGPL-3.0
 */
(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
var Rule_1 = require('./lib/Rule');
exports.Rule = Rule_1.Rule;
var ValidationRule_1 = require('./lib/ValidationRule');
exports.ValidationRule = ValidationRule_1.ValidationRule;
var RulesCollection_1 = require('./lib/RulesCollection');
exports.RulesCollection = RulesCollection_1.RulesCollection;
var Validator_1 = require('./lib/Validator');
exports.Validator = Validator_1.Validator;

},{"./lib/Rule":2,"./lib/RulesCollection":5,"./lib/ValidationRule":6,"./lib/Validator":7}],2:[function(require,module,exports){
var Rule = (function () {
    function Rule() {
    }
    return Rule;
})();
exports.Rule = Rule;

},{}],3:[function(require,module,exports){
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var Rule_1 = require('../Rule');
var NotUndefinedOrNan = (function (_super) {
    __extends(NotUndefinedOrNan, _super);
    function NotUndefinedOrNan() {
        _super.apply(this, arguments);
    }
    NotUndefinedOrNan.prototype.isValueValid = function (value) {
        return value !== undefined && value === value;
    };
    return NotUndefinedOrNan;
})(Rule_1.Rule);
exports.NotUndefinedOrNan = NotUndefinedOrNan;

},{"../Rule":2}],4:[function(require,module,exports){
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var Rule_1 = require('../Rule');
var Required = (function (_super) {
    __extends(Required, _super);
    function Required() {
        _super.apply(this, arguments);
    }
    Required.prototype.isValueValid = function (value) {
        if (typeof value === 'object' && value === null) {
            return false;
        }
        var testedValue = (typeof value === 'object') ? Object.keys(value).toString() : ('' + value);
        return testedValue.length > 0;
    };
    return Required;
})(Rule_1.Rule);
exports.Required = Required;

},{"../Rule":2}],5:[function(require,module,exports){
var NotUndefinedOrNan_1 = require('./Rules/NotUndefinedOrNan');
var Required_1 = require('./Rules/Required');
var RulesCollection = (function () {
    function RulesCollection() {
    }
    RulesCollection.init = function () {
        RulesCollection.isInited = true;
        RulesCollection.reset();
    };
    RulesCollection.reset = function () {
        RulesCollection.collection = {};
        RulesCollection.collection['notUndefinedOrNan'] = new NotUndefinedOrNan_1.NotUndefinedOrNan();
        RulesCollection.collection['required'] = new Required_1.Required();
    };
    RulesCollection.addRule = function (ruleName, rule) {
        !RulesCollection.isInited && RulesCollection.init();
        if (RulesCollection.collection[ruleName]) {
            throw "Rule " + ruleName + " already exists!";
        }
        RulesCollection.collection[ruleName] = rule;
    };
    RulesCollection.getRule = function (ruleName) {
        !RulesCollection.isInited && RulesCollection.init();
        return RulesCollection.collection[ruleName];
    };
    RulesCollection.isInited = false;
    RulesCollection.collection = {};
    return RulesCollection;
})();
exports.RulesCollection = RulesCollection;

},{"./Rules/NotUndefinedOrNan":3,"./Rules/Required":4}],6:[function(require,module,exports){
var Rule_1 = require('./Rule');
var RulesCollection_1 = require('./RulesCollection');
var ValidationRule = (function () {
    function ValidationRule(rawRule, parameters, applyCondition) {
        this.parameters = parameters;
        this.applyCondition = applyCondition;
        if (!rawRule) {
            throw "RawRule must be a instance of Rule or a not-empty string";
        }
        this.rule = rawRule instanceof Rule_1.Rule ? rawRule : RulesCollection_1.RulesCollection.getRule(rawRule.toString());
    }
    ValidationRule.prototype.shouldBeApplied = function () {
        return this.applyCondition === undefined || this.applyCondition === null || !!this.getValueFromFunctionOrItself(this.applyCondition);
    };
    ValidationRule.prototype.getParametersValues = function () {
        var _this = this;
        if (typeof this.parameters === 'object') {
            var parametersValues = this.parameters instanceof Array ? [] : {};
            Object.keys(this.parameters).forEach(function (parameterName) {
                parametersValues[parameterName] = _this.getValueFromFunctionOrItself(_this.parameters[parameterName]);
            });
            return parametersValues;
        }
        return this.getValueFromFunctionOrItself(this.parameters);
    };
    ValidationRule.prototype.isValueValid = function (value) {
        return this.shouldBeApplied() ? this.rule.isValueValid(value, this.getParametersValues()) : true;
    };
    ValidationRule.prototype.getValueFromFunctionOrItself = function (rawValue) {
        if (typeof rawValue === 'function') {
            return rawValue();
        }
        return rawValue;
    };
    return ValidationRule;
})();
exports.ValidationRule = ValidationRule;

},{"./Rule":2,"./RulesCollection":5}],7:[function(require,module,exports){
var RulesCollection_1 = require('./RulesCollection');
var ValidationRule_1 = require('./ValidationRule');
var Validator = (function () {
    function Validator() {
    }
    Validator.prototype.validateValue = function (value, rules) {
        var usedRules = rules ? rules : [];
        usedRules.unshift('notUndefinedOrNan');
        var isNullValid = this.isNullValid(value, usedRules);
        for (var i = 0; i < usedRules.length && !isNullValid; i++) {
            var validationRule = this.getValidationRule(usedRules[i]);
            if (!validationRule.isValueValid(value)) {
                return validationRule;
            }
        }
        return null;
    };
    Validator.prototype.isNullValid = function (value, rules) {
        var _this = this;
        if (value !== null) {
            return false;
        }
        return !rules.some(function (rule) {
            var validationRule = _this.getValidationRule(rule);
            return validationRule.rule === RulesCollection_1.RulesCollection.getRule('required');
        });
    };
    Validator.prototype.getValidationRule = function (rawRule) {
        return rawRule instanceof ValidationRule_1.ValidationRule ? rawRule : new ValidationRule_1.ValidationRule(rawRule);
    };
    Validator.prototype.isValueValid = function (value, rules) {
        return this.validateValue(value, rules) === null;
    };
    Validator.prototype.isObjectValid = function (objectToValidate, validationConfig) {
        var config = this.getValidationConfiguration(objectToValidate, validationConfig);
        if (config && config.rules) {
            var validatedProperties = Object.keys(config.rules);
            if (this.hasInvalidProperty(validatedProperties, objectToValidate, config.rules)) {
                return false;
            }
        }
        return this.applyValidationOnObjectProperties('isObjectValid', objectToValidate);
    };
    Validator.prototype.isGroupValid = function (objectToValidate, groupName, validationConfig) {
        var config = this.getValidationConfiguration(objectToValidate, validationConfig);
        if (config.groups && config.groups[groupName] && config.rules) {
            var validatedProperties = config.groups[groupName];
            if (this.hasInvalidProperty(validatedProperties, objectToValidate, config.rules)) {
                return false;
            }
        }
        return this.applyValidationOnObjectProperties('isGroupValid', objectToValidate, [groupName]);
    };
    Validator.prototype.getValidationConfiguration = function (objectToValidate, validationConfig) {
        return validationConfig || (typeof objectToValidate === "object" && objectToValidate.validationConfiguration);
    };
    Validator.prototype.applyValidationOnObjectProperties = function (functionName, object, params) {
        var _this = this;
        var objectProperties = this.getObjectProperties(object);
        return objectProperties.length === 0 || !objectProperties.some(function (propertyName) {
            var property = object[propertyName];
            var callArgs = [property].concat(params);
            return !_this[functionName].apply(_this, callArgs);
        });
    };
    Validator.prototype.getObjectProperties = function (object) {
        var objectProperties = Object.keys(object);
        return objectProperties.filter(function (propertyName) {
            if (propertyName !== 'validationConfiguration') {
                var property = object[propertyName];
                return typeof property === 'object' && property !== null;
            }
            return false;
        });
    };
    Validator.prototype.hasInvalidProperty = function (propertiesName, objectToValidate, rules) {
        var _this = this;
        return propertiesName.some(function (propertyName) {
            if (!rules[propertyName]) {
                return false;
            }
            var value = objectToValidate[propertyName];
            return !_this.isValueValid(value, rules[propertyName]);
        });
    };
    return Validator;
})();
exports.Validator = Validator;

},{"./RulesCollection":5,"./ValidationRule":6}],8:[function(require,module,exports){
/// <reference path="../typings/angularjs/angular.d.ts" />
(function () {
    angular.module('dataValidation', []);
})();

},{}],9:[function(require,module,exports){
/// <reference path="../typings/angularjs/angular.d.ts" />
function validateModelDirective(validationService) {
    'ngInject';
    var directiveLink = function (scope, elm, attrs, ctrl) {
        ctrl.$options = ctrl.$options || {};
        ctrl.$options.updateOn = ['blur'];
        var propertyName = attrs.ngModel.match(/.+\.(.+)$/)[1];
        var viewModelExpression = attrs.ngModel.replace(/(.+)\.(.+)$/, "$1");
        var validationRulesExpression = attrs.ngModel.replace(/(.+)\.(.+)$/, "$1.validationRules.$2");
        var validationGroupsExpression = attrs.ngModel.replace(/(.+)\.(.+)$/, "$1.validationGroups");
        var viewModel = scope.$eval(viewModelExpression);
        var validationRules = scope.$eval(validationRulesExpression);
        var validationGroups = scope.$eval(validationGroupsExpression) || {};
        if (!viewModel.$$validatedModelUniqId) {
            Object.defineProperty(viewModel, '$$validatedModelUniqId', { value: validationService.uniqId() });
        }
        ctrl.$validators.dataValidation = function (modelValue, viewValue) {
            return validationService.validateValue(modelValue, validationRules) === null;
        };
        var validate = function () {
            ctrl.$setDirty(true);
        };
        var allEventName = validationService.getValidateAllEventName();
        scope.$on(allEventName, validate);
        Object.keys(validationGroups).forEach(function (groupName) {
            if (validationGroups[groupName].indexOf(propertyName) >= 0) {
                var groupEventName = validationService.getValidateGroupEventName(groupName);
                scope.$on(groupEventName, validate);
            }
        });
    };
    return {
        require: 'ngModel',
        restrict: 'A',
        link: directiveLink
    };
}
(function () {
    var module = angular.module('dataValidation');
    module.directive('validatedModel', validateModelDirective);
})();

},{}],10:[function(require,module,exports){
/// <reference path="../typings/node/node.d.ts" />
/// <reference path="../typings/angularjs/angular.d.ts" />
/// <reference path="../node_modules/data-validation/dist/data-validation.d.ts" />
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
function validationService($rootScope) {
    'ngInject';
    var dataValidation = require("data-validation");
    var ValidationService = (function (_super) {
        __extends(ValidationService, _super);
        function ValidationService() {
            _super.apply(this, arguments);
        }
        ValidationService.prototype.addRule = function (ruleName, rule) {
            dataValidation.RulesCollection.addRule(ruleName, rule);
        };
        ValidationService.prototype.getValidateAllEventName = function () {
            return 'data-validation-validate-all';
        };
        ValidationService.prototype.getValidateGroupEventName = function (groupName) {
            return 'data-validation-validate-group-' + groupName;
        };
        ValidationService.prototype.getValidatedModelEventName = function (objectUniqId, propertyName) {
            return 'data-validation-validated-model-' + objectUniqId + '-' + propertyName;
        };
        ValidationService.prototype.validateGroup = function (groupName) {
            var eventName = this.getValidateGroupEventName(groupName);
            $rootScope.$broadcast(eventName);
        };
        ValidationService.prototype.validateAll = function () {
            var eventName = this.getValidateAllEventName();
            $rootScope.$broadcast(eventName);
        };
        ValidationService.prototype.uniqId = function () {
            return Math.random().toString(36).substring(7) + Date.now();
        };
        return ValidationService;
    })(dataValidation.Validator);
    return new ValidationService();
}
(function () {
    var module = angular.module('dataValidation');
    module.service('validationService', validationService);
})();

},{"data-validation":1}]},{},[8,9,10]);
