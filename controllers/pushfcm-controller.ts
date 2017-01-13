import Config from "../common/config";
import * as express from "express";
import * as uuid from "uuid";
import { JSONRequest } from "../common/middlewares/json";
import Request from "../common/request";
//import * as App from "../app";
import Logger from "../common/logger";

import * as MainConst from "../common/mainconstant";
import { PushRestRequestBO } from "../bo/rest/pushrestrequestbo";
import { ParamPushBO } from "../bo/push/parampushbo";
import { PushRestResponseBO } from "../bo/rest/pushrestresponsebo";
import { PushFCMService } from "../adapters/pushfcm-service";
import { PushFCMServiceImpl } from "../adapters/implementations/pushfcm-serviceimpl";
import { RequestFCMBO } from "../bo/fcm/requestfcmbo";
import { ResponseFCMBO } from "../bo/fcm/responsefcmbo";
import { ResultBO } from "../bo/fcm/result";
import { NotificationBO } from "../bo/fcm/notificationbo";

export default class PushFCMController {

    delay = 10;

    do = {
        //require: [],
        require: ["db"],
        expectation: {
            "request_id": {
                "type": "^[0-9a-zA-Z\-]+$",
                "mismatch": (
                    "request id must be a string or number"
                ),
                "invalid": "request id is invalid",
                "required": "request id is required"
            }/*
            "app_id": {
                "type": "^[0-9a-zA-Z\-]+$",
                "mismatch": (
                    "app id must be a string or number"
                ),
                "invalid": "app id is invalid",
                "required": "app id is required"
            },
            "body_msg": {
                "type": "^[0-9a-zA-Z\-\\]+$",
                "mismatch": (
                    "body msg must be a string or number"
                ),
                "invalid": "body msg is invalid",
                "required": "body msg is required"
            }*/
        },
        action: (request: express.Request, response: express.Response) => {
            
            try {
                response.header("Content-Type", "application/json; charset=utf-8");
                let jsonRequest = JSONRequest<PushRestRequestBO>(request);
                Logger.info(MainConst.logPattern(jsonRequest.request_id, "request : "+JSON.stringify(jsonRequest)));

                if (validateParam(request, response)) {
                                    
                    //will check platform android by app_id , ios for set some field special for each platform
                    // and get server key depend by app_id ,  get token by user_id , cif, citizen_id
                    let req_push: RequestFCMBO = preparePushMsg(jsonRequest);
                    
                    let api_key = Config.get<string>(
                            "push-notification-service",
                            "fcm-service.api-key",
                            ""
                        );
                    
                    let fcm_service : PushFCMService = new PushFCMServiceImpl();
        
                    fcm_service.send(jsonRequest.request_id, api_key, req_push).then(resp_push => {   
                        Logger.info(MainConst.logPattern(jsonRequest.request_id, "FCM result : "+JSON.stringify(resp_push)));                         
                        let responseMessage: PushRestResponseBO;
                        let result: ResultBO
                        if ( resp_push.failure == 0 && resp_push.success > 0 ) {
                            if (resp_push.canonical_ids > 0) {

                                result = resp_push.results[0] as ResultBO;
                                responseMessage = createResponseSuccess(result.message_id);

                                //updateSucessMPNGLogAndToken(this.transID, result, respPush);
                            } else {
                                result = resp_push.results[0] as ResultBO;
                                responseMessage = createResponseSuccess(result.message_id);
                                //updateSucessMPNGLog(this.transID, result, respPush);
                            }

                        } else {
                            result = resp_push.results[0] as ResultBO;
                            responseMessage = createResponseSuccess(result.message_id);
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

                        Logger.info(MainConst.logPattern(jsonRequest.request_id, "response : "+JSON.stringify(responseMessage)));
                        response.send(JSON.stringify(responseMessage));                  
                    }).catch(error => {                        
                        let responseMessage = createResponseError(MainConst.ErrorCode.MPNG001.err_code, error.toString()) as PushRestResponseBO;
                        Logger.info(MainConst.logPattern(jsonRequest.request_id, "response : "+JSON.stringify(responseMessage)));
                        response.send(JSON.stringify(responseMessage));           
                    });

                }
            } catch(err) {
                 throw err;
            }

        }
    };
};


function preparePushMsg(rest_req: PushRestRequestBO): RequestFCMBO {

    let data_push: ParamPushBO = rest_req.data_push;
    let req_push = new RequestFCMBO();
    let platform: string = "";
    //this section is mock
    if (data_push.app_id) {
        if ("gap" == data_push.app_id) {
            req_push.to = Config.get<string>(
                "mock-app-id-set",
                "gap.token",
                ""
            );
            platform = Config.get<string>(
                "mock-app-id-set",
                "gap.platform",
                ""
            );
        } else if ("rit" == data_push.app_id) {
            req_push.to = Config.get<string>(
                "mock-app-id-set",
                "rit.token",
                ""
            );
            platform = Config.get<string>(
                "mock-app-id-set",
                "rit.platform",
                ""
            );
        } else {
            //mock hard rit token
            req_push.to = "APA91bEK8cIEtia7e_KuM3C04nakPp3OJ6eA4QpItPm08dQbg0dR0H51KIWxs7t7XXC6TphZdBGiAXL95coMonzTJ88EnlDHLYtumrwLJFSW1Lbc5NtosWaCQ_DT6wuosLmAvUmlLe9CJJNoW--weM8jdHh4xcbF2Q";
            platform = MainConst.PlatformConstant.IOS;
        }
    } else {
        //mock hard rit token
        req_push.to = "APA91bEK8cIEtia7e_KuM3C04nakPp3OJ6eA4QpItPm08dQbg0dR0H51KIWxs7t7XXC6TphZdBGiAXL95coMonzTJ88EnlDHLYtumrwLJFSW1Lbc5NtosWaCQ_DT6wuosLmAvUmlLe9CJJNoW--weM8jdHh4xcbF2Q";
        platform = MainConst.PlatformConstant.IOS;
    }
    //end this section is mock
    
    let notification = new NotificationBO();

    if (data_push.title) {
        notification.title = data_push.title;
    }

    let body_msg = data_push.body_msg
    notification.body = body_msg;

    if (data_push.icon) {
        notification.icon = data_push.icon;
    }
    if (data_push.color) {
        notification.color = data_push.color;
    }

    if(platform == MainConst.PlatformConstant.IOS){
        if(data_push.badge){ //for ios
            notification.badge = data_push.badge;
        }
    }

    if (data_push.tag) {
        notification.tag = data_push.tag;
    }
    if (data_push.sound) {
        notification.sound = data_push.sound;
    }
    if (data_push.tag) {
        notification.tag = data_push.tag;
    }

    req_push.notification = notification;

    if (data_push.content_available) {
        req_push.content_available = data_push.content_available;
    } else {
        req_push.content_available = true;
    }

    if (data_push.collapse_key) {
        req_push.collapse_key = data_push.collapse_key;
    }
    if (data_push.collapse_key) {
        req_push.collapse_key = data_push.collapse_key;
    }
    if (data_push.priority && RequestFCMBO.PRIORITY_HIGH == data_push.priority) {
        req_push.priority = RequestFCMBO.PRIORITY_HIGH;
    } else {
        req_push.priority = RequestFCMBO.PRIORITY_NORMAL;
    }

    req_push.delay_while_idle = true;

    if (data_push.time_to_live) {
        req_push.time_to_live = data_push.time_to_live;
    }

    let dataPayload: {[key: string]: string} = {};
    if (data_push.data) {
        dataPayload = data_push.data;
    }
    dataPayload[RequestFCMBO.DATA_PAYLOAD_KEY_MESSAGE] = body_msg;

    req_push.data = dataPayload;

    return req_push;
}


function createResponseSuccess(message_id: string): PushRestResponseBO {
    let responseMessage = new PushRestResponseBO();    
    
    responseMessage.status = MainConst.StatusConstant.STATUS_SUCCESS; // 0 = success , 1 = fail    
    responseMessage.response_id = message_id;

    return responseMessage;
}


function createResponseError(error_code: string, ext_msg?: string): PushRestResponseBO {
    let responseMessage = new PushRestResponseBO();    
    let err_msg = MainConst.ErrorCode.getErrCode(error_code);

    responseMessage.status = MainConst.StatusConstant.STATUS_FAIL; // 0 = success , 1 = fail    
    responseMessage.error_code = err_msg.err_code;
    responseMessage.error_message = err_msg.err_msg;
    if (ext_msg) {
        responseMessage.error_message = responseMessage.error_message + " : " + ext_msg;
    }
    responseMessage.response_id = MainConst.genResponseId();
    //ref_id: uuid.v4(),
    return responseMessage;
}


function validateParam(request: express.Request, response: express.Response): boolean {
    let jsonRequest = JSONRequest<PushRestRequestBO>(request);
    let responseMessage = new PushRestResponseBO();
    let is_false: boolean = false;

    if (jsonRequest.data_push) {
        let data_push: ParamPushBO = jsonRequest.data_push;

        if (is_false == false && !data_push.user_id && !data_push.cif && !data_push.citizen_id) {
            responseMessage = createResponseError(MainConst.ErrorCode.MPNG002.err_code, "required 1 parameter in this group [user_id, cif, citizen_id]") as PushRestResponseBO;           
            is_false = true;          
        }

        if (is_false == false && !data_push.app_id) {
            responseMessage = createResponseError(MainConst.ErrorCode.MPNG002.err_code, "app id is required") as PushRestResponseBO;           
            is_false = true;          
        }

        if (is_false == false && !data_push.body_msg) {
            responseMessage = createResponseError(MainConst.ErrorCode.MPNG002.err_code, "body msg is required") as PushRestResponseBO;           
            is_false = true;         
        }

    } else {        
        responseMessage = createResponseError(MainConst.ErrorCode.MPNG005.err_code) as PushRestResponseBO;
        is_false = true;   
    }

    if(is_false == true){
        Logger.info(MainConst.logPattern(jsonRequest.request_id, "response : "+JSON.stringify(responseMessage)));
        response.send(JSON.stringify(responseMessage)); 
        return false;      
    }

    return true;
}