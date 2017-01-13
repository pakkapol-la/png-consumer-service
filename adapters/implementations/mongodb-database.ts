import * as bluebird from "bluebird";
import * as mongoose from "mongoose";
import Config from "../../common/config";
import CircuitBreaker from "../../common/circuit-breaker";
import Database from "../database";
import {LocationInfo, LocationInfoModel} from "../../models/implementations/mongodb-locationinfo";
import Logger from "../../common/logger";

interface MongoDBOptions {
    reconnectionTime?: number;
}

export default class MongoDBDatabase implements Database {
    private error: any = "not connected";
    private options: MongoDBOptions = {};

    constructor(options?: MongoDBOptions){
        (mongoose as any).Promise = bluebird;
        if(options){
            this.options = options;
        }
    }

    connect(url: string, options?: any){
        return new Promise<MongoDBDatabase>((resolve, reject) => {
            mongoose.connect(url, options)
                .then(() => {
                    this.error = null;
                    Logger.info('mongoose.connected.......');
                    Logger.info('CircuitBreaker.reportState...close....');
                    CircuitBreaker.reportState("db", "close");
                    mongoose.connection.on("error", (error: any) => {
                        mongoose.connection.db.close();
                        this.error = error;
                        CircuitBreaker.reportState("db", "open");
                        return bluebird.delay(
                            this.options.reconnectionTime || 5000
                        ).then(() => {
                            return this.connect(url, options);
                        });
                    });
                    return resolve(this);
                })
                .catch(error => {
                    this.error = error;
                    Logger.info('mongoose.connect error.......' + error);
                    Logger.info('CircuitBreaker.reportState...open....');
                    CircuitBreaker.reportState("db", "open");
                    return bluebird.delay(
                        this.options.reconnectionTime || 5000
                    ).then(() => {
                        return this.connect(url, options);
                    });
                });
        });
    }

    disconnect(){
        return new Promise<void>((resolve, reject) => {
            mongoose.disconnect()
                .then(() => {
                    this.error = "not connected";
                    Logger.info('mongoose.disconnect');
                    Logger.info('CircuitBreaker.reportState...open....');
                    CircuitBreaker.reportState("db", "open");
                    return resolve();
                })
                .catch(error => {
                    return reject(new Error(`DBError: ${error}`));
                });
        });
    }

    getAtmLocation(lat: string, lng: string, distance: string){
        return new Promise<LocationInfo[]>((resolve, reject) => {
            if(this.error){
                return reject(new Error(`DBError: ${this.error}`));
            }
            LocationInfoModel.find({
                    location: {
                        $near: [parseFloat(lat), parseFloat(lng)],
                        $minDistance: 0,
                        $maxDistance: parseFloat(distance)
                    }
                })
                .then(locationInfo => {
                    return resolve(locationInfo);
                })
                .catch(error => {
                    return reject(new Error(`DBError: ${error}`));
                });

        });
    }
}
