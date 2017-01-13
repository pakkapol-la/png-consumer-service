import * as url from "url";
import * as request from "request";
import * as _ from "lodash";
import Config from "./config";
import CircuitBreaker from "./circuit-breaker";

class Request {
    private request: (request.UriOptions & request.CoreOptions);
    private requestAlias: string[];
    private bypassCircuitBreaker = false;

    constructor(uri: string){
        this.request = {
            uri: uri
        };
        this.request.timeout = Config.getGlobal<number | undefined>(
            "circuit-breaker.request-timeout", undefined
        );
        this.identifier(url.parse(uri).host || "*");
    }

    identifier(identifier: string){
        this.requestAlias = [identifier];
        return this;
    }

    alias(alias: string){
        this.requestAlias.push(alias);
        return this;
    }

    private reportStatus(status: boolean){
        this.requestAlias.forEach(alias => {
            CircuitBreaker.reportStatus(alias, status);
        });
    }

    private sendRequest(
        method: string,
        body?: any,
        headers?: {[key: string]: string}
    ){
        let request = this.method(method);
        if(body){
            request = request.body(body);
        }
        if(headers){
            _.forIn(headers, (value, key) => {
                if(!key){
                    return;
                }
                request = request.header(key, value);
            });
        }
        return request.send();
    }

    get(body?: any, headers?: {[key: string]: string}){
        return this.sendRequest("GET", body, headers);
    }

    post(body?: any, headers?: {[key: string]: string}){
        return this.sendRequest("POST", body, headers);
    }

    put(body?: any, headers?: {[key: string]: string}){
        return this.sendRequest("PUT", body, headers);
    }

    delete(body?: any, headers?: {[key: string]: string}){
        return this.sendRequest("DELETE", body, headers);
    }

    head(body?: any, headers?: {[key: string]: string}){
        return this.sendRequest("HEAD", body, headers);
    }

    patch(body?: any, headers?: {[key: string]: string}){
        return this.sendRequest("PATCH", body, headers);
    }

    bypass(bypass: boolean){
        this.bypassCircuitBreaker = bypass;
        return this;
    }

    method(method: string){
        this.request.method = method;
        return this;
    }

    header(key: string, value: string){
        if(!this.request.headers){
            this.request.headers = {};
        }
        this.request.headers[key] = value;
        return this;
    }

    body(body: any){
        this.request.body = body;
        return this;
    }

    json(json: any){
        this.request.json = json;
        return this;
    }

    auth(auth: request.AuthOptions){
        this.request.auth = auth;
        return this;
    }

    form(form: any){
        this.request.form = form;
        return this;
    }

    formData(formData: any){
        this.request.formData = formData;
        return this;
    }

    encoding(encoding: string){
        this.request.encoding = encoding;
        return this;
    }

    timeout(timeout: number){
        this.request.timeout = timeout;
        return this;
    }

    key(key: Buffer){
        this.request.key = key;
        return this;
    }

    cert(cert: Buffer){
        this.request.cert = cert;
        return this;
    }

    send(){
        return new Promise<
            {
                statusCode?: number;
                statusMessage?: string;
                headers: any;
                body: any;
            }
        >((resolve, reject) => {
            if(!this.bypassCircuitBreaker){
                this.requestAlias.forEach(alias => {
                    CircuitBreaker.openWhen({
                        key: alias,
                        limit: Config.getGlobal<number>(
                            "circuit-breaker.fail-limit", 5
                        )
                    }).halfOpenWhen({
                        key: alias,
                        resetTime: Config.getGlobal<number>(
                            "circuit-breaker.reset-time", 30000
                        )
                    }).closeWhen({
                        key: alias,
                        limit: Config.getGlobal<number>(
                            "circuit-breaker.success-limit", 5
                        )
                    });
                });

                let circuitOpen = this.requestAlias.some(alias => {
                    return !CircuitBreaker.getStatus(alias);
                });

                if(circuitOpen){
                    return reject({
                        code: 503,
                        message: "Service Unavailable"
                    });
                }
            }

            request(this.request, (error, response, body) => {
                if(error){
                    if(
                        !this.bypassCircuitBreaker && (
                            error.code === "ETIMEDOUT" ||
                            error.code === "ESOCKETTIMEDOUT" ||
                            Config.getGlobal<number[]>(
                                "circuit-breaker.unexpected-status", []
                            ).some(status => {
                                return error.code === status;
                            })
                        )
                    ){
                        this.reportStatus(false);
                    }
                    return reject(error);
                }
                if(!this.bypassCircuitBreaker){
                    this.reportStatus(true);
                }
                return resolve({
                    statusCode: response.statusCode,
                    statusMessage: response.statusMessage,
                    headers: response.headers,
                    body: body
                });
            });
        });
    }
}

function StaticRequest(uri: string){
    return new Request(uri);
}

export default StaticRequest;
