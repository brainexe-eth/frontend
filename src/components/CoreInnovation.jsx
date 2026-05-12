import { useState, useEffect, useCallback } from 'react';
import { useActiveAccount } from 'thirdweb/react';
import { supabase } from '../lib/supabase';
import { encryptPrivateKey, decryptPrivateKey } from '../lib/crypto';
import {
  generatePQKeypair,
  signPQ,
  verifyPQ,
  packPQKey,
  unpackPQKey,
  buildPQMessage,
  buildPkHash,
} from '../lib/crypto-pq';
import { buildMerkleTree, generateMerkleProof, getMerkleRoot, verifyMerkleProof } from '../lib/merkle-helper';

export default function CoreInnovation() {
  const account = useActiveAccount();
  const ethAddress = account?.address || '';

  const [tab, setTab] = useState('keys'); // keys | sign | verify | mintgate
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');

  // PQ Keypair state
  const [pqSecretKeyB64, setPqSecretKeyB64] = useState('');
  const [pqPubKeyB64, setPqPubKeyB64] = useState('');
  const [pqPassword, setPqPassword] = useState('');
  const [showRevealKey, setShowRevealKey] = useState(false);

  // Signing state
  const [signatureB64, setSignatureB64] = useState('');

  // Verification / Mint Gate state
  const [verifiedKeys, setVerifiedKeys] = useState([]);
  const [myRecord, setMyRecord] = useState(null);
  const [merkleProof, setMerkleProof] = useState([]);
  const [merkleRoot, setMerkleRoot] = useState('');
  const [epoch, setEpoch] = useState('0');

  // Load stored PQ key from localStorage (convenience only; encrypted)
  useEffect(() => {
    const stored = localStorage.getItem(`pq_key_${ethAddress?.toLowerCase()}`);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setPqPubKeyB64(parsed.publicKeyB64 || '');
        setPqSecretKeyB64(parsed.secretKeyB64 || '');
      } catch {
        // ignore corrupt localStorage
      }
    } else {
      setPqPubKeyB64('');
      setPqSecretKeyB64('');
      setSignatureB64('');
    }
  }, [ethAddress]);

  const showMsg = (msg, isErr = false) => {
    if (isErr) { setError(msg); setInfo(''); }
    else { setInfo(msg); setError(''); }
  };

  const clearMsg = () => { setError(''); setInfo(''); };

  // ─── Generate PQ Keypair ───
  const handleGenerate = async () => {
    clearMsg();
    if (!pqPassword || pqPassword.length < 6) {
      showMsg('Set a password (min 6 chars) to encrypt your PQ secret key.', true);
      return;
    }
    setLoading(true);
    try {
      const { secretKey, publicKey } = generatePQKeypair();
      const packed = packPQKey(secretKey, publicKey);
      // Encrypt secret key with AES-GCM + PBKDF2 before storing
      const encryptedSecretKey = await encryptPrivateKey(packed.secretKeyB64, pqPassword);
      setPqSecretKeyB64(encryptedSecretKey);
      setPqPubKeyB64(packed.publicKeyB64);
      localStorage.setItem(`pq_key_${ethAddress?.toLowerCase()}`, JSON.stringify({
        publicKeyB64: packed.publicKeyB64,
        secretKeyB64: encryptedSecretKey,
      }));
      showMsg('SPHINCS+ keypair generated! Public key ready for mint gate.');
    } catch (err) {
      showMsg(err.message || 'Generation failed', true);
    }
    setLoading(false);
  };

  // ─── Sign Message ───
  const handleSign = async () => {
    clearMsg();
    if (!pqSecretKeyB64 || !pqPubKeyB64) {
      showMsg('Generate a PQ keypair first.', true);
      return;
    }
    if (!ethAddress) {
      showMsg('Connect your Ethereum wallet first.', true);
      return;
    }
    if (!pqPassword) {
      showMsg('Enter your PQ password to decrypt secret key and sign.', true);
      return;
    }
    setLoading(true);
    try {
      // Decrypt secret key using AES-GCM + PBKDF2
      const secretKeyB64 = await decryptPrivateKey(pqSecretKeyB64, pqPassword);
      const { secretKey } = unpackPQKey(secretKeyB64, pqPubKeyB64);
      const message = buildPQMessage(ethAddress);
      const signature = signPQ(message, secretKey);
      setSignatureB64(btoa(String.fromCharCode(...signature)));
      showMsg('Message signed with SPHINCS+. Signature is ~17 KB.');
    } catch (err) {
      showMsg('Signing failed: ' + (err.message || 'Wrong password?'), true);
    }
    setLoading(false);
  };

  // ─── Off-Chain Verify ───
  const handleOffChainVerify = () => {
    clearMsg();
    if (!signatureB64 || !pqPubKeyB64 || !ethAddress) {
      showMsg('Generate keypair and sign first.', true);
      return;
    }
    setLoading(true);
    try {
      const { publicKey } = unpackPQKey('', pqPubKeyB64);
      const signature = Uint8Array.from(atob(signatureB64), c => c.charCodeAt(0));
      const message = buildPQMessage(ethAddress);
      const valid = verifyPQ(signature, message, publicKey);
      showMsg(valid
        ? '✅ SPHINCS+ signature is VALID (off-chain).'
        : '❌ SPHINCS+ signature is INVALID.', !valid);
    } catch (err) {
      showMsg('Verification error: ' + err.message, true);
    }
    setLoading(false);
  };

  // ─── LocalStorage helpers (fallback when Supabase is not configured) ───
  const getLocalKeys = () => {
    try {
      const raw = localStorage.getItem('pq_verified_keys');
      return raw ? JSON.parse(raw) : [];
    } catch { return []; }
  };
  const setLocalKeys = (keys) => localStorage.setItem('pq_verified_keys', JSON.stringify(keys));

  // ─── Submit to Backend (Supabase with localStorage fallback) ───
  const handleSubmitToBackend = async () => {
    clearMsg();
    if (!ethAddress || !pqPubKeyB64) {
      showMsg('Connect wallet and generate keypair first.', true);
      return;
    }
    setLoading(true);
    try {
      const pkHash = buildPkHash(Uint8Array.from(atob(pqPubKeyB64), c => c.charCodeAt(0)));
      const { error: insertError } = await supabase
        .from('core_innovation_keys')
        .upsert([{
          eth_address: ethAddress.toLowerCase(),
          pq_public_key: pqPubKeyB64,
          status: 'pending',
          merkle_leaf: pkHash,
        }], { onConflict: 'eth_address' });

      if (insertError) throw insertError;
      showMsg('Submitted to backend for PQ verification. Wait for owner to update Merkle root.');
    } catch (err) {
      // Fallback: store locally so user can still build Merkle proofs
      // This also handles missing table, missing unique constraint, or network errors
      const pkHash = buildPkHash(Uint8Array.from(atob(pqPubKeyB64), c => c.charCodeAt(0)));
      const keys = getLocalKeys();
      const idx = keys.findIndex(k => k.eth_address === ethAddress.toLowerCase());
      const record = {
        id: 'local-' + ethAddress.toLowerCase(),
        eth_address: ethAddress.toLowerCase(),
        pq_public_key: pqPubKeyB64,
        status: 'verified',
        merkle_leaf: pkHash,
        created_at: new Date().toISOString(),
      };
      if (idx >= 0) keys[idx] = record; else keys.push(record);
      setLocalKeys(keys);
      setVerifiedKeys(keys);
      setMyRecord(record);
      showMsg('Saved locally. You can now build Merkle Proof.');
    }
    setLoading(false);
  };

  // ─── Fetch Verified Keys & Build Merkle Tree ───
  const fetchVerifiedKeys = useCallback(async () => {
    const { data, error } = await supabase
      .from('core_innovation_keys')
      .select('*')
      .eq('status', 'verified');
    if (!error && data) {
      setVerifiedKeys(data);
      return data;
    }
    // Fallback to localStorage
    const keys = getLocalKeys().filter(k => k.status === 'verified');
    setVerifiedKeys(keys);
    return keys;
  }, []);

  const fetchMyRecord = useCallback(async () => {
    if (!ethAddress) return;
    const { data, error } = await supabase
      .from('core_innovation_keys')
      .select('*')
      .eq('eth_address', ethAddress.toLowerCase())
      .maybeSingle();
    if (!error && data) {
      setMyRecord(data || null);
      return;
    }
    // Fallback to localStorage
    const keys = getLocalKeys();
    const local = keys.find(k => k.eth_address === ethAddress.toLowerCase()) || null;
    setMyRecord(local);
  }, [ethAddress]);

  useEffect(() => {
    fetchMyRecord();
    fetchVerifiedKeys();
  }, [fetchMyRecord, fetchVerifiedKeys]);

  // ─── Generate Merkle Proof ───
  const handleBuildMerkleProof = async () => {
    clearMsg();
    if (!ethAddress || !pqPubKeyB64) {
      showMsg('Generate keypair first.', true);
      return;
    }
    setLoading(true);
    try {
      // Always include the user's own key in the tree
      const myLeaf = buildPkHash(Uint8Array.from(atob(pqPubKeyB64), c => c.charCodeAt(0)));
      const leaves = [myLeaf];

      // Also include other verified keys from Supabase or localStorage
      const keys = await fetchVerifiedKeys();
      for (const k of keys) {
        if (k.merkle_leaf && k.merkle_leaf !== myLeaf) {
          leaves.push(k.merkle_leaf);
        }
      }

      const tree = buildMerkleTree(leaves);
      const root = getMerkleRoot(tree);
      const proof = generateMerkleProof(tree, myLeaf);
      const valid = verifyMerkleProof(proof, root, myLeaf);
      if (!valid) throw new Error('Local Merkle proof verification failed');
      setMerkleProof(proof);
      setMerkleRoot(root);
      showMsg(`Merkle proof generated. Root: ${root.slice(0, 18)}...`);
    } catch (err) {
      showMsg('Merkle proof failed: ' + (err.message || err), true);
    }
    setLoading(false);
  };

  const copy = (text) => {
    navigator.clipboard.writeText(text);
    showMsg('Copied to clipboard!');
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
      {/* Header */}
      <div className="text-center mb-8 sm:mb-10">
        <div className="inline-flex items-center gap-2 px-4 sm:px-5 py-2 sm:py-2.5 rounded-full bg-white/5 border border-white/10 rounded-2xl text-white/80 text-xs sm:text-sm font-bold mb-4 sm:mb-6">
          🧠 Core Innovation
        </div>
        <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-white mb-2 sm:mb-3">
          Post-Quantum Mint Gate
        </h2>
        <p className="text-sm sm:text-base text-white/60 font-semibold max-w-lg mx-auto px-2">
          Generate a SPHINCS+ keypair client-side, sign a challenge, and unlock on-chain minting via Merkle Proof or ECDSA attestation.
        </p>
      </div>

      {/* Sub-tabs */}
      <div className="flex flex-wrap justify-center gap-2 mb-6 sm:mb-8">
        {[
          { id: 'keys', label: '1. Generate Keys' },
          { id: 'sign', label: '2. Sign' },
          { id: 'verify', label: '3. Verify & Submit' },
          { id: 'mintgate', label: '4. Mint Gate' },
        ].map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`px-4 sm:px-5 py-2 sm:py-2.5 rounded-xl sm:rounded-2xl text-xs sm:text-sm font-bold transition-all whitespace-nowrap ${
              tab === t.id ? 'clay-button text-white' : 'text-white/70 hover:bg-white/10'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Alerts */}
      {error && (
        <div className="bg-white/5 border border-white/10 rounded-2xl bg-white/5 border border-white/10 rounded-2xl p-4 mb-6 text-white font-bold text-sm text-center">
          ⚠️ {error}
        </div>
      )}
      {info && (
        <div className="bg-white/5 border border-white/10 rounded-2xl bg-white/5 border border-white/10 rounded-2xl p-4 mb-6 text-white font-bold text-sm text-center">
          ✅ {info}
        </div>
      )}

      {/* ─── Tab: Keys ─── */}
      {tab === 'keys' && (
        <div className="bg-white/5 border border-white/10 rounded-2xl p-5 sm:p-8 max-w-lg mx-auto">
          <h3 className="text-lg sm:text-xl font-black text-white mb-4 sm:mb-6 text-center">Generate SPHINCS+ Keypair</h3>

          <div className="space-y-4 sm:space-y-5">
            <div>
              <label className="block text-sm font-bold text-white mb-2">Encryption Password</label>
              <input
                type="password"
                value={pqPassword}
                onChange={(e) => setPqPassword(e.target.value)}
                placeholder="Min 6 characters"
                className="w-full px-4 sm:px-5 py-3 sm:py-3.5 clay-input text-black placeholder-black-900/30 font-bold"
              />
              <p className="text-[10px] text-white/40 font-bold mt-1">
                This password protects your PQ secret key locally. We cannot recover it!
              </p>
            </div>

            <button
              onClick={handleGenerate}
              disabled={loading}
              className="w-full clay-button py-3 sm:py-4 text-sm disabled:opacity-40"
            >
              {loading ? 'Generating...' : 'Generate SPHINCS+ Keypair'}
            </button>

            {pqPubKeyB64 && (
              <div className="bg-white/5 border border-white/10 rounded-2xl p-3 sm:p-4 rounded-2xl">
                <div className="text-[10px] font-black text-white uppercase mb-1">Public Key (Base64)</div>
                <code className="block text-[10px] sm:text-xs font-mono text-white break-all font-bold">
                  {pqPubKeyB64}
                </code>
                <button onClick={() => copy(pqPubKeyB64)} className="mt-2 clay-button px-3 py-1 text-[10px]">
                  Copy Public Key
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ─── Tab: Sign ─── */}
      {tab === 'sign' && (
        <div className="bg-white/5 border border-white/10 rounded-2xl p-5 sm:p-8 max-w-lg mx-auto">
          <h3 className="text-lg sm:text-xl font-black text-white mb-4 sm:mb-6 text-center">Sign Mint-Gate Message</h3>

          <div className="space-y-4">
            <div className="bg-white/5 border border-white/10 rounded-2xl p-3 sm:p-4 rounded-2xl bg-white/40">
              <div className="text-[10px] font-black text-white/50 uppercase mb-1">Message Format</div>
              <code className="block text-xs font-mono text-white break-all font-bold">
                BrainEXE:PQGate:{ethAddress?.toLowerCase() || '0x...'}:11155111
              </code>
            </div>

            <button
              onClick={handleSign}
              disabled={loading || !pqPubKeyB64}
              className="w-full clay-button py-3 sm:py-4 text-sm disabled:opacity-40"
            >
              {loading ? 'Signing...' : 'Sign with SPHINCS+'}
            </button>

            {signatureB64 && (
              <div className="bg-white/5 border border-white/10 rounded-2xl p-3 sm:p-4 rounded-2xl">
                <div className="text-[10px] font-black text-white uppercase mb-1">Signature ({(signatureB64.length * 0.75 / 1024).toFixed(1)} KB)</div>
                <code className="block text-[10px] sm:text-xs font-mono text-white break-all font-bold max-h-32 overflow-y-auto">
                  {signatureB64.slice(0, 200)}...{signatureB64.slice(-100)}
                </code>
                <button onClick={() => copy(signatureB64)} className="mt-2 clay-button px-3 py-1 text-[10px]">
                  Copy Signature
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ─── Tab: Verify & Submit ─── */}
      {tab === 'verify' && (
        <div className="bg-white/5 border border-white/10 rounded-2xl p-5 sm:p-8 max-w-lg mx-auto space-y-4">
          <h3 className="text-lg sm:text-xl font-black text-white mb-4 text-center">Off-Chain Verification</h3>

          <button
            onClick={handleOffChainVerify}
            disabled={loading || !signatureB64}
            className="w-full clay-button py-3 sm:py-4 text-sm disabled:opacity-40"
          >
            {loading ? 'Verifying...' : 'Verify Signature Off-Chain'}
          </button>

          <div className="border-t border-white/10 pt-4">
            <h4 className="text-sm font-black text-white mb-2 text-center">Submit to Backend</h4>
            <p className="text-[10px] text-white/50 font-bold text-center mb-3">
              Submit your PQ public key for off-chain verification. The owner will update the Merkle root on MintGate.
            </p>
            <button
              onClick={handleSubmitToBackend}
              disabled={loading || !pqPubKeyB64}
              className="w-full clay-button clay-button-secondary py-3 text-sm disabled:opacity-40"
            >
              {loading ? 'Submitting...' : 'Submit for PQ Verification'}
            </button>
          </div>

          {myRecord && (
            <div className="bg-white/5 border border-white/10 rounded-2xl p-3 sm:p-4 rounded-2xl bg-white/40">
              <div className="text-[10px] font-black text-white/50 uppercase mb-1">Your Submission Status</div>
              <div className="flex items-center gap-2">
                <span className={`text-xs font-black px-2 py-0.5 rounded-full ${myRecord.status === 'verified' ? 'bg-white/5 border border-white/10 rounded-2xl text-white/80' : 'bg-white/5 border border-white/10 rounded-2xl text-white/80'}`}>
                  {myRecord.status.toUpperCase()}
                </span>
                <span className="text-[10px] text-white/40 font-bold">
                  {myRecord.merkle_leaf?.slice(0, 20)}...
                </span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ─── Tab: Mint Gate ─── */}
      {tab === 'mintgate' && (
        <div className="space-y-4 sm:space-y-5 max-w-lg mx-auto">
          <div className="bg-white/5 border border-white/10 rounded-2xl p-5 sm:p-8">
            <h3 className="text-lg sm:text-xl font-black text-white mb-4 text-center">Unlock Mint Gate</h3>
            <p className="text-xs text-white/50 font-bold text-center mb-4">
              After your PQ key is verified, build your Merkle Proof here to unlock on-chain minting.
            </p>

            <button
              onClick={handleBuildMerkleProof}
              disabled={loading || !pqPubKeyB64}
              className="w-full clay-button py-3 sm:py-4 text-sm disabled:opacity-40 mb-4"
            >
              {loading ? 'Building...' : 'Build Merkle Proof'}
            </button>

            {merkleProof.length > 0 && (
              <div className="space-y-3">
                <div className="bg-white/5 border border-white/10 rounded-2xl p-3 sm:p-4 rounded-2xl">
                  <div className="text-[10px] font-black text-white uppercase mb-1">Merkle Root</div>
                  <code className="block text-[10px] sm:text-xs font-mono text-white break-all font-bold">{merkleRoot}</code>
                </div>
                <div className="bg-white/5 border border-white/10 rounded-2xl p-3 sm:p-4 rounded-2xl">
                  <div className="text-[10px] font-black text-white uppercase mb-1">Merkle Proof ({merkleProof.length} nodes)</div>
                  <div className="space-y-1 max-h-40 overflow-y-auto">
                    {merkleProof.map((p, i) => (
                      <code key={i} className="block text-[10px] font-mono text-white break-all font-bold">{p}</code>
                    ))}
                  </div>
                  <button onClick={() => copy(JSON.stringify(merkleProof))} className="mt-2 clay-button px-3 py-1 text-[10px]">
                    Copy Proof JSON
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Mint Parameters */}
          <div className="bg-white/5 border border-white/10 rounded-2xl p-5 sm:p-8">
            <h3 className="text-base font-black text-white mb-2 text-center">Mint Parameters</h3>
            <p className="text-[10px] text-white/50 font-bold text-center mb-3">
              Advanced: use these with mintWithProof() via Etherscan or a direct contract call.
            </p>
            <div className="space-y-3">
              <div>
                <label className="block text-[10px] text-white/50 uppercase tracking-wider font-bold mb-1">Epoch</label>
                <input
                  type="number"
                  value={epoch}
                  onChange={(e) => setEpoch(e.target.value)}
                  placeholder="0"
                  className="w-full clay-input px-3 py-2 text-xs font-mono text-black placeholder-orange-900/30 font-bold"
                />
              </div>
              <div>
                <label className="block text-[10px] text-white/50 uppercase tracking-wider font-bold mb-1">pkHash (bytes32)</label>
                <code className="block text-[10px] sm:text-xs font-mono text-white break-all font-bold bg-white/5 border border-white/10 rounded-2xl p-2">
                  {pqPubKeyB64 ? buildPkHash(Uint8Array.from(atob(pqPubKeyB64), c => c.charCodeAt(0))) : 'Generate keypair first'}
                </code>
                {pqPubKeyB64 && (
                  <button onClick={() => copy(buildPkHash(Uint8Array.from(atob(pqPubKeyB64), c => c.charCodeAt(0))))} className="mt-2 clay-button px-3 py-1 text-[10px]">
                    Copy pkHash
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* How to use */}
          <div className="bg-white/5 border border-white/10 rounded-2xl p-4 sm:p-6">
            <h4 className="text-sm font-black text-white mb-2">About the Post-Quantum Mint Gate</h4>
            <p className="text-xs text-white/60 font-semibold mb-2">
              The main <strong>Mint</strong> tab is a standard open mint — no PQ setup required.
            </p>
            <ol className="text-xs text-white/60 font-semibold space-y-2 list-decimal list-inside">
              <li>Generate a SPHINCS+ keypair in the <strong>Generate Keys</strong> tab.</li>
              <li>Sign the mint-gate message in the <strong>Sign</strong> tab.</li>
              <li>Submit for verification in the <strong>Verify & Submit</strong> tab.</li>
              <li>Once verified, return here and <strong>Build Merkle Proof</strong>.</li>
              <li>Use <strong>mintWithProof()</strong> directly on the contract with the parameters above.</li>
            </ol>
          </div>
        </div>
      )}
    </div>
  );
}
