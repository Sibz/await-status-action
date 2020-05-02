import { Octokit } from "@octokit/rest";
import { GetResponseDataTypeFromEndpointMethod } from "@octokit/types";
let tmpO = new Octokit();

export type ListStatusesForRefResponse = GetResponseDataTypeFromEndpointMethod<typeof tmpO.repos.listStatusesForRef>;