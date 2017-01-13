import Config from "./common/config";
import Logger from "./common/logger";
import * as express from "express";
import * as bodyParser from "body-parser";
import { Server } from "http";
import Routes from "./routes";
import Database from "./adapters/database";
import MongoDBDatabase from "./adapters/implementations/mongodb-database";

import * as MainConst from "./mainconstant";

import { PushRestResponseBO } from "./bo/rest/pushrestresponsebo";
/*
import { PushFCMService } from "./adapters/pushfcm-service";
import { PushFCMServiceImpl } from "./adapters/implementations/pushfcm-serviceimpl";
import { RequestFCMBO } from "./bo/fcm/requestfcmbo";
import { ResponseFCMBO } from "./bo/fcm/responsefcmbo";
import { ResultBO } from "./bo/fcm/result";
import { NotificationBO } from "./bo/fcm/notificationbo";
*/
import * as amqp from "amqplib";
import MessageBroker from "./adapters/messaging";
import RabbitMQBroker from "./adapters/implementations/rabbitmq-messaging";


export let app = express();

export let database: Database = new MongoDBDatabase({
    reconnectionTime: Config.get<number>(
        "mpng-service",
        "mongodb.reconnect-time",
        5000
    )
});

export let server: Server;

//export let amqpConn: amqp.Connection;
export let broker: MessageBroker = new RabbitMQBroker(Config.get<string>(
        "push-notification-service",
        "rabbit-mq.q-online",
        ""
    ),Config.get<boolean>(
        "push-notification-service",
        "rabbit-mq.durable",
        true
    ),Config.get<boolean>(
        "push-notification-service",
        "rabbit-mq.persistent",
        true
    ),{
    reconnectionTime: Config.get<number>(
        "push-notification-service",
        "rabbit-mq.reconnect-time",
        5000
    )
});


if (process.env["NODE_ENV"] === "test") {
    Logger.info("Running on test environment...");
    //database = new MockDatabase();
}

Promise.all([
    database.connect(
        Config.get<string>(
            "mpng-service",
            "mongodb.connection-url",
            "mongodb://127.0.0.1/myproject"
        )
    ),
    broker.connect(Config.get<string>(
                            "push-notification-service",
                            "rabbit-mq.q-url",
                            ""
                        ))
    
]).then(() => {

    return new Promise((resolve, reject) => {
        app.use(bodyParser.json());
        app.use("/", Routes);
        app.use((
            error: any, request: express.Request, response: express.Response,
            next: express.NextFunction
        ) => {
            Logger.error("status 500 error : ", JSON.stringify(error));

            let responseMessage = new PushRestResponseBO();
            let err_msg = MainConst.ErrorCode.getErrCode(MainConst.ErrorCode.MPNG000.err_code);

            responseMessage.status = MainConst.StatusConstant.STATUS_FAIL; // 0 = success , 1 = fail    
            responseMessage.error_code = err_msg.err_code;
            responseMessage.error_message = "Internal server error. Please try again later. : " + err_msg.err_msg + " : " + JSON.stringify(error);
            responseMessage.response_id = MainConst.genResponseId();

            response.status(500).send(responseMessage);
            next();
        });

        let service_port = Config.getLocal<number>("mpng-service", "service-port", 3000);
        server = app.listen(service_port,
            () => {
                Logger.info("Server start on port ", service_port);

                return resolve(this);            
            });
    });
   

}).then(() => {

    broker.willReceiveMessage();
    /*
    amqpConn.createChannel(function(err :any, ch: any) {
                        let q = Config.get<string>(
                            "push-notification-service",
                            "rabbit-mq.q-online",
                            ""
                        );
                       
                        ch.assertQueue(q, {durable: true});
                        ch.prefetch(1);
                        console.log(" [*] Waiting for messages in %s. To exit press CTRL+C", q);
                        
                        ch.consume(q, function(msg: any) {
                       
                            console.log(" [x] Received %s", msg.content.toString());

                            let req_push: RequestFCMBO = JSON.parse(msg.content.toString());
                    
                            let api_key = Config.get<string>(
                                "push-notification-service",
                                "fcm-service.api-key",
                                ""
                            );

                            let fcm_service : PushFCMService = new PushFCMServiceImpl();
        
                            let mock_req_id = "req4331";

                            fcm_service.send(mock_req_id, api_key, req_push).then(resp_push => {   
                                Logger.info(MainConst.logPattern(mock_req_id, "FCM result : "+JSON.stringify(resp_push)));                         
                                let responseMessage: PushRestResponseBO;
                                let result: ResultBO
                                if ( resp_push.failure == 0 && resp_push.success > 0 ) {
                                    if (resp_push.canonical_ids > 0) {

                                        result = resp_push.results[0] as ResultBO;
                                        
                                    } else {
                                        result = resp_push.results[0] as ResultBO;
                                        
                                    }

                                } else {
                                    result = resp_push.results[0] as ResultBO;
                                   
                                }    

                                //Logger.info(MainConst.logPattern(mock_req_id, "response : "+JSON.stringify(responseMessage)));
                                             
                            }).catch(error => {                        
                                //let responseMessage = createResponseError(MainConst.ErrorCode.MPNG001.err_code, error.toString()) as PushRestResponseBO;
                               // Logger.info(MainConst.logPattern(mock_req_id, "response : "+JSON.stringify(responseMessage)));
                                         
                            });
                            


                            ch.ack(msg);
                        
                        }, {noAck: false});
                        
                    }); 
                    */

}).catch(error => {
    Logger.error(`DBError: ${error}`);
});


