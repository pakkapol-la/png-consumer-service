import * as bluebird from "bluebird";
import * as mongoose from "mongoose";
import Config from "../../common/config";
import CircuitBreaker from "../../common/circuit-breaker";
import Database from "../database";
import {PushMessages, PushMessagesModel} from "../../models/implementations/mongodb-pushmessages";
import Logger from "../../common/logger";
import * as MainConst from "../../common/mainconstant";

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
                    //Logger.info('CircuitBreaker.reportState...close....');
                    //CircuitBreaker.reportState("db", "close");
                    mongoose.connection.on("error", (error: any) => {
                        mongoose.connection.db.close();
                        this.error = error;
                        return reject(error);
                        /*
                        CircuitBreaker.reportState("db", "open");
                        return bluebird.delay(
                            this.options.reconnectionTime || 5000
                        ).then(() => {
                            return this.connect(url, options);
                        });
                        */
                    });
                    return resolve(this);
                })
                .catch(error => {
                    this.error = error;
                    Logger.info('mongoose.connect error.......' + error);
                    return reject(error);
                    /*
                    Logger.info('CircuitBreaker.reportState...open....');
                    CircuitBreaker.reportState("db", "open");
                    return bluebird.delay(
                        this.options.reconnectionTime || 5000
                    ).then(() => {
                        return this.connect(url, options);
                    });
                    */
                });
        });
    }

    disconnect(){
        return new Promise<void>((resolve, reject) => {
            mongoose.disconnect()
                .then(() => {
                    this.error = "not connected";
                    Logger.info('mongoose.disconnect');
                    /*
                    Logger.info('CircuitBreaker.reportState...open....');
                    CircuitBreaker.reportState("db", "open");
                    */
                    return resolve();
                })
                .catch(error => {
                    //return reject(new Error(`DBError: ${error}`));
                    return reject(error);
                });
        });
    }


    updatePushMessagesBeforeSent(push_message: PushMessages){
        return new Promise<PushMessages>((resolve, reject) => {
            /*
            if (this.error) {
                return reject(`DBError: ${this.error}`);
            }
            */
            
            let pushmessages_model = new PushMessagesModel();
            
            pushmessages_model._id = push_message.id;
            if(push_message.pulled_time){
                pushmessages_model.pulled_time = push_message.pulled_time; 
            }
            if(push_message.sent_time){
                pushmessages_model.sent_time = push_message.sent_time;
            }

            pushmessages_model.status = MainConst.PushMessagesStatus.STATUS_IN_PROCESS_BEFORE_SENT; //98 in process before sent
            
            pushmessages_model.update(pushmessages_model,function(err, count) {
                if (err) {
                    //return reject(`DBError: ${err}`);
                    return reject(err);
                }

                return resolve(pushmessages_model);
            });

        });
    }


    updatePushMessagesAfterSent(push_message: PushMessages){
        return new Promise<PushMessages>((resolve, reject) => {
            /*
            if (this.error) {
                return reject(`DBError: ${this.error}`);
            }
            */
            let pushmessages_model = new PushMessagesModel();

            pushmessages_model._id = push_message.id;
            if (push_message.received_time) {
                pushmessages_model.received_time = push_message.received_time;
            }
            if (push_message.elapsed && push_message.elapsed != 0) {
                pushmessages_model.elapsed = push_message.elapsed;
            } 
            pushmessages_model.status = push_message.status;
            /*
            if(push_message.status){
                pushmessages_model.status = push_message.status;
            } 
            */
            if (push_message.error_code) {
                pushmessages_model.error_code = push_message.error_code;
            }
            if (push_message.error_message) {
                pushmessages_model.error_message = push_message.error_message;
            }
            
            pushmessages_model.update(pushmessages_model,function(err, count) {
                if (err) {
                    //return reject(`DBError: ${err}`);
                    return reject(err);
                }

                return resolve(pushmessages_model);
            });

        });
    }


}
