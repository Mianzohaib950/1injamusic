import { mkdir, readFile, writeFile } from "fs/promises";
import path from "path";
import { randomUUID } from "crypto";
import { hashPassword } from "./auth";

export interface DevUser {
  id: string;
  name: string;
  email: string;
  phone: string;
  passwordHash: string;
  role: string;
  createdAt: string;
}

const storePath = path.join(process.cwd(), ".data", "dev-users.json");

export function isDevAuthStoreEnabled(error?: unknown) {
  if (process.env.VERCEL) return false;

  const databaseUrl = process.env.DATABASE_URL ?? "";
  const isPlaceholder =
    !databaseUrl ||
    /user:password|localhost:5432\/1njamaimusic|placeholder|your_/i.test(databaseUrl);

  const code = (error as any)?.cause?.code ?? (error as any)?.code;
  return isPlaceholder || code === "28P01";
}

async function readUsers() {
  try {
    return JSON.parse(await readFile(storePath, "utf8")) as DevUser[];
  } catch {
    return [];
  }
}

async function writeUsers(users: DevUser[]) {
  await mkdir(path.dirname(storePath), { recursive: true });
  await writeFile(storePath, JSON.stringify(users, null, 2));
}

export function publicUser(user: DevUser) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    phone: user.phone,
    role: user.role,
    createdAt: user.createdAt,
  };
}

export async function createDevUser(input: {
  name: string;
  email: string;
  phone?: string;
  password: string;
}) {
  const users = await readUsers();
  const email = input.email.toLowerCase();

  if (users.some((user) => user.email.toLowerCase() === email)) {
    return null;
  }

  const user: DevUser = {
    id: randomUUID(),
    name: input.name,
    email,
    phone: input.phone ?? "",
    passwordHash: hashPassword(input.password),
    role: "user",
    createdAt: new Date().toISOString(),
  };

  users.push(user);
  await writeUsers(users);
  return user;
}

export async function findDevUserByEmail(email: string) {
  const users = await readUsers();
  return users.find((user) => user.email.toLowerCase() === email.toLowerCase()) ?? null;
}

export async function findDevUserById(id: string) {
  const users = await readUsers();
  return users.find((user) => user.id === id) ?? null;
}

export async function updateDevUser(
  id: string,
  patch: Partial<Pick<DevUser, "name" | "phone" | "passwordHash">>,
) {
  const users = await readUsers();
  const index = users.findIndex((user) => user.id === id);
  if (index === -1) return null;

  users[index] = { ...users[index], ...patch };
  await writeUsers(users);
  return users[index];
}
