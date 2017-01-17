import { RequestFCMBO } from "../../bo/fcm/requestfcmbo";
import { ResponseFCMBO } from "../../bo/fcm/responsefcmbo";
import { PushFCMService } from "../pushfcm-service";
import Request from "../../common/request";
import Config from "../../common/config";
import Logger from "../../common/logger";
import * as _ from "lodash";
import * as MainConst from "../../common/mainconstant";

export class PushFCMServiceImpl implements PushFCMService {

    createRequestHeader(api_key: string): any{
        let header = {
                'Content-Type': 'application/json', //; charset=utf-8
                'Authorization': 'key=' + api_key
            };
        return header;   
    }

    send(request_id: string, api_key: string, req: RequestFCMBO): Promise<ResponseFCMBO>{
        
        return new Promise<ResponseFCMBO>((resolve, reject) => {
            
            let push_url = Config.get<string>(
                    "push-notification-service",
                    "fcm-service.url-push",
                    ""
                );
            
            //Logger.info(MainConst.logPattern(request_id, process.pid, "FCM Push : " + push_url));            
            let headers = this.createRequestHeader(api_key);
            //Logger.info(MainConst.logPattern(request_id, process.pid, "FCM Header : " + JSON.stringify(headers)));
           
            let payload = JSON.stringify(req);

            //Logger.info(MainConst.logPattern(request_id, process.pid, "FCM Payload : " + payload));
           
            Request(push_url)
                .identifier("fcm-push")
                .post(payload, headers)
                .then(data => {
                    //Logger.info(MainConst.logPattern(request_id, "data : " + JSON.stringify(data)));
                    
                    // Handle response
                    try {
                        let output = this.handlePushResponse(request_id, data);
                        //Logger.info(MainConst.logPattern(request_id, "output : " + JSON.stringify(output));
                        return resolve(output);
                    } catch (error) {
                        return reject(error);
                    }
                })
                .catch(error => {
                    return reject(error);
                });
        });
    }


    private handlePushResponse(request_id: string, response: any) :ResponseFCMBO{
        
        if (response.statusCode) {
            if (response.statusCode === 200) {                               
                if (response.body) {
                    let jsonBody = JSON.parse(response.body) as ResponseFCMBO;
                    Logger.info(MainConst.logPattern(request_id, process.pid, "response : status_code=" + response.statusCode+", FCM result="+JSON.stringify(jsonBody)));
                    return jsonBody;
                    /*
                    Logger.info("jsonBody.success : " + jsonBody.success);
                    if (jsonBody.success) {
                        return jsonBody;
                    } else {
                        Logger.info(
                            `jsonBody.errorCode : ${jsonBody.errorCode}`
                        );
                        if (!jsonBody.errorCode) {
                            throw new Error(
                                jsonBody.errorCode + ", " +
                                jsonBody.errorMessage
                            );
                        }
                    }
                    */

                }
            } else {
                throw new Error(
                    response.statusCode + ", " +
                    response.statusMessage
                );
            }
        }

        throw new Error(
            "E:0000" + ", " + "Invalid response"
        );
    }

}

export default PushFCMServiceImpl;