import * as actionsCore from "@actions/core"
import { RunResult } from "./enums/RunResult"
import { Inputs } from "./interfaces/Inputs"
import { RunOutput } from "./interfaces/RunOutput"
import { CheckStatus } from "./interfaces/CheckStatus"
import { Octokit } from "@octokit/rest"
import importInputs from "./fn/importInputs"
import { NOT_PRESENT, OUTPUT_NAMES } from "./constants"
import { getCurrentStatuses, statusesHasFailure, statusesAllComplete, statusesAllPresent, newCurrentStatuses } from "./fn/statusFunctions"
import delay from "delay"
import { ActionsCore } from "./interfaces/ActionsCore"

export class AwaitRunner {
    private inputs: Inputs
    private octokit: Octokit
    private currentStatuses: CheckStatus
    private core: ActionsCore

    constructor(testActionsCore: ActionsCore | null = null, octokit: Octokit | null = null) {
        this.core = testActionsCore ?? actionsCore
        this.inputs = importInputs()
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
        })
        this.currentStatuses = newCurrentStatuses(this.inputs.contexts)
    }

    async run(): Promise<void> {
        const runResult = await this.runLoop()

        const runOutput: RunOutput = {
            failedCheckNames: [],
            failedCheckStates: []
        }

        if (runResult !== RunResult.success) {
            this.getRunOutput(runOutput)
        }

        this.core.setOutput(OUTPUT_NAMES.result, runResult)
        this.core.setOutput(OUTPUT_NAMES.numberOfFailedChecks, runOutput.failedCheckNames.length)
        this.core.setOutput(OUTPUT_NAMES.failedCheckStates, runOutput.failedCheckStates.join(';'))
        this.core.setOutput(OUTPUT_NAMES.failedCheckNames, runOutput.failedCheckNames.join(';'))
    }

    private getRunOutput(output: RunOutput): void {
        for (const element of this.inputs.contexts) {
            const curStatus = this.currentStatuses[element]
            if (!this.inputs.completeStates.includes(curStatus) || curStatus === NOT_PRESENT) {
                output.failedCheckNames.push(element)
                output.failedCheckStates.push(curStatus)
            }
        }
    }

    async runLoop(): Promise<RunResult> {
        const inputs = this.inputs
        const startTime = Date.now()
        let timeout = startTime + inputs.notPresentTimeout * 1000
        let failed = false
        let completed = false
        let allPresent = false

        this.currentStatuses = await getCurrentStatuses(inputs, this.octokit, this.currentStatuses)

        while (timeout > Date.now()) {
            this.currentStatuses = await getCurrentStatuses(inputs, this.octokit, this.currentStatuses)
            failed = statusesHasFailure(inputs.failureStates, this.currentStatuses)
            if (failed) {
                break
            }
            completed = statusesAllComplete(inputs.completeStates, this.currentStatuses)
            if (completed) {
                break
            }
            await delay(inputs.pollInterval * 1000)
            if (!allPresent && statusesAllPresent(this.currentStatuses)) {
                allPresent = true
                timeout = startTime + inputs.timeout * 1000
            }
        }
        return timeout < Date.now() ? RunResult.timeout : failed ? RunResult.failure : RunResult.success
    }
}
