import * as core from "@actions/core"
import { AwaitRunner } from "./AwaitRunner";

function setFailed(e: any) {
    core.setFailed(e.message ?? "Unknown error in action")
}

try {
    new AwaitRunner().run().catch(e => setFailed(e));
} catch (e) {
    setFailed(e);
}