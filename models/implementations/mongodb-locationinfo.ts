import * as mongoose from "mongoose";
import LocationInfo from "../locationinfo";
// Expose "LocationInfo" interface to the database implementation
export {LocationInfo as LocationInfo};

interface MongoLocationInfo extends LocationInfo, mongoose.Document {}

const LocationInfoSchema = new mongoose.Schema({
    branch_name: {
        type: String,
        required: false
    },
    address: {
        type: String,
        required: false
    },
    province: {
        type: String,
        required: false
    },
    postcode: {
        type: String,
        required: false
    },
    phone: {
        type: String,
        required: false
    },
    location: {
        type: [Number],
        required: false
    }
});

export const LocationInfoModel = mongoose.model<MongoLocationInfo>("LocationInfo", LocationInfoSchema, "gsb_branch");

export default LocationInfoModel;
