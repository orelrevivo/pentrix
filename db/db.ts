import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "./schema";
import * as fs from "fs";
import * as path from "path";

const dbUrl = process.env.DATABASE_URL;

class LocalDatabase {
  private filePath = path.join(process.cwd(), "db", "local_db.json");

  private read() {
    if (!fs.existsSync(this.filePath)) {
      const dir = path.dirname(this.filePath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      fs.writeFileSync(this.filePath, JSON.stringify({ users: [], projects: [], payments: [], conversations: [], messages: [], supportTickets: [] }, null, 2));
    }
    const data = JSON.parse(fs.readFileSync(this.filePath, "utf-8"));
    if (!data.conversations) data.conversations = [];
    if (!data.messages) data.messages = [];
    if (!data.supportTickets) data.supportTickets = [];
    return data;
  }

  private write(data: any) {
    fs.writeFileSync(this.filePath, JSON.stringify(data, null, 2));
  }

  get users() {
    return {
      findMany: async () => this.read().users,
      findFirst: async (where: (user: any) => boolean) => this.read().users.find(where),
      insert: async (user: any) => {
        const db = this.read();
        db.users.push(user);
        this.write(db);
        return [user];
      },
      update: async (id: string, updates: any) => {
        const db = this.read();
        const index = db.users.findIndex((u: any) => u.id === id);
        if (index !== -1) {
          db.users[index] = { ...db.users[index], ...updates, updatedAt: new Date().toISOString() };
          this.write(db);
          return [db.users[index]];
        }
        return [];
      },
    };
  }

  get projects() {
    return {
      findMany: async (where?: (proj: any) => boolean) => {
        const list = this.read().projects;
        return where ? list.filter(where) : list;
      },
      findFirst: async (where: (proj: any) => boolean) => this.read().projects.find(where),
      insert: async (proj: any) => {
        const db = this.read();
        db.projects.push(proj);
        this.write(db);
        return [proj];
      },
      update: async (id: string, updates: any) => {
        const db = this.read();
        const index = db.projects.findIndex((p: any) => p.id === id);
        if (index !== -1) {
          db.projects[index] = { ...db.projects[index], ...updates, updatedAt: new Date().toISOString() };
          this.write(db);
          return [db.projects[index]];
        }
        return [];
      },
    };
  }

  get payments() {
    return {
      findMany: async () => this.read().payments,
      insert: async (pay: any) => {
        const db = this.read();
        db.payments.push(pay);
        this.write(db);
        return [pay];
      },
    };
  }

  get conversations() {
    return {
      findMany: async (where?: (conv: any) => boolean) => {
        const list = this.read().conversations;
        return where ? list.filter(where) : list;
      },
      findFirst: async (where: (conv: any) => boolean) => this.read().conversations.find(where),
      insert: async (conv: any) => {
        const db = this.read();
        db.conversations.push(conv);
        this.write(db);
        return [conv];
      },
      update: async (id: string, updates: any) => {
        const db = this.read();
        const index = db.conversations.findIndex((c: any) => c.id === id);
        if (index !== -1) {
          db.conversations[index] = { ...db.conversations[index], ...updates };
          this.write(db);
          return [db.conversations[index]];
        }
        return [];
      },
    };
  }

  get messages() {
    return {
      findMany: async (where?: (msg: any) => boolean) => {
        const list = this.read().messages;
        return where ? list.filter(where) : list;
      },
      insert: async (msg: any) => {
        const db = this.read();
        db.messages.push(msg);
        this.write(db);
        return [msg];
      },
    };
  }

  get supportTickets() {
    return {
      findMany: async (where?: (ticket: any) => boolean) => {
        const list = this.read().supportTickets;
        return where ? list.filter(where) : list;
      },
      insert: async (ticket: any) => {
        const db = this.read();
        db.supportTickets.push(ticket);
        this.write(db);
        return [ticket];
      },
    };
  }
}

export const localDb = new LocalDatabase();

const sql = dbUrl ? neon(dbUrl) : null;
export const db = sql ? drizzle(sql, { schema }) : null;
export const isLocal = !dbUrl;
