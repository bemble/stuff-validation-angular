/// <reference path="../node_modules/data-validation/dist/data-validation.d.ts" />

declare module angularDataValidation {
  interface IValidationConfiguration extends dataValidation.IValidationConfiguration {
    dependencies?: {
      [propertyName: string]: string[];
    };
  }

  interface IValidationService extends dataValidation.Validator {
    addRule(ruleName:string, rule:dataValidation.Rule): void;
    getValidateAllEventName(): string;
    getValidateGroupEventName(groupName:string):string;
    getValidatedModelPropertyEventName(objectUniqId:string, propertyName:string):string;
    validateGroup(groupName:string):void;
    validateAll():void;
    uniqId():string;
  }
}
