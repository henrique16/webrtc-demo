import _config from "../config/index"
import _fs from "fs"

export class SaveError {
    private name: string
    private error: string
    private path: string

    public constructor(name: string, error: string) {
        this.name = name
        this.error = error
        this.path = `${_config.error.dir}/${this.name}`
    }

    public exec(): void {
        _fs.writeFileSync(this.path, this.error)
    }
}