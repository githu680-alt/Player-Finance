// Simple Web Crypto helpers for password-based AES-GCM encryption

const enc = new TextEncoder();
const dec = new TextDecoder();

export async function deriveKey(password: string, salt: Uint8Array): Promise<CryptoKey> {
  const pwKey = await crypto.subtle.importKey(
    'raw',
    enc.encode(password),
    { name: 'PBKDF2' },
    false,
    ['deriveKey']
  );

  return crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt,
      iterations: 100000,
      hash: 'SHA-256',
    },
    pwKey,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

export function randomSalt() {
  return crypto.getRandomValues(new Uint8Array(16));
}

export function toBase64(bytes: ArrayBuffer | Uint8Array) {
  const b = typeof bytes === 'string' ? bytes : String.fromCharCode(...new Uint8Array(bytes as ArrayBuffer));
  return btoa(b);
}

export function fromBase64(str: string) {
  const bin = atob(str);
  const arr = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i);
  return arr;
}

export async function encryptJson(password: string, payload: any) {
  const salt = randomSalt();
  const key = await deriveKey(password, salt);
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const data = enc.encode(JSON.stringify(payload));
  const cipher = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, data);
  return {
    salt: toBase64(salt),
    iv: toBase64(iv),
    cipher: toBase64(cipher),
    createdAt: new Date().toISOString(),
  };
}

export async function decryptJson(password: string, encrypted: { salt: string; iv: string; cipher: string }) {
  const salt = fromBase64(encrypted.salt);
  const iv = fromBase64(encrypted.iv);
  const cipher = fromBase64(encrypted.cipher);
  const key = await deriveKey(password, salt);
  try {
    const plain = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, cipher);
    const decoded = dec.decode(plain as ArrayBuffer);
    return JSON.parse(decoded);
  } catch (e) {
    throw new Error('Decryption failed');
  }
}
