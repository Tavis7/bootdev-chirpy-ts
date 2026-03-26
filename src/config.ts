type APIConfig = {
    fileserverHits: number,
    dbURL: string,
};

function envOrThrow(name: string) {
    let result = process.env[name];
    if (result === undefined) {
        throw new Error(`Environment variable not defined: ${name}`);
    }
    return result;
}

process.loadEnvFile();
export const config:APIConfig = {
    fileserverHits: 0,
    dbURL: envOrThrow("DB_URL"),
};
