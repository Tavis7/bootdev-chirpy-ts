import { Request, Response, NextFunction } from "express";
import { config } from "../config.js";

export async function handlerReadiness(req: Request, res: Response): Promise<void> {
    res.set("Content-Type", "text/plain");
    res.send("OK");
}

export async function handlerValidateChirp(req: Request, res: Response): Promise<void> {
    let badWords = ["kerfuffle", "sharbert", "fornax"];
    let parsedBody = req.body
    if (parsedBody && typeof parsedBody.body == "string") {
        let chirpBody = parsedBody.body;
        if (chirpBody.length <= 140) {
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
            throw new Error("Chirp is too long");
            res.status(400).json({error: "Chirp is too long"});
            return;
        }
    } else {
        res.status(400).json({error: "Invalid request"});
        return;
    }
}

export async function handlerMetrics(req: Request, res: Response): Promise<void> {
    res.set("Content-Type", "text/html");
    res.send([
        "<html>", "<body>",
        "<h1>Welcome, Chirpy Admin</h1>",
        `<p>Chirpy has been visited ${config.fileserverHits} times!</p>`,
        "</body>", "</html>"
    ].join(""));
}

export async function handlerReset(req: Request, res: Response): Promise<void> {
    config.fileserverHits = 0;
    res.set("Content-Type", "text/html");
    res.send(`Hits: ${config.fileserverHits}`);
}
