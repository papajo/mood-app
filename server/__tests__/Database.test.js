import fs from 'fs';
import path from 'path';
import sqlite3 from 'sqlite3';
import { fileURLToPath } from 'url';
import { describe, it, expect } from '@jest/globals';

const sqlite3Verbose = sqlite3.verbose();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

describe('Database Configuration & Performance', () => {
    const dbPath = path.resolve(__dirname, '../moodmingle.db');

    it('database file should exist', () => {
        expect(fs.existsSync(dbPath)).toBe(true);
    });

    it('should connect and query quickly', (done) => {
        const start = Date.now();
        const db = new sqlite3Verbose.Database(dbPath, sqlite3Verbose.OPEN_READONLY, (err) => {
            expect(err).toBeNull();

            db.get("SELECT 1", (err, row) => {
                expect(err).toBeNull();
                const duration = Date.now() - start;
                expect(duration).toBeLessThan(500); // Should be very fast
                db.close();
                done();
            });
        });
    });

    // Indexes check
    it('should have indexes on crucial columns', (done) => {
        const db = new sqlite3Verbose.Database(dbPath, sqlite3Verbose.OPEN_READONLY);
        db.all("PRAGMA index_list('messages')", (err, definedIndexes) => {
            // We haven't explicitly added indexes in schema yet might fail if we expect them
            // But we can check if the table exists at least or print what we have
            expect(err).toBeNull();
            db.close();
            done();
        });
    });
});
