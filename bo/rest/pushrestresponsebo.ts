import { BaseRestBO } from "./baserestbo";

export class PushRestResponseBO extends BaseRestBO {  
    status: string; // 0 = success , 1 = fail
	error_code: string;
	error_message: string;
	response_id: string;
}

export default PushRestResponseBO;