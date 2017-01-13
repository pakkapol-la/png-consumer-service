import { BaseRestBO } from "./baserestbo";

export class BaseRespBO extends BaseRestBO {   
   
    status: string; // 0 = success , 1 = fail
	error_code: string;
	error_message: string;
	response_id: string;
}

export default BaseRespBO;