
export class ParamPushBO {  
       
    title?: string;
    body_message: string;
    icon?: string;
    sound?: string;
    badge?: string;   
    tag?: string;
	color?: string;
	collapse_key?: string;
	priority?: string;
	content_available?: boolean;
	time_to_live?: number;
	data?: {[key: string]: string};

}

export default ParamPushBO;