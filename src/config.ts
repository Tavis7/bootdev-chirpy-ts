import type { MigrationConfig } from "drizzle-orm/migrator";

type APIConfig = {
    fileserverHits: number,
    port:number,
};

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
    db: DbConfig,
}

process.loadEnvFile();
export const config:ChirpyConfig = {
    api: {
        fileserverHits: 0,
        port: 8080,
    },
    db: {
        url: envOrThrow("DB_URL"),
        migrationConfig: {
            migrationsFolder: "src/db",
        },
    },
};
