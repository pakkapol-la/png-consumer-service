import * as winston from "winston";
import * as moment from "moment-timezone";
import * as os from "os";

let transports = [
    new winston.transports.Console({
        colorize: true,
        timestamp: function(){
            return moment.tz(
                Date.now(), "Asia/Bangkok"
            ).format(
                "YYYY-MM-DDTHH:mm:ss.SSS"
            );
        },
        formatter: function(options: any){
            return `${options.timestamp()} ${options.level.toUpperCase()} ${options.message || ""}`;
        }
    }),
    new (require("winston-daily-rotate-file"))({
        filename: "logs/"+os.hostname()+"-app.log",
        localTime: true,
        json: false,
        datePattern: ".yyyy-MM-dd",
        timestamp: function(){
            return moment.tz(
                Date.now(), "Asia/Bangkok"
            ).format(
                "YYYY-MM-DDTHH:mm:ss.SSS"
            );
        },
        formatter: function(options: any){
            return `${options.timestamp()} ${options.level.toUpperCase()} ${options.message || ""}`;
        }
    })
];

if (process.env["NODE_ENV"] === "test") {
    transports = [];
}

export default new winston.Logger({
    transports: transports
});
