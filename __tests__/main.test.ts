import { expect, test, } from '@jest/globals'
import importInputs, { ERR_INVALID_STRING, DEFAULTS, ERR_INVALID_NUMBER } from '../src/fn/importInputs';
import { INPUT_NAMES } from '../src/constants';
import { ActionsCore } from '../src/interfaces/ActionsCore';

let testValueSet = {
    authToken: "token",
    contexts: "firstContext;secondContext",
    timeout: "123",
    notPresentTimeout: "222",
    pollInterval: "42",
    completeStates: "success;pending",
    failureStates: "pending;error;failure",
    sha: "testSHA",
    owner: "repoOwner",
    repository: "repositoryName"
}

class actionCore implements ActionsCore {
    inputMapping: InputMapping[];
    constructor(inputMapping: InputMapping[] = []) {
        this.inputMapping = [
            { name: INPUT_NAMES.authToken, value: testValueSet.authToken },
            { name: INPUT_NAMES.contexts, value: testValueSet.contexts },
            { name: INPUT_NAMES.ref, value: testValueSet.sha },
            { name: INPUT_NAMES.owner, value: testValueSet.owner },
            { name: INPUT_NAMES.repository, value: testValueSet.repository },
        ]
        inputMapping.forEach(x => this.inputMapping.push(x));
        this.inputMapping = this.inputMapping.reverse();
    }
    setOutput(name: string, value: string | number) { return };
    getInput(arg: string) {
        let result = this.inputMapping.find(x => x.name == arg);
        if (!result)
            return '';
        return result.value;
    };
}

let actionCoreDefault = new actionCore();
interface InputMapping {
    name: string;
    value: string;
}

/*
 *  Importing values
 */
{
    test("should import authToken", () => {
        expect(importInputs(actionCoreDefault).authToken).toBe(testValueSet.authToken);
    });
    test("should import contexts", () => {
        expect(importInputs(actionCoreDefault).contexts).toEqual(testValueSet.contexts.split(';'));
    });
    test("should import ref", () => {
        expect(importInputs(actionCoreDefault).ref).toBe(testValueSet.sha)
    });
    test("should import timeout", () => {
        expect(importInputs(new actionCore([{ name: INPUT_NAMES.timeout, value: testValueSet.timeout }])).timeout).toBe(parseInt(testValueSet.timeout));
    });
    test("should import notPresentTimeout", () => {
        expect(importInputs(new actionCore([{ name: INPUT_NAMES.notPresentTimeout, value: testValueSet.notPresentTimeout }])).notPresentTimeout).toBe(parseInt(testValueSet.notPresentTimeout));
    });
    test("should import pollInterval", () => {
        expect(importInputs(new actionCore([{ name: INPUT_NAMES.pollInterval, value: testValueSet.pollInterval }])).pollInterval).toBe(parseInt(testValueSet.pollInterval));
    });
    test("should import completeStates", () => {
        expect(importInputs(new actionCore([{ name: INPUT_NAMES.completeStates, value: testValueSet.completeStates }])).completeStates).toEqual(testValueSet.completeStates.split(';'));
    });
    test("should import failureStates", () => {
        expect(importInputs(new actionCore([{ name: INPUT_NAMES.failureStates, value: testValueSet.failureStates }])).failureStates).toEqual(testValueSet.failureStates.split(';'));
    });
    test("should import owner", () => {
        expect(importInputs(new actionCore([{ name: INPUT_NAMES.owner, value: testValueSet.owner }])).owner).toBe(testValueSet.owner);
    });
    test("should import repository", () => {
        expect(importInputs(new actionCore([{ name: INPUT_NAMES.repository, value: testValueSet.repository }])).repository).toBe(testValueSet.repository);
    });
    test("when repo has username infrom, should strip username", () => {
        expect(
            importInputs(new actionCore([{
                name: INPUT_NAMES.repository,
                value: `${testValueSet.owner}/${testValueSet.repository}`
            }])).repository
        ).toBe(
            testValueSet.repository
        );
    });
}

/*
 *  Defaults
 */
{
    test("should set timeout to default", () => {
        expect(importInputs(actionCoreDefault).timeout).toBe(DEFAULTS.timeout)
    });
    test("should set notPresentTimeout to default", () => {
        expect(importInputs(actionCoreDefault).notPresentTimeout).toBe(DEFAULTS.notPresentTimeout)
    });
    test("should set pollInterval to default", () => {
        expect(importInputs(actionCoreDefault).pollInterval).toBe(DEFAULTS.pollInterval)
    });
    test("should set failureStates to default", () => {
        expect(importInputs(actionCoreDefault).failureStates).toEqual(DEFAULTS.failureStates)
    });
    test("should set completeStates to default", () => {
        expect(importInputs(actionCoreDefault).completeStates).toEqual(DEFAULTS.completeStates)
    });
}

/*
 *  Errors
 */
{
    test("when authToken undef, null or empty string, should throw", () => {
        expect(() =>
            importInputs(new actionCore([{ name: INPUT_NAMES.authToken, value: '' }]))).toThrow(ERR_INVALID_STRING.replace('{0}', INPUT_NAMES.authToken));
    });
    test("when contexts undef, null or empty string, should throw", () => {
        expect(() => importInputs(new actionCore([{ name: INPUT_NAMES.contexts, value: '' }]))).toThrow(ERR_INVALID_STRING.replace('{0}', INPUT_NAMES.contexts));
    });
    test("when ref undef, null or empty string, should throw", () => {
        expect(() => importInputs(new actionCore([{ name: INPUT_NAMES.ref, value: '' }]))).toThrow(ERR_INVALID_STRING.replace('{0}', INPUT_NAMES.ref));
    });
    test("when timeout is NaN, should throw", () => {
        expect(() => importInputs(new actionCore([{ name: INPUT_NAMES.timeout, value: 'bad' }]))).toThrow(ERR_INVALID_NUMBER.replace('{0}', INPUT_NAMES.timeout));
    });
    test("when notPresentTimeout is NaN, should throw", () => {
        expect(() => importInputs(new actionCore([{ name: INPUT_NAMES.notPresentTimeout, value: 'bad' }]))).toThrow(ERR_INVALID_NUMBER.replace('{0}', INPUT_NAMES.notPresentTimeout));
    });
    test("when pollInterval is NaN, should throw", () => {
        expect(() => importInputs(new actionCore([{ name: INPUT_NAMES.pollInterval, value: 'bad' }]))).toThrow(ERR_INVALID_NUMBER.replace('{0}', INPUT_NAMES.pollInterval));
    });
    test("when owner undef, null or empty string, should throw", () => {
        expect(() => importInputs(new actionCore([{ name: INPUT_NAMES.owner, value: '' }]))).toThrow(ERR_INVALID_STRING.replace('{0}', INPUT_NAMES.owner));
    });
    test("when repository undef, null or empty string, should throw", () => {
        expect(() => importInputs(new actionCore([{ name: INPUT_NAMES.repository, value: '' }]))).toThrow(ERR_INVALID_STRING.replace('{0}', INPUT_NAMES.repository));
    });
}
