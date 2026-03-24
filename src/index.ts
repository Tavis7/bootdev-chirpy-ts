import express from "express";
import { Request, Response, NextFunction } from "express";
import { config } from "./config.js";

const app = express();
const PORT = 8080;

app.use(middlewareLogResponses);
app.use("/app", middlewareMetricsInc, express.static("./src/app"));
app.get("/api/healthz", handlerReadiness);
app.post("/api/validate_chirp", handlerValidateChirp);
app.get("/admin/metrics", handlerMetrics);
app.post("/admin/reset", handlerReset);

type Chirp = {
    body: string,
};

async function handlerValidateChirp(req: Request, res: Response): Promise<void> {
    let chunks:Array<string> = [];

    if (req.get("Content-Type") !== "application/json") {
        res.status(400).send(JSON.stringify({error: "Chirp is too long"}));
    }
    req.on("data", (chunk) => {
        chunks.push(chunk);
    });

    req.on("end", () => {
        try {
            const body = chunks.join("");
            let parsedBody = JSON.parse(body);
            if (parsedBody && typeof parsedBody.body == "string") {
                if (parsedBody.body.length <= 140) {
                    res.status(200).send(JSON.stringify({valid: true}));
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
            res.status(400).send("Invalid JSON");
            return;
        }
    });
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
