import { savePersistedInputs, type StorageWriterLike } from "./inputPersistence";

type StorageLike = Storage & StorageWriterLike;

/**
 * One-time migration for removing legacy persisted `ukRegion` from inputs and
 * clearing obsolete region-specific holiday caches.
 */
export function migrateLegacyUkRegion(storage: StorageLike, persistKey: string): void {
    const migrationFlagKey = "ukspcal.region_migration.v1";

    try {
        const migrated = storage.getItem(migrationFlagKey);
        if (!migrated) {
            storage.removeItem("holiday_cache_GB-SCT");
            storage.removeItem("holiday_cache_GB-NIR");
            storage.setItem(migrationFlagKey, "1");
        }
    } catch {
        // ignore cache clear errors
    }

    try {
        const raw = storage.getItem(persistKey);
        if (!raw) return;
        const parsed = JSON.parse(raw) as Record<string, unknown> | null;
        if (!parsed || typeof parsed !== "object") return;
        if (!Object.prototype.hasOwnProperty.call(parsed, "ukRegion")) return;
        delete parsed.ukRegion;
        savePersistedInputs(storage, persistKey, parsed);
    } catch {
        // ignore malformed storage payloads
    }
}
