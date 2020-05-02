import test from 'ava';
import importInputs, { ActionsCore, ERR_INVALID_STRING, DEFAULTS, ERR_INVALID_NUMBER } from '../src/fn/importInputs';
import inputNames from '../src/inputNames';

let testValueSet = {
    authToken: "token",
    contexts: "firstContext;secondContext",
    timeout: "123",
    notPresentTimeout: "222",
    pollInterval: "42",
    completeStates: "success;pending",
    failureStates: "pending;error;failure",
    sha: "testSHA"
}

class actionCore implements ActionsCore {
    inputMapping: InputMapping[];
    constructor(inputMapping: InputMapping[] = []) {
        this.inputMapping = [
            { name: inputNames.authToken, value: testValueSet.authToken },
            { name: inputNames.contexts, value: testValueSet.contexts },
            { name: inputNames.sha, value: testValueSet.sha },
        ]
        inputMapping.forEach(x => this.inputMapping.push(x));
        this.inputMapping = this.inputMapping.reverse();
    }
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
    test("should import authToken", t => {
        t.is(importInputs(actionCoreDefault).authToken, testValueSet.authToken);
    });
    test("should import contexts", t => {
        t.deepEqual(importInputs(actionCoreDefault).contexts, testValueSet.contexts.split(';'));
    });
    test("should import sha", t => {
        t.is(importInputs(actionCoreDefault).sha, testValueSet.sha);
    });
    test("should import timeout", t => {
        t.is(importInputs(new actionCore([{ name: inputNames.timeout, value: testValueSet.timeout }])).timeout, parseInt(testValueSet.timeout));
    });
    test("should import notPresentTimeout", t => {
        t.is(importInputs(new actionCore([{ name: inputNames.notPresentTimeout, value: testValueSet.notPresentTimeout }])).notPresentTimeout, parseInt(testValueSet.notPresentTimeout));
    });
    test("should import pollInterval", t => {
        t.is(importInputs(new actionCore([{ name: inputNames.pollInterval, value: testValueSet.pollInterval }])).pollInterval, parseInt(testValueSet.pollInterval));
    });
    test("should import completeStates", t => {
        t.deepEqual(importInputs(new actionCore([{ name: inputNames.completeStates, value: testValueSet.completeStates }])).completeStates, testValueSet.completeStates.split(';'));
    });
    test("should import failureStates", t => {
        t.deepEqual(importInputs(new actionCore([{ name: inputNames.failureStates, value: testValueSet.failureStates }])).failureStates, testValueSet.failureStates.split(';'));
    });
}

/*
 *  Defaults
 */
{
    test("should set timeout to default", t => {
        t.is(importInputs(actionCoreDefault).timeout, DEFAULTS.timeout);
    });
    test("should set notPresentTimeout to default", t => {
        t.is(importInputs(actionCoreDefault).notPresentTimeout, DEFAULTS.notPresentTimeout);
    });
    test("should set pollInterval to default", t => {
        t.is(importInputs(actionCoreDefault).pollInterval, DEFAULTS.pollInterval);
    });
    test("should set failureStates to default", t => {
        t.deepEqual(importInputs(actionCoreDefault).failureStates, DEFAULTS.failureStates);
    });
    test("should set completeStates to default", t => {
        t.deepEqual(importInputs(actionCoreDefault).completeStates, DEFAULTS.completeStates);
    });
}

/*
 *  Errors
 */
{
    test("when authToken undef, null or empty string, should throw", t => {
        let err = t.throws(() =>
            importInputs(new actionCore([{name: inputNames.authToken, value: ''}])));
        t.is(err.message, ERR_INVALID_STRING.replace('{0}', inputNames.authToken));
    });
    test("when contexts undef, null or empty string, should throw", t => {
        let err = t.throws(() => importInputs(new actionCore([{name: inputNames.contexts, value: ''}])));
        t.is(err.message, ERR_INVALID_STRING.replace('{0}', inputNames.contexts));
    });
    test("when sha undef, null or empty string, should throw", t => {
        let err = t.throws(() => importInputs(new actionCore([{name: inputNames.sha, value: ''}])));
        t.is(err.message, ERR_INVALID_STRING.replace('{0}', inputNames.sha));
    });
    test("when timeout is NaN, should throw", t => {
        let err = t.throws(() => importInputs(new actionCore([{name: inputNames.timeout, value: 'bad'}])));
        t.is(err.message, ERR_INVALID_NUMBER.replace('{0}', inputNames.timeout));
    });
    test("when notPresentTimeout is NaN, should throw", t => {
        let err = t.throws(() => importInputs(new actionCore([{name: inputNames.notPresentTimeout, value: 'bad'}])));
        t.is(err.message, ERR_INVALID_NUMBER.replace('{0}', inputNames.notPresentTimeout));
    });
    test("when pollInterval is NaN, should throw", t => {
        let err = t.throws(() => importInputs(new actionCore([{name: inputNames.pollInterval, value: 'bad'}])));
        t.is(err.message, ERR_INVALID_NUMBER.replace('{0}', inputNames.pollInterval));
    });
}