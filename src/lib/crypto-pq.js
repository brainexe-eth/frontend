/**
 * Post-Quantum Cryptography helper using @noble/post-quantum (SLH-DSA / SPHINCS+)
 * All operations are client-side. Secret keys never leave the browser unencrypted.
 */

import { slh_dsa_shake_128f } from '@noble/post-quantum/slh-dsa.js';
import { ethers } from 'ethers';

const PQ = slh_dsa_shake_128f;

/**
 * Generate a new SPHINCS+ keypair.
 * @returns {{ secretKey: Uint8Array, publicKey: Uint8Array }}
 */
export function generatePQKeypair() {
  const keypair = PQ.keygen(); // returns { publicKey, secretKey }
  return { secretKey: keypair.secretKey, publicKey: keypair.publicKey };
}

/**
 * Sign a message with SPHINCS+.
 * @param {Uint8Array} message
 * @param {Uint8Array} secretKey
 * @returns {Uint8Array} signature
 */
export function signPQ(message, secretKey) {
  return PQ.sign(message, secretKey);
}

/**
 * Verify a SPHINCS+ signature.
 * @param {Uint8Array} signature
 * @param {Uint8Array} message
 * @param {Uint8Array} publicKey
 * @returns {boolean}
 */
export function verifyPQ(signature, message, publicKey) {
  try {
    return PQ.verify(signature, message, publicKey);
  } catch {
    return false;
  }
}

/**
 * Pack PQ key material into base64 for storage.
 */
export function packPQKey(secretKey, publicKey) {
  return {
    secretKeyB64: btoa(String.fromCharCode(...secretKey)),
    publicKeyB64: btoa(String.fromCharCode(...publicKey)),
  };
}

/**
 * Unpack PQ key material from base64.
 */
export function unpackPQKey(secretKeyB64, publicKeyB64) {
  return {
    secretKey: Uint8Array.from(atob(secretKeyB64), c => c.charCodeAt(0)),
    publicKey: Uint8Array.from(atob(publicKeyB64), c => c.charCodeAt(0)),
  };
}

/**
 * Build the canonical mint-gate message for a given Ethereum address.
 * Format: "BrainEXE:PQGate:<address_lowercase>:<chainId>"
 */
export function buildPQMessage(ethAddress, chainId = 11155111) {
  const msg = `BrainEXE:PQGate:${ethAddress.toLowerCase()}:${chainId}`;
  return new TextEncoder().encode(msg);
}

/**
 * Build the pkHash for a PQ public key.
 * pkHash = keccak256(pqPublicKey)
 * This is the Merkle leaf used in MintGate.
 */
export function buildPkHash(pqPublicKey) {
  return ethers.keccak256(pqPublicKey);
}
