import { Request, Response, NextFunction } from "express";
import { config } from "../config.js";
import { createUser, getUserByEmail, deleteUsers } from "../db/queries/users.js";
import { createChirp, getChirps, getChirp } from "../db/queries/chirps.js";

import { BadRequestError, UnauthorizedError } from "./errors.js";

export async function handlerReadiness(req: Request, res: Response): Promise<void> {
    res.set("Content-Type", "text/plain");
    res.send("OK");
}

export async function handlerMetrics(req: Request, res: Response): Promise<void> {
    res.set("Content-Type", "text/html");
    res.send([
        "<html>", "<body>",
        "<h1>Welcome, Chirpy Admin</h1>",
        `<p>Chirpy has been visited ${config.api.fileserverHits} times!</p>`,
        "</body>", "</html>"
    ].join(""));
}

export async function handlerReset(req: Request, res: Response): Promise<void> {
    console.log("Resetting");
    config.api.fileserverHits = 0;
    deleteUsers();
    res.set("Content-Type", "text/html");
    res.send(`Hits: ${config.api.fileserverHits}`);
}

import { hashPassword, checkPasswordHash, makeJWT, validateJWT, getBearerToken } from "./auth.js";

export async function handlerRegisterUser(req: Request, res: Response): Promise<void> {
    let userJson = req.body;
    if (userJson.email === undefined || userJson.password === undefined) {
        throw new BadRequestError("Invalid request");
    }

    let hashedPassword = await hashPassword(userJson.password)
    let created = await createUser({email: userJson.email, hashedPassword: hashedPassword});
    if (created === undefined) {
        throw new BadRequestError(`Couldn't crete user ${userJson.email}`);
    }
    console.log(`Created user ${userJson.email}`);
    res.status(201).json({
        id: created.id,
        email: created.email,
        createdAt: created.createdAt,
        updatedAt: created.updatedAt,
    });
}

export async function handlerLogin(req: Request, res: Response): Promise<void> {
    let loginJson = req.body;
    if (typeof loginJson.email !== "string" || typeof loginJson.password !== "string" ||
        (loginJson.expiresInSeconds !== undefined &&
            typeof loginJson.expiresInSeconds !== "number")) {
        throw new BadRequestError("Invalid request");
    }

    const maxExpirationTime = 1000 * 60 * 60;
    if (loginJson.expiresInSeconds === undefined || loginJson.expiresInSeconds > maxExpirationTime) {
        loginJson.expiresInSeconds = maxExpirationTime;
    }

    loginJson.expiresInSeconds = Math.max(0, loginJson.expiresInSeconds);

    let user = await getUserByEmail(loginJson.email);
    let authenticated = await checkPasswordHash(user.hashedPassword, loginJson.password);
    if (authenticated !== true) {
        throw new UnauthorizedError("Incorrect email or password");
    }
    console.log(`Logged in ${user.id} ${user.email}`);
    let token = makeJWT(user.id, loginJson.expiresInSeconds, config.api.secret);
    res.status(200).json({
        id: user.id,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
        email: user.email,
        token: token,
    });
}

type Chirp = Awaited<ReturnType<typeof createChirp>>

function chirpResponse(chirp: Chirp) {
    return {
        id: chirp.id,
        createdAt: chirp.createdAt,
        updatedAt: chirp.updatedAt,
        body: chirp.body,
        userId: chirp.userId,
    }
}

export async function handlerCreateChirp(req: Request, res: Response): Promise<void> {
    let userId = validateJWT(getBearerToken(req), config.api.secret)
    let chirp = req.body
    if (!(typeof chirp.body === "string")) {
        throw new BadRequestError("Invalid request");
    }

    let chirpText = validateChirp(chirp.body);
    let created = await createChirp({userId: userId, body: chirp.body});
    console.log(created);
    if (created === undefined) {
        throw new BadRequestError("Couldn't create chirp");
    }
    res.status(201).json(chirpResponse(created));
}

export async function handlerGetChirps(req: Request, res: Response): Promise<void> {
    let got = await getChirps();
    let result: Array<Chirp> = [];
    for (let chirp of got) {
        result.push(chirpResponse(chirp));
    }
    res.status(200).json(result);
}

export async function handlerGetChirp(req: Request, res: Response): Promise<void> {
    if (typeof req.params.chirpId !== "string") {
        throw new Error("Invalid request");
    }
    let got = await getChirp(req.params.chirpId);
    console.log(got);
    if (got === undefined) {
        res.status(404).json({
            error: "Chirp not found",
        });
    }
    res.status(200).json(chirpResponse(got));
}

function validateChirp(text: string): string {
    let badWords = ["kerfuffle", "sharbert", "fornax"];
    const maxChirpLength = 140;
    if (text.length <= maxChirpLength) {
        let words = text.split(" ");
        let cleanedWords: Array<string> = [];
        for (let word of words) {
            if (badWords.includes(word.toLowerCase())) {
                cleanedWords.push("****");
            }
            else {
                cleanedWords.push(word);
            }
        }
        return cleanedWords.join(" ");
    } else {
        throw new BadRequestError(`Chirp is too long. Max length is ${maxChirpLength}`);
    }
}

