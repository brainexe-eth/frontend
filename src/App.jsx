import { useState } from 'react';
import { createThirdwebClient, getContract, prepareContractCall } from 'thirdweb';
import { sepolia } from 'thirdweb/chains';
import { toEther, toWei } from 'thirdweb/utils';
import {
  useActiveAccount,
  useActiveWallet,
  useReadContract,
  useSendTransaction,
  useConnectModal,
  useDisconnect,
} from 'thirdweb/react';
import CoreInnovation from './components/CoreInnovation';
import Whitepaper from './components/Whitepaper';
import Manifesto from './components/Manifesto';
import Scene3D from './components/Scene3D';
import { VFXWrapper } from './components/VFXText';


const CLIENT_ID = '5003f0d0502ba792138ac609d201ed27';
const CONTRACT_ADDRESS = '0xe7663C61A12d5c54530a17Fa295d3345DEF639a0';
const MINTABLE_SUPPLY = 650_000_000;
const RATE_ETH = 0.001;
const RATE_TOKENS = 50_000;

const client = createThirdwebClient({ clientId: CLIENT_ID });

const contract = getContract({
  client,
  chain: sepolia,
  address: CONTRACT_ADDRESS,
});

function fmtNumber(num) {
  if (num === undefined || num === null || Number.isNaN(num)) return '—';
  return Number(num).toLocaleString('en-US', { maximumFractionDigits: 0 });
}

function App() {
  const account = useActiveAccount();
  const address = account?.address;
  const activeWallet = useActiveWallet();
  const { connect, isConnecting } = useConnectModal();
  const { disconnect } = useDisconnect();

  const [ethInput, setEthInput] = useState('');
  const [message, setMessage] = useState('');
  const [txHash, setTxHash] = useState(null);
  const [activeTab, setActiveTab] = useState('mint');
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  // (PQ inputs removed for simple mint flow)

  const { data: mintEnabled } = useReadContract({
    contract,
    method: 'function mintEnabled() view returns (bool)',
  });

  const { data: totalMinted } = useReadContract({
    contract,
    method: 'function totalMinted() view returns (uint256)',
  });

  const { data: maxMintPerWallet } = useReadContract({
    contract,
    method: 'function maxMintPerWallet() view returns (uint256)',
  });

  const { data: mintedByWallet } = useReadContract({
    contract,
    method: 'function mintedByWallet(address) view returns (uint256)',
    params: address ? [address] : undefined,
    queryOptions: { enabled: !!address },
  });

  const { data: burnFee } = useReadContract({
    contract,
    method: 'function burnFee() view returns (uint256)',
  });


  const { mutate: sendTransaction, isPending } = useSendTransaction();

  const mintedNum = totalMinted ? Number(toEther(totalMinted)) : 0;
  const percent = ((mintedNum / MINTABLE_SUPPLY) * 100).toFixed(2);
  const remaining = MINTABLE_SUPPLY - mintedNum;
  const maxWalletNum = maxMintPerWallet ? Number(toEther(maxMintPerWallet)) : 500_000;
  const mintedWalletNum = mintedByWallet && address ? Number(toEther(mintedByWallet)) : 0;
  const walletLeftTokens = maxWalletNum - mintedWalletNum;

  const tokenPreview = (() => {
    const val = parseFloat(ethInput);
    if (isNaN(val) || val <= 0) return '0';
    return fmtNumber((val / RATE_ETH) * RATE_TOKENS);
  })();

  const handleConnect = async () => {
    try {
      await connect({ client, chain: sepolia });
    } catch (err) {
      setMessage('Failed to connect wallet: ' + (err?.message || 'Unknown error'));
    }
  };

  const handleMax = () => {
    if (walletLeftTokens <= 0) { setEthInput('0'); return; }
    const ethLeft = (walletLeftTokens / RATE_TOKENS) * RATE_ETH;
    const rounded = Math.floor(ethLeft * 1000) / 1000;
    setEthInput(rounded > 0 ? rounded.toFixed(3) : '0');
  };

  const handleMint = async () => {
    const val = parseFloat(ethInput);
    if (isNaN(val) || val <= 0) { setMessage('Enter a valid ETH amount.'); return; }
    const tokensToMint = (val / RATE_ETH) * RATE_TOKENS;
    if (tokensToMint > walletLeftTokens) { setMessage('Exceeds wallet cap.'); return; }
    if (mintedNum + tokensToMint > MINTABLE_SUPPLY) { setMessage('Exceeds remaining public supply.'); return; }

    setMessage('Preparing transaction...');
    setTxHash(null);
    try {
      const wei = toWei(val.toString());
      const tx = prepareContractCall({ contract, method: 'function mint() payable', value: wei });
      await sendTransaction(tx, {
        onSuccess: (receipt) => { setMessage('Successfully minted!'); setTxHash(receipt.transactionHash); setEthInput(''); },
        onError: (err) => { setMessage('Transaction failed: ' + (err.message || 'User rejected')); },
      });
    } catch (err) {
      setMessage('Transaction failed: ' + (err.message || 'User rejected'));
    }
  };

  return (
    <VFXWrapper>
    <div className="min-h-screen bg-black relative overflow-x-hidden">
      <Scene3D />

      {/* Navigation */}
      <nav className="sticky top-0 z-50 bg-black border-b border-white/10">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-2 sm:gap-3">
            <img src="/logo.png" alt="Brain EXE" className="w-9 h-9 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl object-cover" />
            <span className="text-lg sm:text-2xl font-bold text-white" style={{ fontFamily: 'Fredoka, sans-serif' }}>
              Brain EXE
            </span>
          </div>

          {/* Desktop Nav */}
          <div className="hidden sm:flex items-center gap-1 sm:gap-2">
            {[
              { id: 'mint', label: 'Mint' },
              { id: 'core', label: 'Core Innovation' },
              { id: 'manifesto', label: 'Manifesto' },
              { id: 'whitepaper', label: 'Whitepaper' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => { setActiveTab(tab.id); setMessage(''); }}
                className={`px-3 sm:px-5 py-2 sm:py-2.5 rounded-xl sm:rounded-2xl text-xs sm:text-sm font-bold transition-all whitespace-nowrap ${
                  activeTab === tab.id ? 'bg-white text-black font-bold' : 'text-white/60 hover:text-white hover:bg-white/10'
                }`}
              >
                {tab.label}
              </button>
            ))}
            {!address ? (
              <button onClick={handleConnect} disabled={isConnecting} className="bg-white text-black px-3 sm:px-5 py-2 sm:py-2.5 text-xs sm:text-sm ml-1 sm:ml-2 whitespace-nowrap rounded-xl font-bold hover:bg-gray-200 transition-colors">
                {isConnecting ? '...' : 'Connect'}
              </button>
            ) : (
              <div className="flex items-center gap-1 sm:gap-2 ml-1 sm:ml-2">
                <div className="bg-white/10 px-2 sm:px-3 py-1.5 sm:py-2 text-[10px] font-bold text-white font-mono rounded-xl">
                  {address.slice(0, 6)}...{address.slice(-4)}
                </div>
                <button onClick={() => activeWallet && disconnect(activeWallet)} className="bg-white/10 text-white px-2 sm:px-3 py-2 sm:py-2.5 text-[10px] sm:text-xs rounded-xl hover:bg-white/20 transition-colors">
                  ✕
                </button>
              </div>
            )}
          </div>

          {/* Mobile Nav */}
          <div className="flex sm:hidden items-center gap-2">
            {!address ? (
              <button onClick={handleConnect} disabled={isConnecting} className="bg-white text-black px-3 py-2 text-xs whitespace-nowrap rounded-xl font-bold hover:bg-gray-200 transition-colors">
                {isConnecting ? '...' : 'Connect'}
              </button>
            ) : (
              <button onClick={() => activeWallet && disconnect(activeWallet)} className="bg-white/10 text-white px-2 py-2 text-xs rounded-xl hover:bg-white/20 transition-colors">
                ✕
              </button>
            )}
            <button
              onClick={() => setMobileNavOpen(!mobileNavOpen)}
              className="w-9 h-9 flex items-center justify-center rounded-xl bg-white/10 text-white hover:bg-white/20 transition-colors"
              aria-label="Menu"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                {mobileNavOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile Nav Dropdown */}
        {mobileNavOpen && (
          <div className="sm:hidden border-t border-white/10 bg-black/95 backdrop-blur-xl">
            <div className="px-4 py-3 space-y-1">
              {[
                { id: 'mint', label: 'Mint' },
                { id: 'core', label: 'Core Innovation' },
                { id: 'manifesto', label: 'Manifesto' },
                { id: 'whitepaper', label: 'Whitepaper' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => { setActiveTab(tab.id); setMessage(''); setMobileNavOpen(false); }}
                  className={`w-full text-left px-4 py-3 rounded-xl text-sm font-bold transition-all ${
                    activeTab === tab.id ? 'bg-white text-black' : 'text-white/70 hover:text-white hover:bg-white/10'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
              {address && (
                <div className="px-4 py-2 text-[10px] font-bold text-white/40 font-mono">
                  {address}
                </div>
              )}
            </div>
          </div>
        )}
      </nav>

      {/* Mint Tab */}
      {activeTab === 'mint' && (
        <div className="relative z-10">
          <section className="pt-8 sm:pt-16 pb-8 sm:pb-12 px-4 sm:px-6">
            <div className="max-w-3xl mx-auto text-center">
              <div className="inline-flex items-center gap-2 px-4 sm:px-5 py-2 sm:py-2.5 rounded-full bg-white/10 text-white text-xs sm:text-sm font-bold mb-6 sm:mb-8 animate-float-medium border border-white/10">
                🧠 $EXE Protocol
              </div>
              <h1 className="text-3xl sm:text-5xl md:text-6xl font-black text-white mb-4 sm:mb-6 leading-tight">
                <span className="glitch-text" data-text="Mint">Mint</span> <span className="text-white/50">$EXE</span>
              </h1>
              <p className="text-base sm:text-lg text-white/60 max-w-xl mx-auto mb-6 sm:mb-8 leading-relaxed px-2">
                The next gen meme coin gated by real post-quantum signature.
              </p>

              {/* Contract Address */}
              <div className="bg-white/5 p-3 sm:p-4 max-w-lg mx-auto mb-8 sm:mb-10 rounded-2xl border border-white/10">
                <div className="text-[10px] sm:text-xs font-bold text-white/40 uppercase tracking-wider mb-1">Contract Address</div>
                <div className="flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-3">
                  <code className="text-xs sm:text-sm font-mono text-white font-bold break-all text-center">{CONTRACT_ADDRESS}</code>
                  <button onClick={() => navigator.clipboard.writeText(CONTRACT_ADDRESS)} className="shrink-0 bg-white text-black px-3 py-1.5 text-xs w-full sm:w-auto rounded-xl font-bold hover:bg-gray-200 transition-colors">Copy</button>
                </div>
              </div>
            </div>
          </section>

          <section className="pb-12 sm:pb-20 px-4 sm:px-6">
            <div className="max-w-3xl mx-auto space-y-6 sm:space-y-8">
              {/* Real-time Allocation */}
              <div className="bg-white/5 p-4 sm:p-6 rounded-2xl border border-white/10">
                <div className="text-[10px] text-white/40 uppercase tracking-wider font-bold mb-3 text-center">Live Allocation</div>
                <div className="flex h-4 sm:h-5 rounded-full overflow-hidden mb-3">
                  <div className="h-full bg-white transition-all duration-700" style={{ width: `${((mintedNum / 1_000_000_000) * 100).toFixed(2)}%` }} />
                  <div className="h-full bg-white/40 transition-all duration-700" style={{ width: `${((95 - (mintedNum / 1_000_000_000) * 100)).toFixed(2)}%` }} />
                  <div className="h-full bg-white/20 transition-all duration-700" style={{ width: `5%` }} />
                </div>
                <div className="flex flex-wrap justify-center gap-x-4 gap-y-1 text-[10px] sm:text-xs font-bold text-white/70">
                  <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-white" /> Public {((mintedNum / 1_000_000_000) * 100).toFixed(2)}%</span>
                  <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-white/40" /> LP {((95 - (mintedNum / 1_000_000_000) * 100)).toFixed(2)}%</span>
                  <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-white/20" /> Team 5% 🔥</span>
                </div>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
                {[
                  { label: 'Public Supply', value: '650,000,000' },
                  { label: 'Rate', value: '0.001 ETH = 50K' },
                  { label: 'Burn Fee', value: `${burnFee ? Number(burnFee) / 100 : 1}%` },
                ].map((s, i) => (
                  <div key={i} className="bg-white/5 p-3 sm:p-4 text-center rounded-2xl border border-white/10">
                    <div className="text-[10px] text-white/40 uppercase tracking-wider font-bold mb-1">{s.label}</div>
                    <div className="font-black text-xs sm:text-sm text-white">{s.value}</div>
                  </div>
                ))}
              </div>

              {/* Progress */}
              <div className="bg-white/5 p-4 sm:p-6 rounded-2xl border border-white/10">
                <div className="flex justify-between items-end mb-3">
                  <span className="text-2xl font-black text-white">{percent}%</span>
                  <span className="text-xs text-white/40 font-bold">{remaining.toLocaleString()} remaining</span>
                </div>
                <div className="h-3 bg-white/10 rounded-full overflow-hidden">
                  <div className="h-full rounded-full transition-all duration-1000 bg-white" style={{ width: `${Math.min(Number(percent), 100)}%` }} />
                </div>
                <div className="mt-3 flex justify-between text-[10px] text-white/40 font-bold uppercase tracking-wider">
                  <span>{fmtNumber(mintedNum)} / 650,000,000 minted</span>
                  <span>cap: 650M $EXE (65%)</span>
                </div>
              </div>

              {/* Alerts */}
              {message && (
                <div className={`p-4 text-center text-sm font-bold rounded-2xl border ${message.toLowerCase().includes('failed') ? 'bg-white/5 border-white/10 text-white' : message.toLowerCase().includes('success') ? 'bg-white text-black border-white' : 'bg-white/5 border-white/10 text-white/50'}`}>
                  {message}
                </div>
              )}
              {txHash && (
                <div className="text-center">
                  <a href={`https://sepolia.etherscan.io/tx/${txHash}`} target="_blank" rel="noreferrer" className="text-[10px] text-white/60 hover:text-white font-bold tracking-wider underline">view transaction on etherscan ↗</a>
                </div>
              )}

              {/* Mint Panel */}
              <div className="bg-white/5 p-4 sm:p-6 md:p-8 rounded-2xl border border-white/10">
                <div className="flex items-center justify-between mb-4 sm:mb-6">
                  <h3 className="text-base sm:text-lg font-black text-white">Mint Tokens</h3>
                  <span className={`px-2 sm:px-3 py-1 rounded-full text-[10px] font-black tracking-wider ${mintEnabled ? 'bg-white text-black' : 'bg-white/10 text-white'}`}>
                    {mintEnabled ? 'ACTIVE' : 'PAUSED'}
                  </span>
                </div>
                <div className="grid sm:grid-cols-2 gap-4 sm:gap-6 mb-4 sm:mb-6">
                  <div>
                    <label className="block text-[10px] text-white/40 uppercase tracking-wider font-bold mb-2">Send ETH</label>
                    <div className="flex gap-2">
                      <input type="number" placeholder="0.000" step="0.001" min="0.001" value={ethInput} onChange={(e) => setEthInput(e.target.value)} className="flex-1 bg-black border border-white/20 px-3 sm:px-4 py-2.5 sm:py-3 text-white text-sm font-mono font-bold placeholder-white/20 rounded-xl focus:outline-none focus:border-white/40" />
                      <button onClick={handleMax} className="bg-white/10 text-white px-3 sm:px-4 py-2.5 sm:py-3 text-xs rounded-xl font-bold hover:bg-white/20 transition-colors">MAX</button>
                    </div>
                  </div>
                  <div>
                    <label className="block text-[10px] text-white/40 uppercase tracking-wider font-bold mb-2">Receive EXE</label>
                    <div className="bg-black border border-white/20 px-3 sm:px-4 py-2.5 sm:py-3 text-sm text-white font-mono font-bold flex items-center rounded-xl">
                      <span>{tokenPreview}</span><span className="text-white/30 ml-2">EXE</span>
                    </div>
                  </div>
                </div>
                {address && (
                  <div className="mb-4 text-[10px] text-white/40 font-mono font-bold flex flex-wrap gap-x-4 gap-y-1">
                    <span>allowance: <span className="text-white">{fmtNumber(mintedWalletNum)}</span> / <span className="text-white">{fmtNumber(maxWalletNum)}</span> EXE</span>
                  </div>
                )}

                <button onClick={handleMint} disabled={isPending || !address || !mintEnabled} className="w-full bg-white text-black py-3 sm:py-4 text-sm font-bold rounded-2xl hover:bg-gray-200 transition-colors disabled:opacity-30 disabled:cursor-not-allowed">
                  {isPending ? 'Minting...' : !address ? 'Connect Wallet' : !mintEnabled ? 'Minting Paused' : 'Mint $EXE'}
                </button>
              </div>
            </div>
          </section>
        </div>
      )}

      {/* Core Innovation Tab */}
      {activeTab === 'core' && (
        <div className="relative z-10">
          <CoreInnovation />
        </div>
      )}

      {/* Manifesto Tab */}
      {activeTab === 'manifesto' && (
        <div className="relative z-10">
          <Manifesto />
        </div>
      )}

      {/* Whitepaper Tab */}
      {activeTab === 'whitepaper' && (
        <div className="relative z-10">
          <Whitepaper />
        </div>
      )}

      {/* Footer */}
      <footer className="relative z-10 py-10 sm:py-12 px-4 sm:px-6 border-t border-white/10">
        <div className="max-w-3xl mx-auto text-center">
          <div className="flex items-center justify-center gap-3 mb-4">
            <img src="/logo.png" alt="Brain EXE" className="w-10 h-10 rounded-xl object-cover border border-white/10" />
            <span className="text-xl font-black text-white" style={{ fontFamily: 'Fredoka, sans-serif' }}>Brain EXE</span>
          </div>

          {/* Social Links */}
          <div className="flex items-center justify-center gap-3 mb-5">
            <a
              href="https://x.com/brainexeth"
              target="_blank"
              rel="noreferrer"
              className="bg-white text-black px-4 py-2.5 text-xs flex items-center gap-2 rounded-xl font-bold hover:bg-gray-200 transition-colors"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
              Twitter
            </a>
            <a
              href="https://github.com/brainexe-eth"
              target="_blank"
              rel="noreferrer"
              className="bg-white/10 text-white px-4 py-2.5 text-xs flex items-center gap-2 rounded-xl font-bold hover:bg-white/20 transition-colors"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"/></svg>
              GitHub
            </a>
          </div>

          <p className="text-xs text-white/40 font-bold">this project is for educational purposes. always DYOR before transacting.</p>
        </div>
      </footer>
    </div>
    </VFXWrapper>
  );
}

export default App;
