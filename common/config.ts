import * as config from "config";

export class Config {
    static getGlobal<T>(
        path: string,
        defaultValue: T
    ): T {
        return (
            config.has(path) ?
            config.get<T>(path) :
            defaultValue
        );
    }

    static getLocal<T>(
        serviceName: string,
        path: string,
        defaultValue: T
    ): T {
        return this.getGlobal<T>(
            `${serviceName}.${path}`,
            defaultValue
        );
    }

    static get<T>(
        serviceName: string,
        path: string,
        defaultValue: T
    ): T {
        return this.getLocal(
            serviceName,
            path,
            this.getGlobal(path, defaultValue)
        );
    }

    static env(name: string, defaultValue?: string): string | undefined {
        if(name in process.env){
            return process.env[name];
        }
        return defaultValue;
    }

    static has(path: string): boolean {
        return config.has(path);
    }
}

export default Config;
