import Config from "../../common/config";
import * as bluebird from "bluebird";
import * as amqp from "amqplib";
import CircuitBreaker from "../../common/circuit-breaker";
import * as messaging from "../messaging";

import Logger from "../../common/logger";
import * as MainConst from "../../common/mainconstant";
import { PushFCMService } from "../../adapters/pushfcm-service";
import { PushFCMServiceImpl } from "../../adapters/implementations/pushfcm-serviceimpl";
import { RequestFCMBO } from "../../bo/fcm/requestfcmbo";
import { ResponseFCMBO } from "../../bo/fcm/responsefcmbo";
import { ResultBO } from "../../bo/fcm/result";
import { NotificationBO } from "../../bo/fcm/notificationbo";

export interface RabbitMQOptions {
    reconnectionTime?: number;
}

export class RabbitMQBroker implements messaging.MessageBroker {
    private options: RabbitMQOptions = {};

    private connection: amqp.Connection | null = null;
    private channel: amqp.Channel | null = null;

    private qname: string;
    private durable: boolean;
    private persistent: boolean;

    constructor(qname: string, durable: boolean, persistent: boolean, options?: RabbitMQOptions) {
        if (options) {
            this.options = options;
        }
        this.qname = qname;
        this.durable = durable;
        this.persistent = persistent;
    }

    connect(url: string, options?: any) {
        return new Promise<RabbitMQBroker>((resolve, reject) => {
            amqp.connect(url, options)
                .then(connection => {
                    this.connection = connection;
                    /*
                    this.createChannel()
                    .then(channel => {
                         this.channel = channel;                         
                         CircuitBreaker.reportState("broker", "close");
                         Logger.info("Process " + process.pid + " Queue Connect on ",url);  
                         return resolve(this);
                    });
                    */
                    CircuitBreaker.reportState("broker", "close");
                    connection.on("error", (error: any) => {
                        connection.close();
                        this.connection = null;
                        CircuitBreaker.reportState("broker", "open");
                        return bluebird.delay(
                            this.options.reconnectionTime || 5000
                        ).then(() => {
                            return this.connect(url, options);
                        });
                    });
                    
                    Logger.info("Process " + process.pid + " Queue Connect on ",url);  
                    return resolve(this);
                    
                }).catch(error => {
                    this.connection = null;
                    CircuitBreaker.reportState("broker", "open");
                    return bluebird.delay(
                        this.options.reconnectionTime || 5000
                    ).then(() => {
                        return this.connect(url, options);
                    }).then(broker => {
                        return resolve(broker);
                    });
                });
        });
    }

    disconnect() {
        return new Promise<void>((resolve, reject) => {
            if (!this.connection) {
                return resolve();
            }
            this.connection.close()
                .then(() => {
                    this.connection = null;
                    CircuitBreaker.reportState("broker", "open");
                    return resolve();
                })
                .catch(error => {
                    return reject(new Error(`MessageBrokerError: ${error.toString()}`));
                });
        });
    }

    createChannel(): Promise<amqp.Channel> {
        return new Promise<amqp.Channel>((resolve, reject) => {
            if (!this.connection) {
                return reject(new Error(`MessageChannelError: connection error`));
            }
            this.connection.createChannel()
                .then(channel => {
                    channel.assertQueue(this.qname, { durable: this.durable });
                   
                    this.channel = channel;                    
                    CircuitBreaker.reportStatus("broker", true);
                    channel.on("error", (error: any) => {
                        channel.close();
                        this.channel = null;
                        CircuitBreaker.reportState("broker", "open");
                        return bluebird.delay(
                            this.options.reconnectionTime || 5000
                        ).then(() => {
                            return this.createChannel();
                        });
                    });

                    return resolve(this.channel);
                })
                .catch(error => {
                    this.channel = null;
                    CircuitBreaker.reportState("broker", "open");
                    return bluebird.delay(
                        this.options.reconnectionTime || 5000
                    ).then(() => {
                        return this.createChannel();
                    });
                });
        });
    }


    willReceiveMessage() {
        return new Promise<void>((resolve, reject) => {
            /*
            if(this.channel){
               
                try {

                    this.channel.prefetch(1);
                    Logger.info("Process " + process.pid +" [*] Waiting for messages in %s. To exit press CTRL+C", this.qname);

                    this.channel.consume(this.qname, function (msg: any) {

                        Logger.info("Process " + process.pid +" [x] Received %s", msg.content.toString());

                        let msgContent: messaging.MessageContent = JSON.parse(msg.content.toString());

                        let req_push: RequestFCMBO = msgContent.content;

                        let api_key = Config.get<string>(
                            "push-notification-service",
                            "fcm-service.api-key",
                            ""
                        );

                        let fcm_service: PushFCMService = new PushFCMServiceImpl();

                        let req_id = msgContent.request_id;

                        fcm_service.send(msgContent.request_id, api_key, req_push).then(resp_push => {

                            Logger.info(MainConst.logPattern(req_id, "FCM result : " + JSON.stringify(resp_push)));
                            
                            let result: ResultBO
                            if ( resp_push.failure == 0 && resp_push.success > 0 ) {
                                if (resp_push.canonical_ids > 0) {

                                    result = resp_push.results[0] as ResultBO;
                                    //responseMessage = createResponseSuccess(result.message_id);

                                    //updateSucessMPNGLogAndToken(this.transID, result, respPush);
                                } else {
                                    result = resp_push.results[0] as ResultBO;
                                    //responseMessage = createResponseSuccess(result.message_id);
                                    //updateSucessMPNGLog(this.transID, result, respPush);
                                }

                            } else {
                                result = resp_push.results[0] as ResultBO;
                                //responseMessage = createResponseSuccess(result.message_id);
                                /*
                                if (mapErrorResend.containsKey(result.getError())) {
                                    // update log to error and resend
                                    updateFailToReocveryMPNGLog(this.transID, result, respPush);
                                    insertMPNGRetryLog(this.transID);
                                } else {
                                    // update log to error not resend
                                    updateErrorMPNGLog(this.transID, result, respPush);
                                }
                                /

                            }    

                            //Logger.info(MainConst.logPattern(req_id, "response : "+JSON.stringify(responseMessage)));
                            //response.send(JSON.stringify(responseMessage)); 
                        }).catch(error => {
                            //let responseMessage = createResponseError(MainConst.ErrorCode.MPNG001.err_code, error.toString()) as PushRestResponseBO;
                            //Logger.info(MainConst.logPattern(req_id, "response : "+JSON.stringify(responseMessage)));
                            Logger.error(MainConst.logPattern(req_id, "response : "+error.toString()));

                        });                              

                        this.channel.ack(msg); 

                    }, { noAck: false });                       

                } catch(error) {
                    Logger.error("Process " + process.pid + ` MessageBrokerError: ${error.toString()}`);
                }
                               
                               
            } else {
                return reject("Process " + process.pid + " channel is null");
            }
            */
            

            
            this.createChannel().then(channel => {
                //return new Promise<void>((resolve, reject) => {

                        try {

                            channel.prefetch(1);
                            Logger.info("Process " + process.pid +" [*] Waiting for messages in %s. To exit press CTRL+C", this.qname);

                            channel.consume(this.qname, function (msg: any) {

                                Logger.info("Process " + process.pid +" [x] Received %s", msg.content.toString());

                                let msgContent: messaging.MessageContent = JSON.parse(msg.content.toString());

                                let req_push: RequestFCMBO = msgContent.content;

                                let api_key = msgContent.server_key;

                                let fcm_service: PushFCMService = new PushFCMServiceImpl();

                                let req_id = msgContent.request_id;

                                fcm_service.send(msgContent.request_id, api_key, req_push).then(resp_push => {

                                    Logger.info(MainConst.logPattern(req_id, "Process " + process.pid + " FCM result : " + JSON.stringify(resp_push)));
                                    
                                    let result: ResultBO
                                    if ( resp_push.failure == 0 && resp_push.success > 0 ) {
                                        if (resp_push.canonical_ids > 0) {

                                            result = resp_push.results[0] as ResultBO;
                                            //responseMessage = createResponseSuccess(result.message_id);

                                            //updateSucessMPNGLogAndToken(this.transID, result, respPush);
                                        } else {
                                            result = resp_push.results[0] as ResultBO;
                                            //responseMessage = createResponseSuccess(result.message_id);
                                            //updateSucessMPNGLog(this.transID, result, respPush);
                                        }

                                    } else {
                                        result = resp_push.results[0] as ResultBO;
                                        //responseMessage = createResponseSuccess(result.message_id);
                                        /*
                                        if (mapErrorResend.containsKey(result.getError())) {
                                            // update log to error and resend
                                            updateFailToReocveryMPNGLog(this.transID, result, respPush);
                                            insertMPNGRetryLog(this.transID);
                                        } else {
                                            // update log to error not resend
                                            updateErrorMPNGLog(this.transID, result, respPush);
                                        }
                                        */
                                    }    

                                    //Logger.info(MainConst.logPattern(req_id, "response : "+JSON.stringify(responseMessage)));
                                    //response.send(JSON.stringify(responseMessage)); 
                                }).catch(error => {
                                    //let responseMessage = createResponseError(MainConst.ErrorCode.MPNG001.err_code, error.toString()) as PushRestResponseBO;
                                    //Logger.info(MainConst.logPattern(req_id, "response : "+JSON.stringify(responseMessage)));
                                    Logger.error(MainConst.logPattern(req_id, "Process " + process.pid + " response : "+error.toString()));

                                });                              

                                channel.ack(msg); 

                            }, { noAck: false });                       

                         } catch(error) {
                            Logger.error("Process " + process.pid +` MessageBrokerError: ${error.toString()}`);
                         }    
                 /*
                 }).catch(error => {
                    //return reject(new Error(`MessageBrokerError: ${error.toString()}`));
                    Logger.error(`MessageBrokerError: ${error.toString()}`);
                 });
                 */

            }).catch(error => {
                //return reject(new Error(`MessageBrokerError: ${error.toString()}`));
                Logger.error("Process " + process.pid +` MessageBrokerError: ${error.toString()}`);
            });
            

        });
    }


};

export default RabbitMQBroker;
