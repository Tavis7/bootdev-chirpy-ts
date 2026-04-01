import type { MigrationConfig } from "drizzle-orm/migrator";

type APIConfig = {
    fileserverHits: number,
    port: number,
};

type AuthConfig = {
    jwtSecret: string,
    jwtLifetimeSeconds: number,
    refreshLifetimeSeconds: number,
}

type DbConfig = {
    url: string,
    migrationConfig: MigrationConfig,
};

function envOrThrow(name: string) {
    let result = process.env[name];
    if (result === undefined) {
        throw new Error(`Environment variable not defined: ${name}`);
    }
    return result;
}

type ChirpyConfig = {
    api: APIConfig,
    auth: AuthConfig,
    db: DbConfig,
}

process.loadEnvFile();
export const config:ChirpyConfig = {
    api: {
        fileserverHits: 0,
        port: 8080,
    },
    auth: {
        jwtSecret: envOrThrow("JWT_SECRET"),
        jwtLifetimeSeconds: 60 * 60,
        refreshLifetimeSeconds: 60 * 60 * 24 * 60,
    },
    db: {
        url: envOrThrow("DB_URL"),
        migrationConfig: {
            migrationsFolder: "src/db",
        },
    },
};
