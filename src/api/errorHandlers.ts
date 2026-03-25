import { Request, Response, NextFunction } from "express";

import {
    BadRequestError,
    UnauthorizedError,
    ForbiddenError,
    NotFoundError,
} from "./errors.js";

export function errorMiddleware(err: Error,
    req: Request, res: Response,
    next: NextFunction) {
    if (err instanceof BadRequestError) {
        res.status(400).json({
            error: err.message,
        });
        return;
    }
    if (err instanceof UnauthorizedError) {
        res.status(401).json({
            error: err.message,
        });
        return;
    }
    if (err instanceof ForbiddenError) {
        res.status(403).json({
            error: err.message,
        });
        return;
    }
    if (err instanceof NotFoundError) {
        res.status(404).json({
            error: err.message,
        });
        return;
    }
    console.log("An error occurred");
    console.log(err);
    res.status(500).json({
        error: "Something went wrong on our end",
    });
}

export function middlewareErrorCatcher(handler: ChirpyAsyncHandler): ChirpyHandler {
    return function(req: Request, res: Response, next: NextFunction) {
        Promise.resolve(handler(req, res)).catch(next);
    }
}

type ChirpyAsyncHandler = (req: Request, res: Response) => Promise<void>;
type ChirpyHandler = (req: Request, res: Response, next: NextFunction) => void;
