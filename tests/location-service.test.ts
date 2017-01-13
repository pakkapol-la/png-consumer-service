import * as supertest from "supertest";
import * as App from "../app"
import * as test from "chai"
import Config from "../common/config";

describe("Location-services testcase", () => {
    /*
     *
     */
    it("Invalid URL", () => {
        return supertest(App.app)
            .get("/atminfo/location_INVALID_")
            .query({
                "req_id": "1234567890",
                "lat": "13.7539833",
                "lng" : "100.6567808",
                "distance" : "0.025"
            })
            .expect(function(res: any) {
                test.expect(res.statusCode).to.equal(404);
            });
    });

    it("Valid URL", () => {
        return supertest(App.app)
            .get("/atminfo/location")
            .query({
                "req_id": "1234567890",
                "lat": "13.7539833",
                "lng" : "100.6567808",
                "distance" : "0.025"
            })
            .expect(function(res: any) {
                test.expect(res.statusCode).to.equal(200);
                test.expect(res.body.status).to.equal("0");
            });
    });


    // it("Valid URL with far location", () => {
    //     return supertest(App.app)
    //         .get("/atminfo/location")
    //         .query({
    //             "req_id": "1234567890",
    //             "lat": "-0.7539833",
    //             "lng" : "-0.6567808",
    //             "distance" : "0.025"
    //         })
    //         .expect(function(res: any) {
    //             test.expect(res.statusCode).to.equal(200);
    //             test.expect(res.body.status).to.equal("0");
    //         });
    // });

    // it("Valid URL with zero distance", () => {
    //     return supertest(App.app)
    //         .get("/atminfo/location")
    //         .query({
    //             "req_id": "1234567890",
    //             "lat": "13.7539833",
    //             "lng" : "100.6567808",
    //             "distance" : "0.0"
    //         })
    //         .expect(function(res: any) {
    //             test.expect(res.statusCode).to.equal(200);
    //             test.expect(res.body.status).to.equal("0");
    //         });
    // });

    // it("Valid URL with integer location and distance", () => {
    //     return supertest(App.app)
    //         .get("/atminfo/location")
    //         .query({
    //             "req_id": "1234567890",
    //             "lat": "14",
    //             "lng" : "101",
    //             "distance" : "1"
    //         })
    //         .expect(function(res: any) {
    //             test.expect(res.statusCode).to.equal(200);
    //             test.expect(res.body.status).to.equal("0");
    //         });
    // });

    // // it("Valid URL with number parameters", () => {
    // //     return supertest(App.app)
    // //         .get("/atminfo/location")
    // //         .query({
    // //             "req_id": "1234567890",
    // //             "lat": "14",
    // //             "lng" : "101",
    // //             "distance" : "1"
    // //         })
    // //         .expect(function(res: any) {
    // //             test.expect(res.statusCode).to.equal(200);
    // //             test.expect(res.body.status).to.equal("0");
    // //         });
    // // });

    // /*
    //  *
    //  */
    // it("Missing of latitude parameter", () => {
    //     return supertest(App.app)
    //         .get("/atminfo/location")
    //         .query({
    //             "req_id": "1234567890",
    //             "lng" : "100.6567808",
    //             "distance" : "0.025"
    //         })
    //         .expect(function(res: any) {
    //             test.expect(res.statusCode).to.equal(400);
    //             test.expect(res.body.message).to.equal("Latitude is required");
    //         });
    // });

    // it("Invalid type of latitude parameter", () => {
    //     return supertest(App.app)
    //         .get("/atminfo/location")
    //         .query({
    //             "req_id": "1234567890",
    //             "lat": "13.7539xxx833",
    //             "lng" : "100.6567808",
    //             "distance" : "0.025"
    //         })
    //         .expect(function(res: any) {
    //             test.expect(res.statusCode).to.equal(400);
    //             test.expect(res.body.message).to.equal("Latitude is invalid");
    //         });
    // });

    // /*
    //  *
    //  */
    // it("Missing of longitude parameter", () => {
    //     return supertest(App.app)
    //         .get("/atminfo/location")
    //         .query({
    //             "req_id": "1234567890",
    //             "lat": "13.7539833",
    //             "distance" : "0.025"
    //         })
    //         .expect(function(res: any) {
    //             test.expect(res.statusCode).to.equal(400);
    //             test.expect(res.body.message).to.equal("Longitude is required");
    //         });
    // });

    // it("Invalid type of longitude parameter", () => {
    //     return supertest(App.app)
    //         .get("/atminfo/location")
    //         .query({
    //             "req_id": "1234567890",
    //             "lat": "13.7539833",
    //             "lng" : "100.656xxx7808",
    //             "distance" : "0.025"
    //         })
    //         .expect(function(res: any) {
    //             test.expect(res.statusCode).to.equal(400);
    //             test.expect(res.body.message).to.equal("Longitude is invalid");
    //         });
    // });

    // /*
    //  *
    //  */
    // it("Missing of distance parameter", () => {
    //     return supertest(App.app)
    //         .get("/atminfo/location")
    //         .query({
    //             "req_id": "1234567890",
    //             "lat": "13.7539833",
    //             "lng" : "100.6567808"
    //         })
    //         .expect(function(res: any) {
    //             //test.expect(res.statusCode).to.equal(400);
    //             test.expect(res.body.message).to.equal("Distance is required");
    //         });
    // });

    // it("Invalid of distance parameter", () => {
    //     return supertest(App.app)
    //         .get("/atminfo/location")
    //         .query({
    //             "req_id": "1234567890",
    //             "lat": "13.7539833",
    //             "lng" : "100.6567808",
    //             "distance" : "0.0xxx25"
    //         })
    //         .expect(function(res: any) {
    //             //test.expect(res.statusCode).to.equal(400);
    //             test.expect(res.body.message).to.equal("Distance is invalid");
    //         });
    // });





});

afterAll(()=>{
    App.server.close();
    App.database.disconnect();
});
