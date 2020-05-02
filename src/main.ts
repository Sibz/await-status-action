import * as core from "@actions/core"
import importInputs from "./fn/importInputs";
import { Inputs } from "./interfaces/Inputs";
import { Octokit } from "@octokit/rest";
import { GetResponseDataTypeFromEndpointMethod } from "@octokit/types";
import outputNames from "./outputNames";

const NOT_PRESENT = "not_present";
let tmpO = new Octokit();
type ListStatusesForRefResponse = GetResponseDataTypeFromEndpointMethod<typeof tmpO.repos.listStatusesForRef>;


//type RunResult = "success" | "failure" | "timeout";

enum RunResult{ 
    success = "success",
    failure = "failure",
    timeout = "timeout"
}

async function run() {
    let inputs: Inputs;
    try {
        inputs = importInputs();
    } catch (error) {
        core.setFailed(`Error getting inputs:\n${error.message}`);
        return;
    }

    let octokit = new Octokit({
        auth: inputs.authToken,
        userAgent: "wait-for-github-status-action",
        baseUrl: 'https://api.github.com',
        log: {
            debug: () => { },
            info: console.log,
            warn: console.warn,
            error: console.error
        },
        request: {
            agent: undefined,
            fetch: undefined,
            timeout: 0
        }
    });

    let startTime = Date.now();
    let timeout = startTime + inputs.notPresentTimeout * 1000;
    let currentStatuses: CheckStatus = {};
    inputs.contexts.forEach(x => currentStatuses[x] = NOT_PRESENT);
    let failed: boolean = false;
    let completed: boolean = false;
    let allPresent: boolean = false;

    currentStatuses = await getCurrentStatuses(inputs, octokit, currentStatuses);

    while (timeout>Date.now()
        && !(failed = statusesHasFailure(inputs.failureStates, currentStatuses))
        && !(completed = statusesAllComplete(inputs.completeStates, currentStatuses))        
        )
        {
            // TODO : delay
            if (!allPresent && statusesAllPresent(currentStatuses))
            {
                allPresent = true;
                timeout = startTime + inputs.timeout * 1000;
            }
            currentStatuses = await getCurrentStatuses(inputs, octokit, currentStatuses);
        }
    let runResult: RunResult = timeout > Date.now() ? RunResult.timeout : failed ? RunResult.failure: RunResult.success;
    
    let failedCheckNames: string[] = [];
    let failedCheckStates: string[] = [];

    if (runResult != RunResult.success) 
    {
        inputs.contexts.forEach(element => {
            let curStatus = currentStatuses[element]
            if (inputs.failureStates.includes(curStatus) || curStatus == NOT_PRESENT)
            {
                failedCheckNames.push(element);
                failedCheckStates.push(curStatus);
            }
        });
    }

    core.setOutput(outputNames.result, runResult);
    core.setOutput(outputNames.numberOfFailedChecks, failedCheckNames.length);
    core.setOutput(outputNames.failedCheckStates, failedCheckStates.join(';'));
    core.setOutput(outputNames.failedCheckNames, failedCheckNames.join(';'));
}


async function getCurrentStatuses(inputs: Inputs, octokit: Octokit, currentStatuses: CheckStatus) {
    let githubStatuses = await getStatuses(inputs, octokit);
    return updateCurrentStatuses(currentStatuses, githubStatuses.data);
}

function statusesHasFailure(failureStates: string[], currentStatuses: CheckStatus): boolean {
    let props = Object.getOwnPropertyNames(currentStatuses);
    if (props.find(propName => failureStates.includes(currentStatuses[propName]))) {
        return true;
    }
    return false;
}

function statusesAllComplete(completeStates: string[], currentStatuses: CheckStatus) {
    let props = Object.getOwnPropertyNames(currentStatuses);
    if (props.find(propName => !completeStates.includes(currentStatuses[propName]))) {
        return false;
    }
    return true;
}
function statusesAllPresent(currentStatuses: CheckStatus) {
    let props = Object.getOwnPropertyNames(currentStatuses);
    if (props.find(propName => currentStatuses[propName]==NOT_PRESENT)) {
        return false;
    }
    return true;
}

function updateCurrentStatuses(currentStatuses: CheckStatus, data: ListStatusesForRefResponse): CheckStatus {
    let result: CheckStatus = {};
    Object.assign(result, currentStatuses);
    for (let i = 0; i < data.length; i++) {
        const status = data[i];
        if (result.hasOwnProperty(status.context)) {
            result[status.context] = status.state;
        }
    }
    return result;
}

interface CheckStatus {
    [checkName: string]: string
}

async function getStatuses(inputs: Inputs, octokit: Octokit) {
    return octokit.repos.listStatusesForRef({
        owner: inputs.owner,
        repo: inputs.repository,
        ref: inputs.ref
    })
}

run().catch(e => core.setFailed(e.message ?? "Unknown error in action"));