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
import * as Routes from "../../routes";
import PushMessages from "../../models/pushmessages";
import * as PushMessagesImpl from "../../adapters/implementations/pushfcm-serviceimpl";

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
                    
                    Logger.info(MainConst.logPatternProcessId(process.pid, "Queue Connect on "+url));  
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
                        
            this.createChannel().then(channel => {
                //return new Promise<void>((resolve, reject) => {

                        try {

                            channel.prefetch(1);
                            Logger.info(MainConst.logPatternProcessId(process.pid, "[*] Waiting for messages in "+this.qname+". To exit press CTRL+C"));

                            channel.consume(this.qname, function (msg: any) {
                                
                                let process_log_db: boolean =  Config.get<boolean>(
                                    "mpng-service",
                                    "process-log-db",
                                    true
                                    );
                                    
                                Logger.info(MainConst.logPatternProcessId(process.pid, "MessageBroker Receiver : "+ msg.content.toString()));

                                let msg_content: messaging.MessageContent = JSON.parse(msg.content.toString());

                                let msg_db = prepareDBMsgOnReceive(msg_content);

                                let req_push: RequestFCMBO = msg_content.content;

                                let api_key = msg_content.server_key;

                                let fcm_service: PushFCMService = new PushFCMServiceImpl();

                                let req_id = msg_content.request_id;

                                msg_db.sent_time = new Date();

                                if (process_log_db) {

                                    Routes.getFactoryService().db_service.updatePushMessagesBeforeSent(msg_db).then(push_message_document => {

                                        fcm_service.send(msg_content.request_id, api_key, req_push, msg_db).then(push_result => {

                                            try {

                                                //Logger.info(MainConst.logPattern(req_id, process.pid, "FCM result : " + JSON.stringify(resp_push)));
                                                
                                                let resp_push = push_result.push_result as ResponseFCMBO;

                                                let msg_db = push_result.msg_db as PushMessages;

                                                msg_db.received_time = new Date();
                                                msg_db.elapsed = calculateElapsed(msg_db);

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

                                                    msg_db.status = MainConst.PushMessagesStatus.STATUS_SUCCESS; //0 sent success
                                                    
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

                                                    msg_db.status = MainConst.PushMessagesStatus.STATUS_FAIL; //1 sent to FCM success but result not success
                                                    msg_db.error_code = MainConst.ErrorCode.MPNG006.err_code;
                                                    if (result.error) {
                                                        msg_db.error_message = result.error;
                                                    }
                                                    
                                                }    
                                                
                                                Routes.getFactoryService().db_service.updatePushMessagesAfterSent(msg_db);

                                                //Logger.info(MainConst.logPattern(req_id, "response : "+JSON.stringify(responseMessage)));
                                                //response.send(JSON.stringify(responseMessage)); 

                                            } catch(error) {                                               
                                                //error manage result push
                                                Logger.error(MainConst.logPatternProcessId(process.pid, "response : error=manage result push "+error.stack));

                                                //3 fail when manage result push
                                                updatePushMessagesAfterSent(msg_db, MainConst.PushMessagesStatus.STATUS_FAIL_AFTER_SENT, MainConst.ErrorCode.MPNG001.err_code, error.toString());
                                            }    

                                        }).catch(error => {
                                            //error send FCM

                                            //let responseMessage = createResponseError(MainConst.ErrorCode.MPNG001.err_code, error.toString()) as PushRestResponseBO;
                                            //Logger.info(MainConst.logPattern(req_id, "response : "+JSON.stringify(responseMessage)));
                                            //Logger.error(MainConst.logPattern(req_id, process.pid, "response : error=send push "+JSON.stringify(error.stack)));
                                            Logger.error(MainConst.logPattern(req_id, process.pid, "response : error=send push "+error.stack));
                                            /*
                                            msg_db.received_time = new Date();
                                            msg_db.elapsed = calculateElapsed(msg_db);
                                            msg_db.status = MainConst.PushMessagesStatus.STATUS_FAIL_SENT; //2 fail when send to FCM
                                            msg_db.error_code = MainConst.ErrorCode.MPNG006.err_code;
                                            msg_db.error_message = error.toString();
                                            Routes.getFactoryService().db_service.updatePushMessagesAfterSent(msg_db);
                                            */

                                            //2 fail when send to FCM
                                            updatePushMessagesAfterSent(msg_db, MainConst.PushMessagesStatus.STATUS_FAIL_SENT, MainConst.ErrorCode.MPNG006.err_code, error.toString());
                                        });

                                    }).catch(error => {
                                        //error update DB
                                        //Logger.error(MainConst.logPattern(req_id, process.pid, "response : error=DB "+JSON.stringify(error.stack)));
                                        Logger.error(MainConst.logPattern(req_id, process.pid, "response : error=DB "+error.stack));

                                        /*
                                        msg_db.status = 1;
                                        msg_db.error_code = MainConst.ErrorCode.MPNG006.err_code;
                                        msg_db.error_message = error.stack;
                                        Routes.getFactoryService().db_service.updatePushMessagesAfterSent(msg_db); 
                                        */
                                    });
                                } else {

                                    // case not log in DB   
                                    fcm_service.send(msg_content.request_id, api_key, req_push, msg_db).then(push_result => {

                                            //Logger.info(MainConst.logPattern(req_id, process.pid, "FCM result : " + JSON.stringify(resp_push)));
                                            
                                            let resp_push = push_result.push_result as ResponseFCMBO;

                                            let msg_db = push_result.msg_db as PushMessages;

                                            msg_db.received_time = new Date();
                                            msg_db.elapsed = calculateElapsed(msg_db);

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

                                                msg_db.status = MainConst.PushMessagesStatus.STATUS_SUCCESS; //0 sent success
                                                
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

                                                msg_db.status = MainConst.PushMessagesStatus.STATUS_FAIL; //1 sent to FCM success but result not success
                                                msg_db.error_code = MainConst.ErrorCode.MPNG006.err_code;
                                                if (result.error) {
                                                    msg_db.error_message = result.error;
                                                }
                                                
                                            }    
                                            
                                            //Logger.info(MainConst.logPattern(req_id, "response : "+JSON.stringify(responseMessage)));
                                            //response.send(JSON.stringify(responseMessage)); 
                                        }).catch(error => {
                                            //error send FCM
                                            
                                            //let responseMessage = createResponseError(MainConst.ErrorCode.MPNG001.err_code, error.toString()) as PushRestResponseBO;
                                            //Logger.info(MainConst.logPattern(req_id, "response : "+JSON.stringify(responseMessage)));
                                            //Logger.error(MainConst.logPattern(req_id, process.pid, "response : error=send push "+JSON.stringify(error.stack)));
                                            Logger.error(MainConst.logPattern(req_id, process.pid, "response : error=send push "+error.stack));

                                            msg_db.received_time = new Date();
                                            msg_db.elapsed = calculateElapsed(msg_db);
                                            msg_db.status = MainConst.PushMessagesStatus.STATUS_FAIL_SENT; //2 fail when send to FCM
                                            msg_db.error_code = MainConst.ErrorCode.MPNG006.err_code;
                                            msg_db.error_message = error.stack;
                                           
                                        });

                                }                                                                                

                                channel.ack(msg); 

                            }, { noAck: false });                       

                         } catch(error) {
                             //error initial queue consume
                            Logger.error(MainConst.logPatternProcessId(process.pid, `response : error=MessageBrokerError: ${error.stack}`));
                         }    
                 /*
                 }).catch(error => {
                    //return reject(new Error(`MessageBrokerError: ${error.toString()}`));
                    Logger.error(`MessageBrokerError: ${error.toString()}`);
                 });
                 */

            }).catch(error => {
                //error create channel
                //return reject(new Error(`MessageBrokerError: ${error.toString()}`));
                Logger.error(MainConst.logPatternProcessId(process.pid, `response : error=MessageBrokerError: ${error.stack}`));
            });
            

        });
    }


};


function prepareDBMsgOnReceive(message_content: messaging.MessageContent): PushMessages{
    let push_message = {
            id: message_content.record_id,  
            request_id: message_content.request_id,
            application_id: "",
            user_id: "",
            started_time: new Date(message_content.started_time), //get started_time to calculate elapsed
            //put_time: new Date(),
            pulled_time: new Date(),  
            //sent_time: new Date(),
            //received_time: new Date(),
            elapsed: 0,
            //status: 2, //in process
            error_code: "",
	        error_message: "",
            interface_type: "",
            message_type: 0,
            worker_id: process.pid.toString(),
            push_provider_code: "",
            push_token_id: "",
            push_message: {}          
        } as PushMessages;
        
    return push_message;
}

function calculateElapsed(msg_db: PushMessages): number {
    if (msg_db.received_time) {
        if (msg_db.started_time) {           
            return ( msg_db.received_time.getTime() - msg_db.started_time.getTime() );
        }
    }
    return 0;
}


function updatePushMessagesAfterSent(msg_db: PushMessages, status: number, error_code: string, error_msg: string) {
    try {

        msg_db.received_time = new Date();
        msg_db.elapsed = calculateElapsed(msg_db);
        msg_db.status = status;
        msg_db.error_code = error_code;
        msg_db.error_message = error_msg;
        Routes.getFactoryService().db_service.updatePushMessagesAfterSent(msg_db);

    } catch (error) {
        //error update PushMessages After Sent
        Logger.error(MainConst.logPatternProcessId(process.pid, "subresponse : error=updatePushMessagesAfterSent "+error.stack));
    }
}


export default RabbitMQBroker;
