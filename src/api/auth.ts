import argon2 from "argon2";
export function hashPassword(password: string) {
    return argon2.hash(password);
}

export async function checkPasswordHash(passwordHash: string, password: string) {
    console.log("Checking password");
    return await argon2.verify(passwordHash, password);
}

