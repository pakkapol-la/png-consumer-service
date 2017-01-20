import * as mongoose from "mongoose";
import PushMessages from "../pushmessages";
// Expose "LocationInfo" interface to the database implementation
export {PushMessages as PushMessages};

interface MongoPushMessages extends PushMessages, mongoose.Document {}

const PushMessagesSchema = new mongoose.Schema({
    request_id: {
        type: String,
        required: false
    },
    application_id: {
        type: String,
        required: false
    },
    user_id: {
        type: String,
        required: false
    },
    interface_type: {
        type: String,
        required: false
    },
    message_type: {
        type: Number,
        required: false
    },
    worker_id: {
        type: String,
        required: false
    },
    push_provider_code: {
        type: String,
        required: false
    },
    started_time: {
        type: Date,
        required: false
    },
    put_time: {
        type: Date,
        required: false
    },
    pulled_time: {
        type: Date,
        required: false
    },
    sent_time: {
        type: Date,
        required: false
    },
    received_time: {
        type: Date,
        required: false
    },
    elapsed: {
        type: Number,
        required: false
    },
    status: {
        type: Number,
        required: false
    },
    error_code: {
        type: String,
        required: false
    },
    error_message: {
        type: String,
        required: false
    },
     push_token_id: {
        type: String,
        required: false
    },
     push_message: {
        type: Object,
        required: false
    } 

});

export const PushMessagesModel = mongoose.model<MongoPushMessages>("PNG", PushMessagesSchema, "pushmessages");

export default PushMessagesModel;
