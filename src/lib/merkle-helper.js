import { MerkleTree } from 'merkletreejs';
import { keccak256, getBytes } from 'ethers';

/**
 * Hash function compatible with merkletreejs (Buffer in -> Buffer out).
 */
function keccak256Buffer(buf) {
  const hex = keccak256(buf);
  return Buffer.from(getBytes(hex));
}

/**
 * Build a Merkle tree from an array of leaf hashes (hex strings, 0x-prefixed).
 * @param {string[]} leaves - Array of keccak256 hex strings
 * @returns {MerkleTree}
 */
export function buildMerkleTree(leaves) {
  const hashedLeaves = leaves.map(leaf => {
    const buf = Buffer.from(leaf.slice(2), 'hex');
    return buf;
  });
  return new MerkleTree(hashedLeaves, keccak256Buffer, { sortPairs: true });
}

/**
 * Generate a Merkle proof for a given leaf.
 * @param {MerkleTree} tree
 * @param {string} leaf - keccak256 hex string
 * @returns {string[]} Array of hex strings
 */
export function generateMerkleProof(tree, leaf) {
  const buf = Buffer.from(leaf.slice(2), 'hex');
  const proof = tree.getProof(buf);
  return proof.map(p => '0x' + p.data.toString('hex'));
}

/**
 * Get the Merkle root as a hex string.
 * @param {MerkleTree} tree
 * @returns {string}
 */
export function getMerkleRoot(tree) {
  return '0x' + tree.getRoot().toString('hex');
}

/**
 * Verify a Merkle proof locally.
 * @param {string[]} proof - Array of hex strings
 * @param {string} root - Hex string root
 * @param {string} leaf - Hex string leaf
 * @returns {boolean}
 */
export function verifyMerkleProof(proof, root, leaf) {
  const leafBuf = Buffer.from(leaf.slice(2), 'hex');
  const proofBufs = proof.map(p => Buffer.from(p.slice(2), 'hex'));
  const rootBuf = Buffer.from(root.slice(2), 'hex');
  return MerkleTree.verify(proofBufs, leafBuf, rootBuf, keccak256Buffer, { sortPairs: true });
}
