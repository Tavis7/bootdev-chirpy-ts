import { Request, Response, NextFunction } from "express";
import { config } from "../config.js";
import { createUser, getUserByEmail, updateUser, upgradeUser, deleteUsers } from "../db/queries/users.js";
import { createChirp, getChirps, getChirp, deleteChirp } from "../db/queries/chirps.js";

import { BadRequestError, UnauthorizedError, NotFoundError, ForbiddenError } from "./errors.js";

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

import {
    hashPassword,
    checkPasswordHash,
    makeJWT,
    validateJWT,
    getBearerToken,
    makeRefreshToken,
    getAPIKey,
} from "./auth.js";

import {
    createRefreshToken,
    getRefreshToken,
    revokeRefreshToken,
} from "../db/queries/refreshTokens.js";

type UserRequest = {
    email: string,
    password: string,
};

function isUserRequest(request: Record<string, string>): request is UserRequest {
    if (typeof request.email === "string" &&
        typeof request.password === "string") {
        return true;
    }
    return false;
}

export async function handlerRegisterUser(req: Request, res: Response): Promise<void> {
    let userJson = req.body;
    if (!isUserRequest(userJson)) {
        throw new BadRequestError("Invalid request");
    }

    let hashedPassword = await hashPassword(userJson.password)
    let created = await createUser({email: userJson.email, hashedPassword: hashedPassword});
    if (created === undefined) {
        throw new BadRequestError(`Couldn't crete user ${userJson.email}`);
    }
    console.log(`Created user ${userJson.email}`);
    res.status(201).json(userResponse(created));
}

export async function handlerUpdateUser(req: Request, res: Response) {
    let userId = validateJWT(getBearerToken(req), config.auth.jwtSecret)
    let userJson = req.body;
    if (!isUserRequest(userJson)) {
        throw new BadRequestError("Invalid request");
    }

    let hashedPassword = await hashPassword(userJson.password)
    let updated = await updateUser(userId,
        {email: userJson.email, hashedPassword: hashedPassword});

    res.status(200).json(userResponse(updated));
}

export async function handlerLogin(req: Request, res: Response): Promise<void> {
    let loginJson = req.body;
    if (!isUserRequest(loginJson)) {
        throw new BadRequestError("Invalid request");
    }

    let user = await getUserByEmail(loginJson.email);
    let authenticated = await checkPasswordHash(user.hashedPassword, loginJson.password);
    if (authenticated !== true) {
        throw new UnauthorizedError("Incorrect email or password");
    }
    console.log(`Logged in ${user.id} ${user.email}`);
    let token = makeJWT(user.id, config.auth.jwtLifetimeSeconds, config.auth.jwtSecret);
    let refresh = await createRefreshToken({
        token: makeRefreshToken(),
        userId: user.id,
        expiresAt: new Date(Date.now() + 1000 * config.auth.refreshLifetimeSeconds)
    });

    console.log("Refresh row");
    console.log(refresh);

    res.status(200).json({
        ...userResponse(user),
        token: token,
        refreshToken: refresh.token,
    });
}

export async function handlerRefresh(req: Request, res: Response) {
    let refreshTokenData = await getRefreshToken(getBearerToken(req));
    if (refreshTokenData === null) {
        throw new UnauthorizedError("Invalid refresh token");
    }

    let now = new Date();
    console.log(refreshTokenData.expiresAt);
    console.log(now);
    if (refreshTokenData.expiresAt < now) {
        throw new UnauthorizedError("Refresh token expired");
    }

    console.log(refreshTokenData);

    if (refreshTokenData.revokedAt !== null) {
        throw new UnauthorizedError("Refresh token has been revoked");
    }

    let jwt = makeJWT(refreshTokenData.userId,
        config.auth.jwtLifetimeSeconds,
        config.auth.jwtSecret);

    res.status(200).json({
        token: jwt,
    });
}

export async function handlerRevoke(req: Request, res: Response) {
    let token = getBearerToken(req);
    let revoked = await revokeRefreshToken(token);
    if (revoked.revokedAt === null) {
        throw new Error("Failed to revoke refresh token");
    }
    res.status(204).end();
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

type UserRow = Awaited<ReturnType<typeof createUser>>;

function userResponse(user: UserRow) {
    return {
        id: user.id,
        email: user.email,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
        isChirpyRed: user.isChirpyRed,
    };
}

type ChirpRequest = {
};

export async function handlerCreateChirp(req: Request, res: Response): Promise<void> {
    let userId = validateJWT(getBearerToken(req), config.auth.jwtSecret)
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
    let author: string | undefined;
    console.log(req.query.authorId);
    if (typeof req.query?.authorId === "string") {
        author = req.query.authorId
    }
    let sort = req.query.sort;
    if (sort !== undefined && sort !== "asc" && sort !== "desc") {
        throw new Error("Invalid request");
    }
    let got = await getChirps({authorId: author, sort: sort});
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
        throw new NotFoundError("Chirp not found");
    }
    res.status(200).json(chirpResponse(got));
}

export async function handlerDeleteChirp(req: Request, res: Response) {
    if (typeof req.params.chirpId !== "string") {
        throw new Error("Invalid request");
    }
    let userId = validateJWT(getBearerToken(req), config.auth.jwtSecret)
    let chirp = await getChirp(req.params.chirpId);
    if (chirp === undefined) {
        throw new NotFoundError("Chirp not found");
    }
    if (chirp.userId !== userId) {
        throw new ForbiddenError("Not authorized");
    }
    let deleted = await deleteChirp(userId, chirp.id);
    res.status(204).end();
}

export async function handlerUpgradeUser(req: Request, res: Response) {
    let apiKey = getAPIKey(req);
    if (apiKey !== config.auth.polkaKey) {
        throw new UnauthorizedError("Unauthorized");
    }
    let hookJson = req.body;
    if (hookJson.event !== "user.upgraded" || typeof hookJson.data?.userId !== "string") {
        res.status(204).end();
        return;
    }
    let result = await upgradeUser(hookJson.data.userId);
    if (result !== undefined) {
        res.status(204).end();
        return;
    }
    throw new NotFoundError("User not found");
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

