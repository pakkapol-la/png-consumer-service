import * as _ from "lodash";

interface CircuitBreakerStatus {
    state: "close" | "halfOpen" | "open";
    halfOpen: number;
    close: number;
    pending: boolean;
    [key: string]: any;

    request: {
        close?: {
            key: string;
            limit?: number;
        };
        halfOpen?: {
            key: string;
            resetTime?: number;
        };
        open?: {
            key: string;
            limit?: number;
        };
    };
}

class CircuitBreaker {
    private static status: {[key: string]: CircuitBreakerStatus} = {};

    private static createStatus(
        key: string,
        state: "close" | "halfOpen" | "open" = "close"
    ){
        if(!this.status.hasOwnProperty(key)){
            this.status[key] = {
                state: state,
                halfOpen: 0,
                close: 0,
                pending: false,
                request: {}
            };
            return true;
        }
        return false;
    }

    private static updateState(key: string){
        let request = this.status[key].request;
        if(request.open){
            this.checkOpen(request.open);
        }
        if(request.halfOpen){
            this.checkHalfOpen(request.halfOpen);
        }
        if(request.close){
            this.checkClose(request.close);
        }
    }

    static resetCircuitBreaker(){
        this.status = {};
    }

    static reportStatus(key: string, status: boolean){
        this.createStatus(key);
        let state = this.status[key].state;
        let failCount = this.status[key][state];
        this.status[key][state] += status ? -1 : 1;
        if(state === "close" && this.status[key].close < 0){
            this.status[key].close = 0;
        }

        this.updateState(key);
    }

    static reportState(key: string, state: "close" | "halfOpen" | "open"){
        if(!this.createStatus(key, state)){
            this.status[key].state = state;
            if(state === "open"){
                this.status[key].close = 0;
            }
            if(state === "open" || state === "close"){
                this.status[key].halfOpen = 0;
            }
        }

        this.updateState(key);
    }

    static openWhen(
        requestInfo: {
            key: string;
            limit?: number;
        }
    ){
        this.createStatus(requestInfo.key);
        let status = this.status[requestInfo.key];
        this.status[requestInfo.key].request.open = requestInfo;
        return this;
    }

    static halfOpenWhen(
        requestInfo: {
            key: string;
            resetTime?: number;
        }
    ){
        this.createStatus(requestInfo.key);
        let status = this.status[requestInfo.key];
        this.status[requestInfo.key].request.halfOpen = requestInfo;
        return this;
    }

    static closeWhen(
        requestInfo: {
            key: string;
            limit?: number;
        }
    ){
        this.createStatus(requestInfo.key);
        let status = this.status[requestInfo.key];
        this.status[requestInfo.key].request.close = requestInfo;
        return this;
    }

    private static checkOpen(
        requestInfo: {
            key: string;
            limit?: number;
        }
    ){
        if(!this.status.hasOwnProperty(requestInfo.key)){
            return this;
        }
        let status = this.status[requestInfo.key];
        // Already in "open" state
        if(status.state === "open"){
            return this;
        }
        // Limit in "close" state is not exceeded
        if(status.state === "close" && status.close < requestInfo.limit || 0){
            return this;
        }
        // No error occured in "half-open" state
        if(status.state === "halfOpen" && status.halfOpen <= 0){
            return this;
        }
        status.state = "open";
        status.close = 0;
        status.halfOpen = 0;
        return this;
    }

    private static checkHalfOpen(
        requestInfo: {
            key: string;
            resetTime?: number;
        }
    ){
        if(!this.status.hasOwnProperty(requestInfo.key)){
            return this;
        }
        let status = this.status[requestInfo.key];
        // Cannot become "half-open" state if in "close" state
        if(status.state === "close"){
            return this;
        }
        // Already in "half-open" state or is pending to be "half-open" state
        if(status.state === "halfOpen" || status.pending){
            return this;
        }
        status.pending = true;
        setTimeout(() => {
            if(!status){
                return;
            }
            status.pending = false;
            status.state = "halfOpen";
        }, requestInfo.resetTime);
        return this;
    }

    private static checkClose(
        requestInfo: {
            key: string;
            limit?: number;
        }
    ){
        if(!this.status.hasOwnProperty(requestInfo.key)){
            return this;
        }
        let status = this.status[requestInfo.key];
        // Cannot become "close" state if in "open" state
        if(status.state === "open"){
            return this;
        }
        // Already in "close" state
        if(status.state === "close"){
            return this;
        }
        // Success limit in "half-open" state is not exceeded
        if(status.halfOpen > -(requestInfo.limit || 0)){
            return this;
        }
        status.state = "close";
        status.halfOpen = 0;
        return this;
    }

    static getStatus(key: string) {
        let status = this.getRawStatus(key);
        return status ? status.state !== "open" : true;
    }

    static getRawStatus(key: string) {
        // TODO(sirisak.lu): Add supports for wildcard matching
        return this.status.hasOwnProperty(key) ? this.status[key] : undefined;
    }

    static getAllStatus(){
        let allStatus: {[key: string]: any} = {};
        _.forIn(this.status, (status, key) => {
            if(!key){
                return;
            }
            let output: any = {
                state: status.state,
            };
            if(status.state === "close" && status[status.state] === 0){
                return;
            }
            if(status.state !== "open"){
                if(status[status.state] < 0){
                    output["success_count"] = -status[status.state];
                }else if(status[status.state] > 0){
                    output["fail_count"] = status[status.state];
                }
            }
            if(status.pending){
                output["pending"] = true;
            }
            allStatus[key] = output;
        });

        return _.isEmpty(allStatus) ? undefined : allStatus;
    }
}

export default CircuitBreaker;
