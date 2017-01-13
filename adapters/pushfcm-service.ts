import { RequestFCMBO } from "../bo/fcm/requestfcmbo";
import { ResponseFCMBO } from "../bo/fcm/responsefcmbo";


export interface PushFCMService {

    createRequestHeader(api_key: string): any;

    send(request_id: string, api_key: string, req: RequestFCMBO): Promise<ResponseFCMBO>;

}    

export default PushFCMService;