import express from "express";
import { config } from "./config.js";

import {
    middlewareLogResponses,
    middlewareMetricsInc,
} from "./api/middleware.js";

import {
    handlerReadiness,
    handlerValidateChirp,
    handlerMetrics,
    handlerReset,
} from "./api/handlers.js";

import {
    errorMiddleware,
    middlewareErrorCatcher,
} from "./api/errorHandlers.js";

const app = express();
const PORT = 8080;

app.use(middlewareLogResponses);
app.use(express.json());
app.use("/app", middlewareMetricsInc, express.static("./src/app"));
app.get("/api/healthz", middlewareErrorCatcher(handlerReadiness));
app.post("/api/validate_chirp", middlewareErrorCatcher(handlerValidateChirp));
app.get("/admin/metrics", middlewareErrorCatcher(handlerMetrics));
app.post("/admin/reset", middlewareErrorCatcher(handlerReset));

app.use(errorMiddleware)
app.listen(PORT, () => {
    console.log(`Server is running at htt://localhost:${PORT}`);
});


