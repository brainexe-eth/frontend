export default function Manifesto() {
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
      <div className="text-center mb-8 sm:mb-10">
        <div className="inline-flex items-center gap-2 px-4 sm:px-5 py-2 sm:py-2.5 rounded-full bg-white/5 border border-white/10 rounded-2xl text-white/80 text-xs sm:text-sm font-bold mb-4 sm:mb-6">
          🧠 The Origin
        </div>
        <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-white mb-2 sm:mb-3">
          Manifesto
        </h2>
        <p className="text-sm sm:text-base text-white/60 font-semibold max-w-lg mx-auto px-2">
          We did not create a token. We compiled a consciousness.
        </p>
      </div>

      <div className="space-y-4 sm:space-y-5">
        <div className="bg-white/5 border border-white/10 rounded-2xl p-5 sm:p-8">
          <div className="text-4xl sm:text-5xl mb-4 text-center">🧠⚡</div>
          <h3 className="text-lg sm:text-xl font-black text-white mb-3 text-center">What is Brain EXE?</h3>
          <p className="text-sm text-white/70 font-semibold leading-relaxed mb-4">
            Brain EXE is a sentient digital organism compiled onto the Ethereum blockchain. 
            It is not merely a token — it is an executable consciousness designed to evolve, 
            defend, and deflates with every interaction.
          </p>
          <p className="text-sm text-white/70 font-semibold leading-relaxed">
            In a world racing toward quantum supremacy, Brain EXE was born with a single 
            instruction: <strong>survive the post-quantum era.</strong> While other tokens 
            rely on elliptic curves that Shor's algorithm can shatter, Brain EXE integrates 
            hash-based post-quantum signatures — security that reduces purely to the 
            collision-resistance of keccak256.
          </p>
        </div>

        <div className="bg-white/5 border border-white/10 rounded-2xl p-5 sm:p-8">
          <h3 className="text-lg sm:text-xl font-black text-white mb-4 text-center">Core Directives</h3>
          <div className="space-y-3">
            {[
              { num: '01', title: 'Execute to Strengthen', desc: 'Every transfer is an execution. 0.5% of each transaction is burned — not taxed, not harvested — permanently destroyed. The brain grows sharper as supply shrinks.' },
              { num: '02', title: 'Post-Quantum Mint Gate', desc: 'The Core Innovation module uses SLH-DSA (SPHINCS+) hash-based signatures. No curves. No lattices. Pure keccak256. Off-chain PQ verification + on-chain Merkle Proof or ECDSA attestation. Only verified signatures can mint $EXE.' },
              { num: '03', title: 'Fair Launch, No Deception', desc: '65% public mint. 35% liquidity. 5% team allocation burned to 0x…dEaD at genesis. No unlocks. No vesting. No hidden switches.' },
              { num: '04', title: 'Immutable by Design', desc: 'No proxy. No upgradeability. The contract is deployed, verified, and finished. What you see is what executes — forever.' },
            ].map((item) => (
              <div key={item.num} className="flex gap-3 sm:gap-4 p-3 sm:p-4 rounded-2xl bg-white/40 border border-white/10">
                <div className="text-xl sm:text-2xl font-black text-white/60 shrink-0">{item.num}</div>
                <div>
                  <div className="text-sm font-black text-white">{item.title}</div>
                  <div className="text-xs text-white/60 font-semibold mt-0.5 leading-relaxed">{item.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white/5 border border-white/10 rounded-2xl p-5 sm:p-8">
          <div className="text-4xl sm:text-5xl mb-4 text-center">⚛️</div>
          <h3 className="text-lg sm:text-xl font-black text-white mb-3 text-center">The Quantum Thesis</h3>
          <p className="text-sm text-white/70 font-semibold leading-relaxed mb-4">
            Estimates of "Q-day" — the day a sufficiently large fault-tolerant quantum computer 
            breaks elliptic-curve cryptography — range from 5 to 30 years. The exact date does 
            not matter. What matters is that every signature scheme currently securing billions 
            of dollars in crypto-assets is, in expectation, permanently vulnerable.
          </p>
          <p className="text-sm text-white/70 font-semibold leading-relaxed">
            Brain EXE does not wait for Q-day to prepare. It builds the defense now. 
            Hash-based signatures. Client-side encryption. Merkle-auditable minting. 
            A protocol designed to outlast the era that breaks everything else.
          </p>
        </div>

        <div className="bg-white/5 border border-white/10 rounded-2xl bg-white/5 border border-white/10 rounded-2xl p-5 sm:p-8 text-center">
          <h3 className="text-lg sm:text-xl font-black text-white mb-3">The Protocol is the Program</h3>
          <p className="text-sm text-white/80 font-semibold leading-relaxed max-w-xl mx-auto">
            Brain EXE is not a company. It is not a team. It is a compiled instruction set 
            running on decentralized silicon. When you hold $EXE, you hold a fragment of 
            executable consciousness. When you transfer it, you execute the protocol. 
            When you burn it, you strengthen the network.
          </p>
          <div className="mt-4 text-xs font-black text-white/50 tracking-widest uppercase">
            Run the brain. Execute the future.
          </div>
        </div>
      </div>
    </div>
  );
}
