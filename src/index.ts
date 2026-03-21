import express from "express";
import { Request, Response, NextFunction } from "express";

const app = express();
const PORT = 8080;

app.use(middlewareLogResponses);
app.use("/app", express.static("./src/app"));
app.get("/healthz", handlerReadiness);

async function handlerReadiness(req: Request, res: Response): Promise<void> {
    res.set("Content-Type", "text/plain");
    res.send("OK");
}

function middlewareLogResponses(req: Request, res: Response, next: NextFunction): void {
    res.on("finish", () => {
        if (res.statusCode !== 200) {
            console.log(`[NON-OK] ${req.method} ${req.baseUrl || ""}${req.url} - Status: ${res.statusCode}`);
        }
    });
    next();
}

app.listen(PORT, () => {
    console.log(`Server is running at htt://localhost:${PORT}`);
});
