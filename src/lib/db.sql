-- Run this in your Supabase SQL Editor
-- Enable RLS and create the core innovation tables

-- Legacy table kept for backward compatibility
CREATE TABLE IF NOT EXISTS quantum_wallets (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  public_name text NOT NULL UNIQUE,
  wallet_address text NOT NULL UNIQUE,
  encrypted_private_key text NOT NULL,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable Row Level Security
ALTER TABLE quantum_wallets ENABLE ROW LEVEL SECURITY;

-- Allow anyone to read wallets (for public name/address lookup)
CREATE POLICY IF NOT EXISTS "Allow public read" ON quantum_wallets
  FOR SELECT USING (true);

-- Allow anyone to insert wallets (for demo purposes)
CREATE POLICY IF NOT EXISTS "Allow public insert" ON quantum_wallets
  FOR INSERT WITH CHECK (true);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_quantum_wallets_public_name ON quantum_wallets(public_name);
CREATE INDEX IF NOT EXISTS idx_quantum_wallets_address ON quantum_wallets(wallet_address);

-- ============================================
-- Core Innovation: Post-Quantum Mint Gate
-- ============================================

-- Stores user SPHINCS+ public keys and encrypted seeds
CREATE TABLE IF NOT EXISTS core_innovation_keys (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  eth_address text NOT NULL UNIQUE,
  pq_public_key text NOT NULL,
  pq_seed_encrypted text, -- optional: encrypted secret key for recovery
  status text NOT NULL DEFAULT 'pending', -- pending | verified | rejected
  merkle_leaf text,
  ecdsa_attestation text,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE core_innovation_keys ENABLE ROW LEVEL SECURITY;

CREATE POLICY IF NOT EXISTS "Allow public read pq keys" ON core_innovation_keys
  FOR SELECT USING (true);

CREATE POLICY IF NOT EXISTS "Allow public insert pq keys" ON core_innovation_keys
  FOR INSERT WITH CHECK (true);

CREATE INDEX IF NOT EXISTS idx_core_innovation_eth_address ON core_innovation_keys(eth_address);
CREATE INDEX IF NOT EXISTS idx_core_innovation_status ON core_innovation_keys(status);

-- Stores Merkle tree leaves and attestations (managed by backend/owner)
CREATE TABLE IF NOT EXISTS pq_mint_leaves (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  eth_address text NOT NULL UNIQUE,
  leaf_hash text NOT NULL,
  epoch integer DEFAULT 0,
  merkle_root text,
  pq_public_key text NOT NULL,
  verified_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE pq_mint_leaves ENABLE ROW LEVEL SECURITY;

CREATE POLICY IF NOT EXISTS "Allow public read mint leaves" ON pq_mint_leaves
  FOR SELECT USING (true);

CREATE INDEX IF NOT EXISTS idx_pq_mint_leaves_address ON pq_mint_leaves(eth_address);
CREATE INDEX IF NOT EXISTS idx_pq_mint_leaves_root ON pq_mint_leaves(merkle_root);
