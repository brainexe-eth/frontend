// Client-side AES-GCM encryption for private keys
// The private key is NEVER sent to the server unencrypted

const enc = new TextEncoder();
const dec = new TextDecoder();

async function getKey(password, salt) {
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    enc.encode(password),
    'PBKDF2',
    false,
    ['deriveKey']
  );
  return crypto.subtle.deriveKey(
    { name: 'PBKDF2', salt, iterations: 100000, hash: 'SHA-256' },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

export async function encryptPrivateKey(privateKey, password) {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const key = await getKey(password, salt);
  const encrypted = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    enc.encode(privateKey)
  );
  // Pack salt + iv + ciphertext into a single base64 string
  const merged = new Uint8Array(salt.length + iv.length + encrypted.byteLength);
  merged.set(salt, 0);
  merged.set(iv, salt.length);
  merged.set(new Uint8Array(encrypted), salt.length + iv.length);
  return btoa(String.fromCharCode(...merged));
}

export async function decryptPrivateKey(encryptedBase64, password) {
  const merged = Uint8Array.from(atob(encryptedBase64), c => c.charCodeAt(0));
  const salt = merged.slice(0, 16);
  const iv = merged.slice(16, 28);
  const ciphertext = merged.slice(28);
  const key = await getKey(password, salt);
  const decrypted = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv },
    key,
    ciphertext
  );
  return dec.decode(decrypted);
}
