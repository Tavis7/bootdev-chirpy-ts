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


import postgres from "postgres";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import { drizzle } from "drizzle-orm/postgres-js";

const migrationClient = postgres(config.db.url, {max: 1 });
await migrate(drizzle(migrationClient), config.db.migrationConfig);

const app = express();

app.use(middlewareLogResponses);
app.use(express.json());
app.use("/app", middlewareMetricsInc, express.static("./src/app"));
app.get("/api/healthz", middlewareErrorCatcher(handlerReadiness));
app.post("/api/validate_chirp", middlewareErrorCatcher(handlerValidateChirp));
app.get("/admin/metrics", middlewareErrorCatcher(handlerMetrics));
app.post("/admin/reset", middlewareErrorCatcher(handlerReset));

app.use(errorMiddleware)
app.listen(config.api.port, () => {
    console.log(`Server is running at htt://localhost:${config.api.port}`);
});


