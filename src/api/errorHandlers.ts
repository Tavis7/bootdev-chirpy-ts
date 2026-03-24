import { Request, Response, NextFunction } from "express";

export function errorMiddleware(err: Error,
    req: Request, res: Response,
    next: NextFunction) {
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
