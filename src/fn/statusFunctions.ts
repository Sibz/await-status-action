import { NOT_PRESENT } from '../constants'
import { Inputs } from '../interfaces/Inputs'
import { Octokit } from '@octokit/rest'
import { CheckStatus } from '../interfaces/CheckStatus'

export function statusesHasFailure(failureStates: string[], currentStatuses: CheckStatus): boolean {
    const props = Object.getOwnPropertyNames(currentStatuses)
    if (props.find(propName => failureStates.includes(currentStatuses[propName]))) {
        return true
    }
    return false
}

export function statusesAllComplete(completeStates: string[], currentStatuses: CheckStatus): boolean {
    const props = Object.getOwnPropertyNames(currentStatuses)
    if (props.find(propName => !completeStates.includes(currentStatuses[propName]))) {
        return false
    }
    return true
}

export function statusesAllPresent(currentStatuses: CheckStatus): boolean {
    const props = Object.getOwnPropertyNames(currentStatuses)
    if (props.find(propName => currentStatuses[propName] === NOT_PRESENT)) {
        return false
    }
    return true
}

export async function getCurrentStatuses(inputs: Inputs, octokit: Octokit, currentStatuses: CheckStatus): Promise<CheckStatus> {
    const result = Object.assign({}, currentStatuses)
    const statuses = await octokit.repos.listCommitStatusesForRef({
        owner: inputs.owner,
        repo: inputs.repository,
        ref: inputs.ref
    })

    for (const status of statuses.data) {
        if (result.hasOwnProperty(status.context)) {
            result[status.context] = status.state
        }
    }
    return result
}

export function newCurrentStatuses(contexts: string[]): CheckStatus {
    const checkStatus: CheckStatus = {}
    for (const x of contexts) {
        checkStatus[x] = NOT_PRESENT
    }
    return checkStatus
}
