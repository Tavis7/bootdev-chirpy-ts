import express from "express";
import { Request, Response, NextFunction } from "express";
import { config } from "./config.js";

const app = express();
const PORT = 8080;

app.use(middlewareLogResponses);
app.use("/app", middlewareMetricsInc, express.static("./src/app"));
app.get("/api/healthz", handlerReadiness);
app.get("/admin/metrics", handlerMetrics);
app.post("/admin/reset", handlerReset);

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
