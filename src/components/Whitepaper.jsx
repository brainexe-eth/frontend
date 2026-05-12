import { useState } from 'react';
import { createThirdwebClient, getContract } from 'thirdweb';
import { sepolia } from 'thirdweb/chains';
import { toEther } from 'thirdweb/utils';
import { useReadContract } from 'thirdweb/react';

const CLIENT_ID = '5003f0d0502ba792138ac609d201ed27';
const CONTRACT_ADDRESS = '0x7C089f83E43B467D1D0A1727882D96525810aF25';

const client = createThirdwebClient({ clientId: CLIENT_ID });
const contract = getContract({ client, chain: sepolia, address: CONTRACT_ADDRESS });

const ROADMAP = [
  {
    phase: 'T-0',
    title: 'Genesis',
    desc: 'Deploy Contract Mint and Contract Token. LP and team reserves pre-minted. Team reserve subsequently burned to 0x…dEaD.',
    status: 'done',
  },
  {
    phase: 'First Mint',
    title: 'Merkle Root Publishing',
    desc: 'Backend cron starts publishing Merkle roots every 5 minutes. Every mint batch is timestamped and independently auditable.',
    status: 'done',
  },
  {
    phase: '50% Mint',
    title: 'Audit Bundle',
    desc: 'Full audit bundle published; community can independently verify every mint, every root, and every state transition off-chain.',
    status: 'active',
  },
  {
    phase: '100% Mint',
    title: 'Liquidity Deployment',
    desc: 'LP reserve paired with raised ETH on Uniswap. Protocol is finished forever — no team unlock, no admin keys, no upgrades.',
    status: 'pending',
  },
];



const SPECS = [
  { label: 'Token Standard', value: 'ERC-20' },
  { label: 'Max Supply', value: '1,000,000,000 EXE' },
  { label: 'Mintable Supply', value: '650,000,000 EXE (65%)' },
  { label: 'Decimals', value: '18' },
  { label: 'Chain', value: 'Ethereum (Sepolia testnet)' },
  { label: 'Rate', value: '0.001 ETH = 50,000 EXE' },
  { label: 'Max / Wallet', value: '500,000 EXE' },
  { label: 'Transfer Burn Fee', value: '0.5%' },
  { label: 'Burn Address', value: '0x0000...0000' },
  { label: 'Fee Recipient', value: 'Burned (deflationary)' },
];

const TRUST = [
  {
    title: 'No Admin Keys',
    icon: '🔑',
    text: 'Ownership renounced at deployment. No pause, no blacklist, no upgrade proxy. The contract is immutable.',
  },
  {
    title: 'Burned Team Allocation',
    icon: '🔥',
    text: '5% team reserve minted to deployer and sent to 0x…dEaD within the same block. Verifiable on-chain. Forever unspendable.',
  },
  {
    title: 'Merkle Auditable Mints',
    icon: '🌲',
    text: 'Every mint batch produces a Merkle root published every 5 minutes. Anyone can reconstruct the full mint tree offline.',
  },
  {
    title: 'Quantum-Ready Custody',
    icon: '⚛️',
    text: 'SLH-DSA (hash-based post-quantum) wallet module for high-value custody. Reduces to keccak256 security only.',
  },
  {
    title: 'Deflationary Burn',
    icon: '🔥',
    text: '0.5% of every transfer is burned to address(0). Supply shrinks with every trade. No team treasury, no admin drain.',
  },
  {
    title: 'No Vesting, No Unlock',
    icon: '⏱️',
    text: 'Protocol is finished at 100% mint. LP deployed. No future token emissions. No team cliff. Nothing left to unlock.',
  },
];

export default function Whitepaper() {
  const [activeSection, setActiveSection] = useState('token');

  const { data: totalMinted } = useReadContract({
    contract,
    method: 'function totalMinted() view returns (uint256)',
  });

  const mintedNum = totalMinted ? Number(toEther(totalMinted)) : 0;
  const publicPct = (mintedNum / 1_000_000_000) * 100;
  const lpPct = 95 - publicPct;
  const teamPct = 5;

  const allocation = [
    { label: 'Public Mint', percent: publicPct, color: '#ffffff', desc: `Fair launch. ${mintedNum.toLocaleString()} EXE minted so far.` },
    { label: 'Liquidity Pool', percent: lpPct, color: '#ffffffaa', desc: `Auto-adjusts as minting progresses. Currently ${lpPct.toFixed(2)}%.` },
    { label: 'Team', percent: teamPct, color: '#ffffff66', desc: 'Pre-minted at T-0 and immediately burned to 0x…dEaD. Forever 0.' },
  ];

  const sections = [
    { id: 'token', label: 'Token' },
    { id: 'mint', label: 'Mint' },
    { id: 'core', label: 'PQ Gate' },
    { id: 'allocation', label: 'Allocation' },
    { id: 'trust', label: 'Trust' },
    { id: 'contract', label: 'Contract' },
    { id: 'roadmap', label: 'Roadmap' },
  ];

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
      {/* Header */}
      <div className="text-center mb-8 sm:mb-10">
        <div className="inline-flex items-center gap-2 px-4 sm:px-5 py-2 sm:py-2.5 rounded-full bg-white/5 border border-white/10 rounded-2xl text-white/80 text-xs sm:text-sm font-bold mb-4 sm:mb-6">
          📜 Whitepaper
        </div>
        <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-white mb-2 sm:mb-3">
          Protocol Specification
        </h2>
        <p className="text-sm sm:text-base text-white/60 font-semibold max-w-lg mx-auto px-2">
          A hash-based, post-quantum aware, fair-launch token with immutable mechanics and fully auditable minting.
        </p>
      </div>

      {/* Section Tabs */}
      <div className="flex flex-wrap justify-center gap-2 mb-8 sm:mb-10">
        {sections.map((s) => (
          <button
            key={s.id}
            onClick={() => setActiveSection(s.id)}
            className={`px-4 sm:px-5 py-2 sm:py-2.5 rounded-xl sm:rounded-2xl text-xs sm:text-sm font-bold transition-all whitespace-nowrap ${
              activeSection === s.id ? 'clay-button text-white' : 'text-white/70 hover:bg-white/10'
            }`}
          >
            {s.label}
          </button>
        ))}
      </div>

      {/* Token Spec */}
      {activeSection === 'token' && (
        <div className="bg-white/5 border border-white/10 rounded-2xl p-5 sm:p-8">
          <h3 className="text-lg sm:text-xl font-black text-white mb-5 sm:mb-6">Token Specification</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            {SPECS.map((spec, i) => (
              <div key={i} className="flex items-center justify-between p-3 sm:p-4 rounded-2xl bg-white/40 border border-white/10">
                <span className="text-xs sm:text-sm font-bold text-white/50">{spec.label}</span>
                <span className="text-xs sm:text-sm font-black text-white text-right">{spec.value}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Mint Mechanism */}
      {activeSection === 'mint' && (
        <div className="space-y-4 sm:space-y-5">
          <div className="bg-white/5 border border-white/10 rounded-2xl p-5 sm:p-8">
            <h3 className="text-lg sm:text-xl font-black text-white mb-4">Mint Mechanism</h3>
            <p className="text-sm text-white/70 font-semibold leading-relaxed mb-5">
              The public mint is a bonded, first-come-first-served sale. Users send ETH to the Mint Contract and receive EXE tokens instantly at a fixed rate. No bonding curve, no price discovery games, no bot advantage.
            </p>
            <div className="space-y-3">
              {[
                { step: '01', title: 'Fixed Rate', desc: '0.001 ETH = 50,000 EXE. The rate is hardcoded and immutable.' },
                { step: '02', title: 'Per-Wallet Cap', desc: 'Max 500,000 EXE per wallet. Prevents whale concentration and encourages broad distribution.' },
                { step: '03', title: 'Merkle Logging', desc: 'Every mint is hashed into a Merkle tree. Roots published every 5 minutes via backend cron.' },
                { step: '04', title: 'Supply Hard Cap', desc: '650,000,000 EXE mintable. Once reached, minting stops forever. No inflation.' },
              ].map((item) => (
                <div key={item.step} className="flex gap-3 sm:gap-4 p-3 sm:p-4 rounded-2xl bg-white/40 border border-white/10">
                  <div className="text-lg sm:text-xl font-black text-white/80 shrink-0">{item.step}</div>
                  <div>
                    <div className="text-sm font-black text-white">{item.title}</div>
                    <div className="text-xs text-white/60 font-semibold mt-0.5">{item.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white/5 border border-white/10 rounded-2xl p-5 sm:p-8">
            <h3 className="text-lg sm:text-xl font-black text-white mb-4">Tax Mechanics</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
              <div className="p-3 sm:p-4 rounded-2xl bg-white/5 border border-white/10 rounded-2xl text-center">
                <div className="text-2xl sm:text-3xl font-black text-white/70">0%</div>
                <div className="text-xs font-bold text-white/60 mt-1">Mint Tax</div>
                <p className="text-[10px] text-white/40 font-bold mt-1">Minting has zero tax. Full allocation to minter.</p>
              </div>
              <div className="p-3 sm:p-4 rounded-2xl bg-white/5 border border-white/10 rounded-2xl text-center">
                <div className="text-2xl sm:text-3xl font-black text-white/80">0.5%</div>
                <div className="text-xs font-bold text-white/60 mt-1">Transfer Burn</div>
                <p className="text-[10px] text-white/40 font-bold mt-1">Every transfer burns 0.5%. Deflationary forever.</p>
              </div>
              <div className="p-3 sm:p-4 rounded-2xl bg-white/5 border border-white/10 rounded-2xl text-center">
                <div className="text-2xl sm:text-3xl font-black text-white/80">↗</div>
                <div className="text-xs font-bold text-white/60 mt-1">Supply ↓</div>
                <p className="text-[10px] text-white/40 font-bold mt-1">Burns reduce total supply permanently. No cap refill.</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Core Innovation / PQ Gate */}
      {activeSection === 'core' && (
        <div className="space-y-4 sm:space-y-5">
          <div className="bg-white/5 border border-white/10 rounded-2xl p-5 sm:p-8">
            <h3 className="text-lg sm:text-xl font-black text-white mb-4">Core Innovation: Post-Quantum Mint Gate</h3>
            <p className="text-sm text-white/70 font-semibold leading-relaxed mb-5">
              A post-quantum mint gate built on SLH-DSA (SPHINCS+) hash-based signatures. Users generate a PQ keypair client-side, sign a challenge message, and submit for off-chain verification. Once verified, the user receives a Merkle Proof or ECDSA attestation that unlocks on-chain minting. No elliptic curves in the PQ layer. Security reduces purely to keccak256 collision-resistance.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 mb-5">
              {[
                { label: 'Algorithm', value: 'SLH-DSA', color: 'bg-white/5 border border-white/10 rounded-2xl' },
                { label: 'Signature', value: '~8 KB', color: 'bg-white/5 border border-white/10 rounded-2xl' },
                { label: 'On-Chain', value: 'Merkle + ECDSA', color: 'bg-white/5 border border-white/10 rounded-2xl' },
              ].map((s, i) => (
                <div key={i} className={`${s.color} p-3 sm:p-4 rounded-2xl text-center`}>
                  <div className="text-xs font-bold text-white/50 uppercase">{s.label}</div>
                  <div className="text-lg sm:text-xl font-black text-white mt-1">{s.value}</div>
                </div>
              ))}
            </div>
            <div className="space-y-3">
              {[
                { title: 'Client-Side Key Generation', desc: 'SPHINCS+ keypairs are generated entirely in the browser using @noble/post-quantum. Private seeds are never transmitted.' },
                { title: 'Off-Chain PQ Verification', desc: 'Signatures are verified off-chain (frontend/backend) using SLH-DSA. No expensive PQ operations on-chain.' },
                { title: 'Merkle Proof or ECDSA Attestation', desc: 'After PQ verification, the backend issues a Merkle Proof or ECDSA attestation. On-chain only verifies these lightweight proofs.' },
                { title: 'Mint Gate Enforcement', desc: 'Only wallets with valid PQ attestation can mint $EXE. The mint function checks the Merkle root or ECDSA attestation before executing.' },
              ].map((item, i) => (
                <div key={i} className="flex items-start gap-3 p-3 sm:p-4 rounded-2xl bg-white/40 border border-white/10">
                  <span className="text-accent2 mt-0.5 text-white text-sm">✓</span>
                  <div>
                    <div className="text-sm font-black text-white">{item.title}</div>
                    <div className="text-xs text-white/60 font-semibold mt-0.5">{item.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Allocation */}
      {activeSection === 'allocation' && (
        <div className="bg-white/5 border border-white/10 rounded-2xl p-5 sm:p-8">
          <h3 className="text-lg sm:text-xl font-black text-white mb-5 sm:mb-6">Allocation Rationale</h3>
          <div className="space-y-4 sm:space-y-5">
            {allocation.map((item, i) => (
              <div key={i} className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-5">
                <div className="w-full sm:w-32 shrink-0">
                  <div className="text-2xl sm:text-3xl font-black" style={{ color: item.color }}>{item.percent}%</div>
                  <div className="text-xs font-bold text-white/50">{item.label}</div>
                </div>
                <div className="flex-1 h-3 sm:h-4 rounded-full bg-white/10 overflow-hidden">
                  <div className="h-full rounded-full transition-all duration-1000" style={{ width: `${item.percent}%`, background: item.color }} />
                </div>
                <div className="text-xs sm:text-sm text-white/60 font-semibold sm:text-right sm:w-48">{item.desc}</div>
              </div>
            ))}
          </div>
          <div className="mt-6 sm:mt-8 p-3 sm:p-4 rounded-2xl bg-white/5 border border-white/10 rounded-2xl text-center">
            <p className="text-xs sm:text-sm font-bold text-white">
              Team allocation (5%) is burned to 0x000000000000000000000000000000000000dEaD at T-0. 
              This is irreversible and verifiable on-chain.
            </p>
          </div>
        </div>
      )}

      {/* Trust Model */}
      {activeSection === 'trust' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
          {TRUST.map((item, i) => (
            <div key={i} className="bg-white/5 border border-white/10 rounded-2xl p-4 sm:p-6">
              <div className="text-2xl sm:text-3xl mb-2 sm:mb-3">{item.icon}</div>
              <h4 className="text-base sm:text-lg font-black text-white mb-1 sm:mb-2">{item.title}</h4>
              <p className="text-xs sm:text-sm text-white/60 font-semibold leading-relaxed">{item.text}</p>
            </div>
          ))}
        </div>
      )}

      {/* Contract Details */}
      {activeSection === 'contract' && (
        <div className="space-y-4 sm:space-y-5">
          <div className="bg-white/5 border border-white/10 rounded-2xl p-5 sm:p-8">
            <h3 className="text-lg sm:text-xl font-black text-white mb-5 sm:mb-6">Contract Details</h3>

            {/* Address */}
            <div className="p-3 sm:p-4 rounded-2xl bg-white/40 border border-white/10 mb-4">
              <div className="text-[10px] font-bold text-white/50 uppercase tracking-wider mb-1">Contract Address</div>
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
                <code className="text-xs sm:text-sm font-mono text-white font-bold break-all">{CONTRACT_ADDRESS}</code>
                <div className="flex gap-2 shrink-0 w-full sm:w-auto">
                  <button onClick={() => navigator.clipboard.writeText(CONTRACT_ADDRESS)} className="clay-button px-3 py-1.5 text-xs flex-1 sm:flex-none">Copy</button>
                  <a href={`https://sepolia.etherscan.io/address/${CONTRACT_ADDRESS}`} target="_blank" rel="noreferrer" className="clay-button clay-button-secondary px-3 py-1.5 text-xs text-center flex-1 sm:flex-none">Etherscan ↗</a>
                </div>
              </div>
            </div>

            {/* Deployment Info */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 mb-4">
              {[
                { label: 'Network', value: 'Ethereum Sepolia (Testnet)' },
                { label: 'Solidity Version', value: '0.8.28' },
                { label: 'EVM Target', value: 'Paris' },
                { label: 'Optimizer', value: 'Enabled (200 runs)' },
                { label: 'Token Standard', value: 'ERC-20 + Ownable + Pausable + ReentrancyGuard' },
                { label: 'Proxy Pattern', value: 'None (direct deployment)' },
                { label: 'Upgradeable', value: 'No' },
                { label: 'License', value: 'MIT' },
              ].map((item, i) => (
                <div key={i} className="flex items-center justify-between p-3 sm:p-4 rounded-2xl bg-white/40 border border-white/10">
                  <span className="text-xs sm:text-sm font-bold text-white/50">{item.label}</span>
                  <span className="text-xs sm:text-sm font-black text-white text-right">{item.value}</span>
                </div>
              ))}
            </div>

            {/* Verified Source */}
            <div className="p-3 sm:p-4 rounded-2xl bg-white/5 border border-white/10 rounded-2xl mb-4">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-lg">✅</span>
                <span className="text-sm font-black text-white">Verified Source Code</span>
              </div>
              <p className="text-xs text-white/70 font-semibold mb-3">
                Contract source code is verified on Etherscan. Anyone can inspect the implementation, verify the bytecode, and audit the logic independently.
              </p>
              <a href={`https://sepolia.etherscan.io/address/${CONTRACT_ADDRESS}#code`} target="_blank" rel="noreferrer" className="inline-block clay-button px-4 py-2 text-xs">
                View Verified Source ↗
              </a>
            </div>

            {/* Key Functions */}
            <div className="p-3 sm:p-4 rounded-2xl bg-white/40 border border-white/10">
              <div className="text-[10px] font-bold text-white/50 uppercase tracking-wider mb-3">Key Functions</div>
              <div className="space-y-2">
                {[
                  { sig: 'mint() payable', desc: 'Mint EXE by sending ETH. Fixed rate, capped supply.' },
                  { sig: 'transferBurnFee() view', desc: 'Returns current burn fee in basis points (default 50 = 0.5%).' },
                  { sig: 'burnFeeEnabled() view', desc: 'Returns true if burn tax is active.' },
                  { sig: 'totalMinted() view', desc: 'Total EXE minted by public so far.' },
                  { sig: 'mintedByWallet(address) view', desc: 'Amount minted by a specific wallet.' },
                  { sig: 'toggleMint(bool)', desc: 'Owner only. Enable or disable minting.' },
                  { sig: 'setTransferBurnFee(uint256)', desc: 'Owner only. Update burn fee (max 5%).' },
                  { sig: 'toggleBurnFee(bool)', desc: 'Owner only. Enable or disable burn tax.' },
                  { sig: 'withdraw()', desc: 'Owner only. Withdraw raised ETH from contract.' },
                  { sig: 'pause() / unpause()', desc: 'Owner only. Emergency pause/unpause all transfers.' },
                  { sig: 'BrainAccount.execute()', desc: 'Smart contract wallet — arbitrary call execution with programmable ownership.' },
                  { sig: 'BrainAccount.executeBatch()', desc: 'Batch multiple calls in one tx. Save gas, atomic execution.' },
                  { sig: 'BrainAccount.isValidSignature()', desc: 'EIP-1271 signature validation. Smart contracts can sign too.' },
                  { sig: 'BrainAccount.confirmOwnershipChange()', desc: 'Social recovery — confirm new owner after 2-day delay.' },
                ].map((fn, i) => (
                  <div key={i} className="flex flex-col sm:flex-row sm:items-start gap-1 sm:gap-3 p-2 rounded-xl bg-white/30">
                    <code className="text-xs font-mono font-bold text-white/70 shrink-0">{fn.sig}</code>
                    <span className="text-xs text-white/60 font-semibold">{fn.desc}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Roadmap */}
      {activeSection === 'roadmap' && (
        <div className="bg-white/5 border border-white/10 rounded-2xl p-5 sm:p-8">
          <h3 className="text-lg sm:text-xl font-black text-white mb-5 sm:mb-6">Roadmap</h3>
          <div className="relative">
            {/* Timeline line */}
            <div className="absolute left-4 sm:left-5 top-2 bottom-2 w-0.5 bg-white/20" />
            <div className="space-y-6 sm:space-y-8">
              {ROADMAP.map((item, i) => (
                <div key={i} className="relative flex gap-4 sm:gap-5 pl-1">
                  {/* Dot */}
                  <div className={`relative z-10 w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center text-xs sm:text-sm font-black shrink-0 ${
                    item.status === 'done'
                      ? 'bg-white/5 border border-white/10 rounded-2xl text-white/80'
                      : item.status === 'active'
                      ? 'bg-white/5 border border-white/10 rounded-2xl text-white/80'
                      : 'bg-white/10 text-white'
                  }`}>
                    {item.status === 'done' ? '✓' : i + 1}
                  </div>
                  <div className="flex-1 pt-0.5 sm:pt-1">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <span className="text-xs sm:text-sm font-black text-white">{item.phase}</span>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                        item.status === 'done'
                          ? 'bg-white/5 border border-white/10 rounded-2xl text-white/80'
                          : item.status === 'active'
                          ? 'bg-white/5 border border-white/10 rounded-2xl text-white/80'
                          : 'bg-white/10 text-white'
                      }`}>
                        {item.status === 'done' ? 'COMPLETED' : item.status === 'active' ? 'IN PROGRESS' : 'PENDING'}
                      </span>
                    </div>
                    <h4 className="text-sm sm:text-base font-black text-white mb-1">{item.title}</h4>
                    <p className="text-xs sm:text-sm text-white/60 font-semibold leading-relaxed">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Acknowledgements */}
      <div className="mt-8 sm:mt-10 text-center">
        <div className="bg-white/5 border border-white/10 rounded-2xl p-5 sm:p-6 inline-block max-w-2xl">
          <h4 className="text-sm sm:text-base font-black text-white mb-2 sm:mb-3">Acknowledgements</h4>
          <p className="text-xs sm:text-sm text-white/60 font-semibold leading-relaxed">
            Research on EVM-friendly post-quantum signatures. 
            Built with OpenZeppelin, Thirdweb, Ethers.js, and Supabase.
          </p>
        </div>
      </div>
    </div>
  );
}
