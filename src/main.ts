import * as core from "@actions/core"
import importInputs from "./fn/importInputs";
import { Inputs } from "./interfaces/Inputs";
import { Octokit } from "@octokit/rest";
import outputNames from "./outputNames";
import delay from "delay";
import { statusesHasFailure, statusesAllComplete, statusesAllPresent, updateCurrentStatuses, getCurrentStatuses } from './fn/statusFunctions';
import { NOT_PRESENT } from './constants';

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
            await delay(inputs.pollInterval * 1000);
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

run().catch(e => core.setFailed(e.message ?? "Unknown error in action"));