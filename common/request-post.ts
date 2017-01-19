import * as request from "request";

class RequestPost {

     private url: string;

     constructor(url: string) {        
        this.url = url;       
    }

     private send(header?: {[key: string]: string}, payload?: any): Promise<any> {

        return new Promise<any>((resolve, reject) => {

            let options: any;

            if (header) {
                options = {  
                    url: this.url,
                    method: 'POST',
                    headers: header,
                    body: payload
                };
            } else {
                options = {  
                    url: this.url,
                    method: 'POST',                    
                    body: payload
                };
            }
                
            request(options, function(err: any, response: any, body: any) {                 
                if(err){
                    return reject(err);
                }  

                return resolve({
                    statusCode: response.statusCode,
                    statusMessage: response.statusMessage,
                    headers: response.headers,
                    body: body
                });
                
            });

            
        });    
        
    }

    sendPost(header?: {[key: string]: string}, payload?: any): Promise<any> {

        return this.send(header, payload);   
        
    }

}  

function StaticRequest(uri: string){
    return new RequestPost(uri);
}

export default StaticRequest;  