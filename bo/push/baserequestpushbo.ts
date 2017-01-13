export class BaseRequestPushBO {
    
    app_id: string;
    title?: string;
    body_msg: string;
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

export default BaseRequestPushBO;


	