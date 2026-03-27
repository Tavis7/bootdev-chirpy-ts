import { Request, Response, NextFunction } from "express";
import { config } from "../config.js";

export function middlewareLogResponses(req: Request, res: Response, next: NextFunction): void {
    res.on("finish", () => {
        if (res.statusCode < 200 || res.statusCode >= 300) {
            console.log(
                `[NON-OK] ${req.method} ${req.baseUrl || ""}` +
                    `${req.url} - Status: ${res.statusCode}`
            );
        }
    });
    next();
}

export function middlewareMetricsInc(req: Request, res: Response, next: NextFunction) {
    console.log("Incrementing hits");
    config.api.fileserverHits += 1;
    next();
}

