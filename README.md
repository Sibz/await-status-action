# Await Status Action <a href="https://github.com/Sibz/await-status-action"><img alt="await-status-action status"   src="https://github.com/Sibz/await-status-action/workflows/test/badge.svg"></a>

Waits for a status or multiple statuses to complete or fail.

Returns on first failure, but will provide details of all states at failure. Action runs successfully regardless of result unless there is an error.

Has separate timeouts for waiting for checks to be present
and for waiting for all checks to complete. You will need to consider how long it may take for your status adding workflow 
to add it's state, bearing in mind that it may be queued. Alternatively you can set it pending in the same action that 
calls this action. 

To set status from a workflow see: [Sibz/github-status-action](https://github.com/Sibz/github-status-action)

## Usage

### Inputs

* `authToken` (required)  
Use `secrets.GITHUB_TOKEN` or your own token.
* `contexts` (required)  
Semi-colon separated list of contexts (check names), i.e. `'Test run 1;Test run 2'`
* `timeout`  
**Default: 600 seconds**  
Maximum time in seconds to wait for an action to complete or fail  
* `notPresentTimeout`  
**Default: 300 seconds**  
Maximum time in seconds to wait for a check to appear
* `pollInterval`  
**Default: 10 seconds**  
Time in seconds between polls to GitHub for status updates
* `ref`  
**Default: `github.sha`**  
Ref or SHA to check for status on
* `owner`  
**Default: `github.repository_owner`**  
Owner/GitHub username if checking another repository
* `repository`  
**Default: `github.repository`**  
Repository name if checking another repository
#### Advanced
If you need to return `pending` state as either complete or failed, you can add it to the following:
* `completeStates`  
**Default `'success'`**  
Semi-colon separated list of states to consider completed successfully
* `failureStates`  
**Default: `'failure;error'`**  
Semi-colon separated list of states to consider failure

### Outputs
* `result`  
Either `success`, `failure` or `timeout`
* `numberOfFailedChecks`  
Number of checks that were not complete when result is `failure` or `timeout`
* `failedCheckNames`  
Semi-colon separated list of check names that were not complete
* `failedCheckStates`  
Semi-colon separated list of check states that were not complete  
Will be the state of the check unless it wasn't present and timed out  
One of `success`, `failure`, `error`, `pending` or `not_present`
