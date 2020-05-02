export interface ActionsCore {
    getInput: (arg: string) => string,
    setOutput: (name: string, value: string | number) => void
}
