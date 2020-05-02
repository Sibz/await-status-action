import * as actionsCore from "@actions/core"
import { Inputs } from "../interfaces/Inputs";
import inputNames from '../inputNames';

export const ERR_INVALID_STRING: string = "{0} is undefined, null or empty string";
export const ERR_INVALID_NUMBER: string = "{0} is NaN";
export const DEFAULTS = {
    timeout: 600,
    notPresentTimeout: 300,
    pollInterval: 10,
    completeStates: ['success'],
    failureStates: ['error', 'failure']
}

export default function importInputs(testActionsCore: any | null = null): Inputs {

    let core = testActionsCore as ActionsCore ?? actionsCore as ActionsCore;

    let inputs: Inputs = {
        authToken: getString(core, inputNames.authToken),
        contexts: getStringArray(core, inputNames.contexts),
        timeout: getNumber(core, inputNames.timeout, DEFAULTS.timeout),
        notPresentTimeout: getNumber(core, inputNames.notPresentTimeout, DEFAULTS.notPresentTimeout),
        pollInterval: getNumber(core, inputNames.pollInterval, DEFAULTS.pollInterval),
        completeStates: getStringArrayOrDefault(core, inputNames.completeStates, DEFAULTS.completeStates),
        failureStates: getStringArrayOrDefault(core, inputNames.failureStates, DEFAULTS.failureStates),
        sha: getString(core, inputNames.sha),
        owner: getString(core, inputNames.owner),
        repository: getString(core, inputNames.repository)
    } as Inputs;

    return inputs;
}

function getString(core: ActionsCore, inputName: string): string {

    let input: string = core.getInput(inputName);

    if (!input) {
        throw new Error(ERR_INVALID_STRING.replace('{0}', inputName));
    }
    
    return input;
}

function getStringArray(core: ActionsCore, inputName: string) {

    return getString(core, inputName).split(';');
}

function getStringArrayOrDefault(core: ActionsCore, inputName: string, defaultValue: string[]) {

    let input: string = core.getInput(inputName);

    if (!input) {
        return defaultValue;
    }

    return input.split(';');
}

function getNumber(core: ActionsCore, inputName: string, defaultValue: number): number {

    let n = defaultValue;
    let input: string = core.getInput(inputName);

    if (input) {
        n = parseInt(input);
        if (isNaN(n)) {
            throw new Error(ERR_INVALID_NUMBER.replace('{0}', inputName));
        }
    }

    return n;
}

export interface ActionsCore {
    getInput: (arg: string) => string;
}
