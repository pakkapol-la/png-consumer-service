import Config from "../config";

describe("Config", () => {

    // MARK: Local scope tests

    it("should return local scope configuration", () => {
        expect(
            Config.get<number>("service-name", "settings.number", 0)
        ).toBe(
            43.21
        );

        expect(
            Config.getLocal<number[]>("service-name", "shared.list", [])
        ).toEqual(
            [9, 8, 7]
        );

        expect(
            Config.getLocal<number[]>("service-name", "settings.list", [])
        ).toEqual(
            ["A", "B", "C"]
        );

        expect(
            Config.get<string>("service-name", "local-text", "")
        ).toBe(
            "Bleh"
        );

        expect(
            Config.get<string>("service-name", "local-scope.text", "")
        ).toBe(
            "olleH"
        );

        expect(
            Config.getLocal<string>("service-name", "local-scope.text", "")
        ).toBe(
            "olleH"
        );
    });

    // MARK: Global scope tests

    it("should return global scope configuration", () => {
        expect(
            Config.get<string>("service-name", "shared.text", "")
        ).toBe(
            "Blah blah"
        );

        expect(
            Config.getGlobal<string>("shared.text", "")
        ).toBe(
            "Blah blah"
        );

        expect(
            Config.getGlobal<number>("settings.number", 0)
        ).toBe(
            12.34
        );

        expect(
            Config.get<boolean>("service-name", "global-boolean", false)
        ).toBe(
            true
        );

        expect(
            Config.get<string>("service-name", "global-scope.text", "")
        ).toBe(
            "Hello"
        );

        expect(
            Config.getGlobal<string>("global-scope.text", "")
        ).toBe(
            "Hello"
        );
    });

    it("should return existant of the configuration", () => {
        expect(
            Config.has("global-boolean")
        ).toBe(
            true
        );

        expect(
            Config.has("global-scope")
        ).toBe(
            true
        );

        expect(
            Config.has("local-text")
        ).toBe(
            false
        );

        expect(
            Config.has("local-scope")
        ).toBe(
            false
        );
    });

    // MARK: Default value tests

    it("should return default value", () => {
        expect(
            Config.get<number>("service-name", "settings.number", 5)
        ).toBe(
            43.21
        );
    });

    // MARK: Environment variable tests

    it("should return environment variable value", () => {
        expect(
            Config.env("NODE_ENV")
        ).toBe(
            "test"
        );
    });
});
