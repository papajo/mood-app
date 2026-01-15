import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import 'dotenv/config';

// Use DB_PATH from environment or default to local file
const dbPath = process.env.DB_PATH || './moodmingle.db';

let db = null;

export const initializeDatabase = async () => {
    if (!db) {
        db = await open({
            filename: dbPath,
            driver: sqlite3.Database
        });
        
        // Disable foreign key constraints for simplicity
        await db.exec('PRAGMA foreign_keys = OFF');
    }
    return db;
};

export const query = async (text, params = []) => {
    const database = await initializeDatabase();
    
    // Handle different query types
    if (text.includes('CREATE TABLE') || text.includes('ALTER TABLE')) {
        await database.exec(text);
        return { rows: [] };
    }
    
    const trimmed = text.trim().toUpperCase();
    if (trimmed.startsWith('SELECT') || trimmed.startsWith('PRAGMA')) {
        const rows = await database.all(text, params);
        return { rows };
    } else if (text.trim().startsWith('INSERT')) {
        const result = await database.run(text, params);
        const insertId = result.lastID;
        return { rows: [{ id: insertId }] };
    } else if (text.trim().startsWith('UPDATE') || text.trim().startsWith('DELETE')) {
        await database.run(text, params);
        return { rows: [] };
    }
    
    return { rows: [] };
};

export const getClient = () => {
    return initializeDatabase();
};

export default {
    query,
    getClient,
    initializeDatabase
};
