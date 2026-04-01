import { db } from "../index.js";
import { NewChirp, chirps } from "../schema.js";
import { asc, desc, eq, and } from "drizzle-orm";

export async function createChirp(chirp: NewChirp) {
    const [result] = await db
        .insert(chirps)
        .values(chirp)
        .onConflictDoNothing()
        .returning();

    return result;
}

export async function getChirps({authorId, sort}: {authorId?: string, sort?: "asc" | "desc"}) {
    const result = await db
        .select()
        .from(chirps)
        .where(authorId ? eq(chirps.userId, authorId) : undefined)
        .orderBy((sort === "desc") ? desc(chirps.createdAt) : asc(chirps.createdAt));

    return result;
}

export async function getChirp(id: string) {
    const [result] = await db
        .select()
        .from(chirps)
        .where(eq(chirps.id, id));

    return result;
}

export async function deleteChirp(userId: string, chirpId: string) {
    const [result] = await db
        .delete(chirps)
        .where(and(eq(chirps.userId, userId), eq(chirps.id, chirpId)))
        .returning();
    return result;
}
