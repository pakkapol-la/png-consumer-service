import * as express from "express";
import * as _ from "lodash";

export function JSONRequest<T>(request: express.Request): T {
    let json_request = request.params;
    _.assign(json_request, request.query || {}, request.body || {});
    return json_request;
}

enum ExpectationStatus {
    FIELD_REQUIRED,
    INVALID_SIZE,
    INVALID_FORMAT,
    INVALID_TYPE,
    OK
}

function isValidFormat(value: any, format: any){
    return (
        typeof(format) === "string" &&
        typeof(value) === "string" &&
        new RegExp(format, "g").test(value)
    );
}

function isValidType(
    value: any, schema: any
): {
    status: ExpectationStatus;
    sourceStatus?: ExpectationStatus;
    message?: string;
} {
    if(schema.hasOwnProperty("type") && Array.isArray(schema.type)){
        // Multiple types
        let firstError = undefined;
        for(let type of schema.type){
            let typeStatus = isValidType(value, {
                type: type
            });
            if(typeStatus.status === ExpectationStatus.OK){
                return typeStatus;
            }else if(
                !firstError && typeStatus.sourceStatus === ExpectationStatus.OK
            ){
                firstError = typeStatus;
            }
        }
        if(firstError){
            return firstError;
        }
        return {
            status: ExpectationStatus.INVALID_TYPE,
            sourceStatus: ExpectationStatus.INVALID_TYPE,
            message: (
                schema.hasOwnProperty("mismatch") ?
                schema.mismatch :
                "Some requested fields are not in a valid type"
            )
        };
    }else if(
        schema.hasOwnProperty("collection") &&
        (
            Array.isArray(schema.collection) ||
            typeof(schema.collection) !== "object"
        )
    ){
        // Array type
        if(!Array.isArray(value)){
            return {
                status: ExpectationStatus.INVALID_TYPE,
                sourceStatus: ExpectationStatus.INVALID_TYPE,
                message: (
                    schema.hasOwnProperty("mismatch") ?
                    schema.mismatch :
                    "Some requested fields are not in a valid type"
                )
            }
        }
        let types = schema.collection;
        if(!Array.isArray(types)){
            types = [types];
        }
        if(schema.hasOwnProperty("collection_size")){
            let sizes = schema.collection_size;
            if(!Array.isArray(sizes)){
                sizes = [sizes];
            }
            if(!(sizes as any[]).some(size => {
                if(typeof(size) === "number"){
                    return value.length === size;
                }else if(typeof(size) !== "string"){
                    return false;
                }
                let matches = size.match(
                    "^(([\\(\\[])(\\d+)?:(\\d+)?([\\]\\)])|" +
                    "[\\[\\(]?(\\d+)[\\]\\)]?)$"
                );
                if(!matches){
                    return false;
                }
                if(matches[6] !== undefined){
                    return value.length === parseInt(matches[6]);
                }
                let leftInclusive = matches[2] === "[";
                let rightInclusive = matches[5] === "]";
                let inRange = true;
                if(
                    matches[3] !== undefined
                ){
                    inRange = inRange && value.length > parseInt(matches[3]) - (
                        leftInclusive ? 1 : 0
                    );
                }
                if(
                    matches[4] !== undefined
                ){
                    inRange = inRange && value.length < parseInt(matches[4]) + (
                        rightInclusive ? 1 : 0
                    );
                }

                return inRange;
            })){
                return {
                    status: ExpectationStatus.INVALID_SIZE,
                    sourceStatus: ExpectationStatus.INVALID_SIZE,
                    message: (
                        schema.hasOwnProperty("collection_mismatch") ?
                        schema.collection_mismatch :
                        "Some collections are not in a valid size"
                    )
                }
            }
        }
        for(let element of value){
            let formatStatus = isValidType(element, {
                type: types,
                mismatch: (
                    schema.hasOwnProperty("element_mismatch") ?
                    schema.element_mismatch :
                    "Some collection elements are not in a valid type or format"
                )
            });
            if(formatStatus.status !== ExpectationStatus.OK){
                return formatStatus;
            }
        }
    }else if(
        schema.hasOwnProperty("type") &&
        !Array.isArray(value) &&
        typeof(schema.type) === "object" && typeof(value) === "object"
    ){
        // Object type
        return isValidObject(value, schema.type);
    }else if(
        schema.hasOwnProperty("type") &&
        typeof(schema.type) !== typeof(value) ||
        (!Array.isArray(schema.type) && Array.isArray(value))
    ){
        // Primitive type
        return {
            status: ExpectationStatus.INVALID_TYPE,
            sourceStatus: ExpectationStatus.INVALID_TYPE,
            message: (
                schema.hasOwnProperty("mismatch") ?
                schema.mismatch :
                "Some requested fields are not in a valid type"
            )
        }
    }else if(
        schema.hasOwnProperty("type") &&
        typeof(schema.type) === "string" && !isValidFormat(value, schema.type)
    ){
        // String type
        return {
            status: ExpectationStatus.INVALID_FORMAT,
            sourceStatus: ExpectationStatus.INVALID_FORMAT,
            message: (
                schema.hasOwnProperty("invalid") ?
                schema.invalid :
                "Some requested fields are not in a valid format"
            )
        }
    }
    return {
        status: ExpectationStatus.OK,
        sourceStatus: ExpectationStatus.OK
    }
}

function isValidObject(
    requestBody: any, expect: any
): {
    status: ExpectationStatus;
    sourceStatus?: ExpectationStatus;
    message?: string;
} {
    for(let key in expect){
        let schema = expect[key];

        if(!requestBody.hasOwnProperty(key)){
            if(!schema.hasOwnProperty("required")){
                continue;
            }
            return {
                status: ExpectationStatus.FIELD_REQUIRED,
                sourceStatus: ExpectationStatus.FIELD_REQUIRED,
                message: schema.required
            };
        }
        if(
            !schema.hasOwnProperty("type") &&
            !schema.hasOwnProperty("collection")
        ){
            continue;
        }

        let typeStatus = isValidType(requestBody[key], schema);
        if(typeStatus.status !== ExpectationStatus.OK){
            return {
                status: typeStatus.status,
                message: typeStatus.message,
                sourceStatus: ExpectationStatus.OK
            }
        }
    }

    return {
        status: ExpectationStatus.OK,
        sourceStatus: ExpectationStatus.OK,
    }
}

export function expect(expect: any = null){
    return (
        req: express.Request, res: express.Response,
        next: express.NextFunction
    ) => {
        expect = expect || {};

        let requestBody: any = JSONRequest(req);

        let expectStatus = isValidObject(requestBody, expect);

        if(expectStatus.status !== ExpectationStatus.OK){
            res.status(
                expectStatus.status === ExpectationStatus.INVALID_TYPE ?
                406 : 400
            ).json({
                message: expectStatus.message
            });
            return;
        }

        next();
    };
}
