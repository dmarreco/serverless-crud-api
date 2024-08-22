export function getRequiredEnvVar(key: string): string {
    if (process.env[key] == null) throw new Error(`Required env var is not defined: ${key}`);

    return process.env[key];
}