import { defineEventHandler } from 'h3';
import Database from 'better-sqlite3';
import type { Lecturer } from '~/types/backend/db';

export default defineEventHandler(() => {
  const db = new Database('server/db/database.db', { verbose: console.log });

  const stmt = db.prepare('SELECT * FROM Lecturers');

  const groups = stmt.all() as Lecturer[];

  db.close();

  return groups;
});