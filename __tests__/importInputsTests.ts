import test from 'ava';
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
    test("should import authToken", t => {
        t.is(importInputs(actionCoreDefault).authToken, testValueSet.authToken);
    });
    test("should import contexts", t => {
        t.deepEqual(importInputs(actionCoreDefault).contexts, testValueSet.contexts.split(';'));
    });
    test("should import ref", t => {
        t.is(importInputs(actionCoreDefault).ref, testValueSet.sha);
    });
    test("should import timeout", t => {
        t.is(importInputs(new actionCore([{ name: INPUT_NAMES.timeout, value: testValueSet.timeout }])).timeout, parseInt(testValueSet.timeout));
    });
    test("should import notPresentTimeout", t => {
        t.is(importInputs(new actionCore([{ name: INPUT_NAMES.notPresentTimeout, value: testValueSet.notPresentTimeout }])).notPresentTimeout, parseInt(testValueSet.notPresentTimeout));
    });
    test("should import pollInterval", t => {
        t.is(importInputs(new actionCore([{ name: INPUT_NAMES.pollInterval, value: testValueSet.pollInterval }])).pollInterval, parseInt(testValueSet.pollInterval));
    });
    test("should import completeStates", t => {
        t.deepEqual(importInputs(new actionCore([{ name: INPUT_NAMES.completeStates, value: testValueSet.completeStates }])).completeStates, testValueSet.completeStates.split(';'));
    });
    test("should import failureStates", t => {
        t.deepEqual(importInputs(new actionCore([{ name: INPUT_NAMES.failureStates, value: testValueSet.failureStates }])).failureStates, testValueSet.failureStates.split(';'));
    });
    test("should import owner", t => {
        t.is(importInputs(new actionCore([{ name: INPUT_NAMES.owner, value: testValueSet.owner }])).owner, testValueSet.owner);
    });
    test("should import repository", t => {
        t.is(importInputs(new actionCore([{ name: INPUT_NAMES.repository, value: testValueSet.repository }])).repository, testValueSet.repository);
    });
    test("when repo has username infrom, should strip username", t => {
        t.is(
            importInputs(
                new actionCore([
                    {
                        name: INPUT_NAMES.repository,
                        value: `${testValueSet.owner}/${testValueSet.repository}`
                    }])).repository,
            testValueSet.repository);
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
            importInputs(new actionCore([{ name: INPUT_NAMES.authToken, value: '' }])));
        t.is(err.message, ERR_INVALID_STRING.replace('{0}', INPUT_NAMES.authToken));
    });
    test("when contexts undef, null or empty string, should throw", t => {
        let err = t.throws(() => importInputs(new actionCore([{ name: INPUT_NAMES.contexts, value: '' }])));
        t.is(err.message, ERR_INVALID_STRING.replace('{0}', INPUT_NAMES.contexts));
    });
    test("when ref undef, null or empty string, should throw", t => {
        let err = t.throws(() => importInputs(new actionCore([{ name: INPUT_NAMES.ref, value: '' }])));
        t.is(err.message, ERR_INVALID_STRING.replace('{0}', INPUT_NAMES.ref));
    });
    test("when timeout is NaN, should throw", t => {
        let err = t.throws(() => importInputs(new actionCore([{ name: INPUT_NAMES.timeout, value: 'bad' }])));
        t.is(err.message, ERR_INVALID_NUMBER.replace('{0}', INPUT_NAMES.timeout));
    });
    test("when notPresentTimeout is NaN, should throw", t => {
        let err = t.throws(() => importInputs(new actionCore([{ name: INPUT_NAMES.notPresentTimeout, value: 'bad' }])));
        t.is(err.message, ERR_INVALID_NUMBER.replace('{0}', INPUT_NAMES.notPresentTimeout));
    });
    test("when pollInterval is NaN, should throw", t => {
        let err = t.throws(() => importInputs(new actionCore([{ name: INPUT_NAMES.pollInterval, value: 'bad' }])));
        t.is(err.message, ERR_INVALID_NUMBER.replace('{0}', INPUT_NAMES.pollInterval));
    });
    test("when owner undef, null or empty string, should throw", t => {
        let err = t.throws(() => importInputs(new actionCore([{ name: INPUT_NAMES.owner, value: '' }])));
        t.is(err.message, ERR_INVALID_STRING.replace('{0}', INPUT_NAMES.owner));
    });
    test("when repository undef, null or empty string, should throw", t => {
        let err = t.throws(() => importInputs(new actionCore([{ name: INPUT_NAMES.repository, value: '' }])));
        t.is(err.message, ERR_INVALID_STRING.replace('{0}', INPUT_NAMES.repository));
    });
}