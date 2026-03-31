import { Request } from "express";
import argon2 from "argon2";
import jwt from "jsonwebtoken";
import type { JwtPayload } from "jsonwebtoken";
import { UnauthorizedError } from "./errors.js";
import crypto from "node:crypto";

export function hashPassword(password: string) {
    return argon2.hash(password);
}

export async function checkPasswordHash(passwordHash: string, password: string) {
    console.log("Checking password");
    return await argon2.verify(passwordHash, password);
}

export function makeJWT(userID: string, expiresIn: number, secret: string): string {
    let issuedAt = Math.floor(Date.now() / 1000);
    let payload: Pick<JwtPayload, "iss" | "sub" | "iat" | "exp"> = {
        iss: "chirpy",
        sub: userID,
        iat: issuedAt,
        exp: issuedAt + expiresIn,
    }
    return jwt.sign(payload, secret);
}

export function validateJWT(tokenString: string, secret: string): string {
    try {
        let payload = jwt.verify(tokenString, secret);
        if (typeof payload.sub === "string") {
            return payload.sub;
        }
    } catch (e) {
        if (!(e instanceof jwt.JsonWebTokenError)) {
            throw e;
        }
    }
    throw new UnauthorizedError("Invalid token");
}


export function getBearerToken(req: Request): string {
    let auth = req.get("Authorization");
    if (auth !== undefined) {
        return extractBearerToken(auth);
    }
    throw new UnauthorizedError("Unauthorized");
}

export function extractBearerToken(bearer: string): string {
    let parts = bearer.match(/^(\w+)\s+(.*$)/);
    if (parts !== null && parts.length > 2 && parts[1].toLowerCase() == "bearer") {
        return parts[2].trim();
    }
    throw new UnauthorizedError("Unauthorized");
}

export function makeRefreshToken() {
    let bytes = crypto.randomBytes(32);
    let token = bytes.toString("hex");
    return token;
}
