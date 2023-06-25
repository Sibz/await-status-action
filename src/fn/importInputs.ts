import * as actionsCore from "@actions/core"
import { Inputs } from "../interfaces/Inputs"
import { INPUT_NAMES } from '../constants'
import { ActionsCore } from "../interfaces/ActionsCore"

export const ERR_INVALID_STRING = "{0} is undefined, null or empty string"
export const ERR_INVALID_NUMBER = "{0} is NaN"
export const DEFAULTS = {
    timeout: 600,
    notPresentTimeout: 300,
    pollInterval: 10,
    completeStates: ['success'],
    failureStates: ['error', 'failure']
}

export default function importInputs(core: ActionsCore = actionsCore): Inputs {
    const inputs: Inputs = {
        authToken: getString(core, INPUT_NAMES.authToken),
        contexts: getStringArray(core, INPUT_NAMES.contexts),
        timeout: getNumber(core, INPUT_NAMES.timeout, DEFAULTS.timeout),
        notPresentTimeout: getNumber(core, INPUT_NAMES.notPresentTimeout, DEFAULTS.notPresentTimeout),
        pollInterval: getNumber(core, INPUT_NAMES.pollInterval, DEFAULTS.pollInterval),
        completeStates: getStringArrayOrDefault(core, INPUT_NAMES.completeStates, DEFAULTS.completeStates),
        failureStates: getStringArrayOrDefault(core, INPUT_NAMES.failureStates, DEFAULTS.failureStates),
        ref: getString(core, INPUT_NAMES.ref),
        owner: getString(core, INPUT_NAMES.owner),
        repository: getString(core, INPUT_NAMES.repository)
    } as Inputs

    if (inputs.repository.startsWith(`${inputs.owner}/`)) {
        inputs.repository = inputs.repository.replace(`${inputs.owner}/`, '')
    }

    return inputs
}

function getString(core: ActionsCore, inputName: string): string {
    const input: string = core.getInput(inputName)

    if (!input) {
        throw new Error(ERR_INVALID_STRING.replace('{0}', inputName))
    }

    return input
}

function getStringArray(core: ActionsCore, inputName: string): string[] {
    return getString(core, inputName).split(';')
}

function getStringArrayOrDefault(core: ActionsCore, inputName: string, defaultValue: string[]): string[] {
    const input: string = core.getInput(inputName)

    if (!input) {
        return defaultValue
    }

    return input.split(';')
}

function getNumber(core: ActionsCore, inputName: string, defaultValue: number): number {
    let n = defaultValue
    const input: string = core.getInput(inputName)

    if (input) {
        n = parseInt(input)
        if (isNaN(n)) {
            throw new Error(ERR_INVALID_NUMBER.replace('{0}', inputName))
        }
    }

    return n
}
