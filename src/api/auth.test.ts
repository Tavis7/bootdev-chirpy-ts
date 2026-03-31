import { describe, it, expect, beforeAll, beforeEach, afterEach, vi } from "vitest";
import { makeJWT, validateJWT, extractBearerToken } from "./auth.js";
import { hashPassword, checkPasswordHash } from "./auth.js";

describe("Password hashing", () => {
    const password1 = "correctPassword123!";
    const password2 = "anotherPassword456!";

    let hash1: string;

    beforeAll(async () => {
        hash1 = await hashPassword(password1);
    });

    it("should return true for the correct password", async () => {
        const result = await checkPasswordHash(hash1, password1);
        expect(result).toBe(true);
    });
    it("should return false for the incorrect password", async () => {
        const result = await checkPasswordHash(hash1, password2);
        expect(result).toBe(false);
    });
});

async function timer(seconds: number) {
    return new Promise((resolve) => {
        setTimeout(() => {resolve("");}, seconds);
    });
}

describe("JWT verification", () => {
    let token1:string;
    const secret1 = "a secret";
    const secret2 = "another secret";

    beforeEach(async () => {
        vi.useFakeTimers();
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    beforeAll(async () => {
        token1 = makeJWT("user_1", 5 * 60, secret1);
    });

    it("should be valid", () => {
        let user = validateJWT(token1, secret1);
        expect(user).toBe("user_1");
    });

    it("should be invalid", () => {
        expect(() => validateJWT(token1, secret2)).toThrowError();
    });

    it("should not be expired", async () => {
        let p = timer(1000 * 4 * 60);
        vi.runAllTimers();
        await p;
        let user = validateJWT(token1, secret1);
        expect(user).toBe("user_1");
    });

    it("should be expired", async () => {
        let p = timer(1000 * 60 + 1);
        vi.runAllTimers();
        await p;
        expect(() => validateJWT(token1, secret1)).toThrowError();
    });

    it("should be invalid", async () => {
        expect(() => validateJWT("", secret1)).toThrowError();
    });
});

describe("Bearer token", () => {
    let token = "abc";
    it("should get token", () => {
        let extracted = extractBearerToken(`Bearer ${token}`);
        expect(extracted).toBe(token);
    });

    it("should not get token", () => {
        expect(() => extractBearerToken(`foobar ${token}`)).toThrowError();
    });

    it("should get token", () => {
        let extracted = extractBearerToken(`bearer ${token}`);
        expect(extracted).toBe(token);
    });
});
