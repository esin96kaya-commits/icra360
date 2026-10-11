import { createCipheriv, createDecipheriv, createHmac, randomBytes } from "node:crypto";

const AES_ALGO = "aes-256-gcm";
const HMAC_ALGO = "sha256";

export class CryptoConfigError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "CryptoConfigError";
  }
}

export type EncryptedField = {
  ciphertext: Buffer;
  nonce: Buffer;
};

export function toDbBytes(value: Buffer): Uint8Array<ArrayBuffer> {
  const copy = new Uint8Array(value.byteLength);
  copy.set(value);
  return copy;
}

function requireKey(envName: string, expectedBytes: number): Buffer {
  const raw = process.env[envName];
  if (!raw) {
    throw new CryptoConfigError(`${envName} tanımlı değil.`);
  }
  const key = Buffer.from(raw, "base64");
  if (key.length !== expectedBytes) {
    throw new CryptoConfigError(`${envName} ${expectedBytes} baytlık base64 anahtar olmalıdır.`);
  }
  return key;
}

export function getEncryptionKey(): Buffer {
  return requireKey("ENCRYPTION_KEY", 32);
}

export function getNationalIdPepper(): Buffer {
  const raw = process.env.NATIONAL_ID_HMAC_PEPPER;
  if (!raw || raw.length < 16) {
    throw new CryptoConfigError("NATIONAL_ID_HMAC_PEPPER en az 16 karakter olmalıdır.");
  }
  return Buffer.from(raw, "utf8");
}

export function encryptUtf8(plain: string, key = getEncryptionKey()): EncryptedField {
  const nonce = randomBytes(12);
  const cipher = createCipheriv(AES_ALGO, key, nonce);
  const ciphertext = Buffer.concat([cipher.update(plain, "utf8"), cipher.final(), cipher.getAuthTag()]);
  return { ciphertext, nonce };
}

export function decryptUtf8(field: EncryptedField, key = getEncryptionKey()): string {
  if (field.ciphertext.length < 17) {
    throw new CryptoConfigError("Şifreli alan bozuk.");
  }
  const authTag = field.ciphertext.subarray(field.ciphertext.length - 16);
  const data = field.ciphertext.subarray(0, field.ciphertext.length - 16);
  const decipher = createDecipheriv(AES_ALGO, key, field.nonce);
  decipher.setAuthTag(authTag);
  return Buffer.concat([decipher.update(data), decipher.final()]).toString("utf8");
}

export function hmacNationalId(nationalId: string, pepper = getNationalIdPepper()): Buffer {
  return createHmac(HMAC_ALGO, pepper).update(normalizeNationalId(nationalId), "utf8").digest();
}

export function normalizeNationalId(value: string): string {
  return value.replace(/\s/g, "");
}

export function isValidNationalId(value: string): boolean {
  const id = normalizeNationalId(value);
  if (!/^[1-9][0-9]{10}$/.test(id)) {
    return false;
  }
  const digits = [...id].map((char) => Number(char));
  const odd = (digits[0] ?? 0) + (digits[2] ?? 0) + (digits[4] ?? 0) + (digits[6] ?? 0) + (digits[8] ?? 0);
  const even = (digits[1] ?? 0) + (digits[3] ?? 0) + (digits[5] ?? 0) + (digits[7] ?? 0);
  const tenth = (((odd * 7 - even) % 10) + 10) % 10;
  if (tenth !== (digits[9] ?? -1)) {
    return false;
  }
  const sum = digits.slice(0, 10).reduce((acc, n) => acc + n, 0);
  return sum % 10 === (digits[10] ?? -1);
}

export function generateValidNationalId(seed: number): string {
  const digits: number[] = [];
  let cursor = Math.abs(seed) + 1;
  digits.push((cursor % 9) + 1);
  for (let i = 1; i < 9; i += 1) {
    cursor = (cursor * 1103515245 + 12345) >>> 0;
    digits.push(cursor % 10);
  }
  const odd = digits[0]! + digits[2]! + digits[4]! + digits[6]! + digits[8]!;
  const even = digits[1]! + digits[3]! + digits[5]! + digits[7]!;
  digits.push((((odd * 7 - even) % 10) + 10) % 10);
  const sum = digits.reduce((acc, n) => acc + n, 0);
  digits.push(sum % 10);
  return digits.join("");
}

export function maskNationalId(value: string): string {
  const id = normalizeNationalId(value);
  if (id.length !== 11) {
    return "***********";
  }
  return `${id.slice(0, 3)}******${id.slice(9)}`;
}

export function maskIban(value: string): string {
  const compact = value.replace(/\s/g, "").toUpperCase();
  if (compact.length < 8) {
    return "****";
  }
  return `${compact.slice(0, 4)}************${compact.slice(-4)}`;
}

export function digestMetadata(value: unknown): string {
  const json = stableStringify(value);
  return createHmac(HMAC_ALGO, getNationalIdPepper()).update(json).digest("hex");
}

function stableStringify(value: unknown): string {
  if (value === null || typeof value !== "object") {
    return JSON.stringify(value);
  }
  if (Array.isArray(value)) {
    return `[${value.map((item) => stableStringify(item)).join(",")}]`;
  }
  const record = value as Record<string, unknown>;
  const keys = Object.keys(record).sort();
  return `{${keys.map((key) => `${JSON.stringify(key)}:${stableStringify(record[key])}`).join(",")}}`;
}
