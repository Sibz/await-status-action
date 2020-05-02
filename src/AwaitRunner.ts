import * as actionsCore from "@actions/core"
import { RunResult } from "./enums/RunResult";
import { Inputs } from "./interfaces/Inputs";
import { Octokit } from "@octokit/rest";
import importInputs from "./fn/importInputs";
import { NOT_PRESENT } from "./constants";
import outputNames from "./outputNames";
import { getCurrentStatuses, statusesHasFailure, statusesAllComplete, statusesAllPresent } from "./fn/statusFunctions";
import delay from "delay";
import { ActionsCore } from "./ActionsCore";

export class AwaitRunner {
    private inputs: Inputs;
    private octokit: Octokit;
    private currentStatuses: CheckStatus;
    private core: ActionsCore;

    constructor(testActionsCore: ActionsCore | null = null, octokit: Octokit | null = null) {
        this.core = testActionsCore ?? actionsCore;
        this.inputs = importInputs();
        this.octokit = octokit ?? new Octokit({
            auth: this.inputs.authToken,
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
        this.currentStatuses = {};
        this.inputs.contexts.forEach(x => this.currentStatuses[x] = NOT_PRESENT);
    }

    async run() {

        let runResult = await this.runLoop();

        let failedCheckNames: string[] = [];
        let failedCheckStates: string[] = [];

        if (runResult != RunResult.success) {
            this.inputs.contexts.forEach(element => {
                let curStatus = this.currentStatuses[element]
                if (this.inputs.failureStates.includes(curStatus) || curStatus == NOT_PRESENT) {
                    failedCheckNames.push(element);
                    failedCheckStates.push(curStatus);
                }
            });
        }

        this.core.setOutput(outputNames.result, runResult);
        this.core.setOutput(outputNames.numberOfFailedChecks, failedCheckNames.length);
        this.core.setOutput(outputNames.failedCheckStates, failedCheckStates.join(';'));
        this.core.setOutput(outputNames.failedCheckNames, failedCheckNames.join(';'));
    }

    async runLoop(): Promise<RunResult> {
        let inputs = this.inputs;
        let startTime = Date.now();
        let timeout = startTime + inputs.notPresentTimeout * 1000;
        let failed: boolean = false;
        let completed: boolean = false;
        let allPresent: boolean = false;

        this.currentStatuses = await getCurrentStatuses(inputs, this.octokit, this.currentStatuses);

        while (timeout > Date.now()
            && !(failed = statusesHasFailure(inputs.failureStates, this.currentStatuses))
            && !(completed = statusesAllComplete(inputs.completeStates, this.currentStatuses))
        ) {
            await delay(inputs.pollInterval * 1000);
            if (!allPresent && statusesAllPresent(this.currentStatuses)) {
                allPresent = true;
                timeout = startTime + inputs.timeout * 1000;
            }
            this.currentStatuses = await getCurrentStatuses(inputs, this.octokit, this.currentStatuses);
        }
        return timeout > Date.now() ? RunResult.timeout : failed ? RunResult.failure : RunResult.success;
    }
}
