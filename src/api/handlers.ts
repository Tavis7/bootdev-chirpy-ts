import { Request, Response, NextFunction } from "express";
import { config } from "../config.js";

import { BadRequestError } from "./errors.js";

export async function handlerReadiness(req: Request, res: Response): Promise<void> {
    res.set("Content-Type", "text/plain");
    res.send("OK");
}

export async function handlerValidateChirp(req: Request, res: Response): Promise<void> {
    let badWords = ["kerfuffle", "sharbert", "fornax"];
    let parsedBody = req.body
    const maxChirpLength = 140;
    if (parsedBody && typeof parsedBody.body == "string") {
        let chirpBody = parsedBody.body;
        if (chirpBody.length <= maxChirpLength) {
            let words = chirpBody.split(" ");
            let cleanedWords: Array<string> = [];
            for (let word of words) {
                if (badWords.includes(word.toLowerCase())) {
                    cleanedWords.push("****");
                }
                else {
                    cleanedWords.push(word);
                }
            }
            res.status(200).json({cleanedBody: cleanedWords.join(" ")});
            return;
        } else {
            throw new BadRequestError(`Chirp is too long. Max length is ${maxChirpLength}`);
        }
    } else {
        throw new BadRequestError("Invalid request");
    }
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
    config.api.fileserverHits = 0;
    res.set("Content-Type", "text/html");
    res.send(`Hits: ${config.api.fileserverHits}`);
}
