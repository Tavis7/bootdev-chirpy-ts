import express from "express";
import { Request, Response, NextFunction } from "express";
import { config } from "./config.js";

const app = express();
const PORT = 8080;

app.use(middlewareLogResponses);
app.use(express.json());
app.use("/app", middlewareMetricsInc, express.static("./src/app"));
app.get("/api/healthz", handlerReadiness);
app.post("/api/validate_chirp", handlerValidateChirp);
app.get("/admin/metrics", handlerMetrics);
app.post("/admin/reset", handlerReset);

type Chirp = {
    body: string,
};

async function handlerValidateChirp(req: Request, res: Response): Promise<void> {
    let badWords = ["kerfuffle", "sharbert", "fornax"];
    try {
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
                res.status(200).send(JSON.stringify({cleanedBody: cleanedWords.join(" ")}));
                return;
            } else {
                res.status(400).send(JSON.stringify({error: "Chirp is too long"}));
                return;
            }
        } else {
            res.status(400).send(JSON.stringify({error: "Invalid request"}));
            return;
        }
    } catch (e) {
        console.log(e);
        res.status(400).send("Invalid JSON");
        return;
    }
}

async function handlerReadiness(req: Request, res: Response): Promise<void> {
    res.set("Content-Type", "text/plain");
    res.send("OK");
}

async function handlerMetrics(req: Request, res: Response): Promise<void> {
    res.set("Content-Type", "text/html");
    res.send([
        "<html>", "<body>",
        "<h1>Welcome, Chirpy Admin</h1>",
        `<p>Chirpy has been visited ${config.fileserverHits} times!</p>`,
        "</body>", "</html>"
    ].join(""));
}

async function handlerReset(req: Request, res: Response): Promise<void> {
    config.fileserverHits = 0;
    res.set("Content-Type", "text/html");
    res.send(`Hits: ${config.fileserverHits}`);
}

function middlewareLogResponses(req: Request, res: Response, next: NextFunction): void {
    res.on("finish", () => {
        if (res.statusCode !== 200) {
            console.log(`[NON-OK] ${req.method} ${req.baseUrl || ""}${req.url} - Status: ${res.statusCode}`);
        }
    });
    next();
}

function middlewareMetricsInc(req: Request, res: Response, next: NextFunction) {
    console.log("Incrementing hits");
    config.fileserverHits += 1;
    next();
}

app.listen(PORT, () => {
    console.log(`Server is running at htt://localhost:${PORT}`);
});
