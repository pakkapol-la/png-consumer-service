
export class StatusConstant { 
    public static STATUS_SUCCESS: string = "0"; // 0 = success , 1 = fail 
    public static STATUS_FAIL: string = "1";
}  


export class PlatformConstant { 
    public static ANDROID: string = "ANDROID"; 
    public static IOS: string = "IOS";
}  


export class ErrorMsg {   
    constructor(err_code: string, err_msg: string) {
        this.err_code = err_code;
        this.err_msg = err_msg;
    }
    err_code: string;
    err_msg: string;
} 


export class ErrorCode {      
    public static error_code_map: {[key: string]: ErrorMsg};    
       
    public static MPNG000: ErrorMsg = new ErrorMsg("MPNG000","Unidentified error"); 
    public static MPNG001: ErrorMsg = new ErrorMsg("MPNG001","Processing error");    
    public static MPNG002: ErrorMsg = new ErrorMsg("MPNG002","parameter is required");
    public static MPNG003: ErrorMsg = new ErrorMsg("MPNG003","invalid platform");
    public static MPNG004: ErrorMsg = new ErrorMsg("MPNG004","invalid appID");
    public static MPNG005: ErrorMsg = new ErrorMsg("MPNG005","data_push object is required");
    public static MPNG006: ErrorMsg = new ErrorMsg("MPNG006","push provider error");
    public static MPNG007: ErrorMsg = new ErrorMsg("MPNG007","con not find push token");

    public static getErrCode(err_code: string): ErrorMsg {
        if (null == ErrorCode.error_code_map) {
            ErrorCode.error_code_map = {};
            ErrorCode.error_code_map[ErrorCode.MPNG000.err_code] = ErrorCode.MPNG000;
            ErrorCode.error_code_map[ErrorCode.MPNG001.err_code] = ErrorCode.MPNG001;
            ErrorCode.error_code_map[ErrorCode.MPNG002.err_code] = ErrorCode.MPNG002;
            ErrorCode.error_code_map[ErrorCode.MPNG003.err_code] = ErrorCode.MPNG003;
            ErrorCode.error_code_map[ErrorCode.MPNG004.err_code] = ErrorCode.MPNG004;
            ErrorCode.error_code_map[ErrorCode.MPNG005.err_code] = ErrorCode.MPNG005;
            ErrorCode.error_code_map[ErrorCode.MPNG006.err_code] = ErrorCode.MPNG006;
            ErrorCode.error_code_map[ErrorCode.MPNG007.err_code] = ErrorCode.MPNG007;
        }
        return ErrorCode.error_code_map[err_code];
    }
} 


export function genResponseId(process_is: string): string {
    let dt = new Date();

    return process_is + "-" + dt.getFullYear().toString() + (dt.getMonth() + 1).toString() + dt.getDate() + dt.getHours() + dt.getMinutes() + dt.getSeconds() + dt.getMilliseconds();
}

/*
export function logPattern(request_id: string, msg: string): string {
    return "request_id="+request_id+", "+msg;
}
*/

export function logPattern(request_id: string, process_id: number, msg: string): string {
    return "request_id=" + request_id + ",process_id=" + process_id + "," + msg;
}

export function logPatternProcessId(process_id: number, msg: string): string {
    return "process_id=" + process_id + "," + msg;
}
