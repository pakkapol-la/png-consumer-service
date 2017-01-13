import LocationInfo from "../models/locationinfo";

interface Database {
    connect(url: string, options?: any): Promise<Database>;
    disconnect(): Promise<void>;
    getAtmLocation(lat: string, lng: string, distance: string) : Promise<LocationInfo[]>;
}

export default Database;
