import express from "express";
import { Request, Response, NextFunction } from "express";
import { config } from "./config.js";

const app = express();
const PORT = 8080;

app.use(middlewareLogResponses);
app.use(express.json());
app.use("/app", middlewareMetricsInc, express.static("./src/app"));
app.get("/api/healthz", handlerErrorWrapper(handlerReadiness));
app.post("/api/validate_chirp", handlerErrorWrapper(handlerValidateChirp));
app.get("/admin/metrics", handlerErrorWrapper(handlerMetrics));
app.post("/admin/reset", handlerErrorWrapper(handlerReset));

app.use(errorMiddleware)
app.listen(PORT, () => {
    console.log(`Server is running at htt://localhost:${PORT}`);
});

type ChirpyAsyncHandler = (req: Request, res: Response) => Promise<void>;
type ChirpyHandler = (req: Request, res: Response, next: NextFunction) => void;

function handlerErrorWrapper(handler: ChirpyAsyncHandler): ChirpyHandler {
    return function(req: Request, res: Response, next: NextFunction) {
        Promise.resolve(handler(req, res)).catch(next);
    }
}

function errorMiddleware(err: Error, req: Request, res: Response, next: NextFunction) {
    console.log("An error occurred");
    console.log(err);
    res.status(500).json({
        error: "Something went wrong on our end",
    });
}

type Chirp = {
    body: string,
};


async function handlerValidateChirp(req: Request, res: Response): Promise<void> {
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

