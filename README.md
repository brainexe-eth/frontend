# Brain EXE Frontend

> Interactive 3D minting interface for Brain EXE — the post-quantum meme coin.

Built with React 18, Vite, React Three Fiber, and Tailwind CSS.

## Features

- **3D Interactive Scene** — Floating "EXE" text and particle systems rendered with React Three Fiber
- **Post-Quantum Wallet** — SLH-DSA (SPHINCS+) hash-based signature generation in the browser
- **Web3 Integration** — Thirdweb SDK for wallet connection and contract interaction
- **VFX Effects** — WebGL shader effects via react-vfx
- **Responsive Design** — Tailwind CSS with custom glitch effects

## Tech Stack

| Layer | Technology |
|-------|------------|
| Framework | React 18 + Vite |
| 3D Graphics | @react-three/fiber, @react-three/drei, Three.js |
| VFX | react-vfx (WebGL shaders) |
| Styling | Tailwind CSS |
| Web3 SDK | Thirdweb + Ethers.js |
| Post-Quantum Crypto | SLH-DSA / SPHINCS+ (@noble/post-quantum) |
| Database | Supabase |

## Getting Started

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build
```

Open `http://localhost:5173` and connect your wallet.

## Project Structure

```
frontend/
├── src/
│   ├── App.jsx              # Main React app
│   ├── main.jsx             # Entry point
│   ├── index.css            # Global styles & glitch effects
│   ├── components/
│   │   ├── CoreInnovation.jsx   # PQ crypto showcase
│   │   ├── Whitepaper.jsx       # Protocol spec
│   │   ├── Manifesto.jsx        # Story & manifesto
│   │   ├── Scene3D.jsx          # 3D background scene
│   │   ├── MatrixRain.jsx       # Matrix rain effect
│   │   └── VFXText.jsx          # VFX text components
│   └── lib/
│       ├── crypto-pq.js         # Post-quantum crypto
│       ├── crypto.js            # AES encryption
│       ├── merkle-helper.js     # Merkle tree utilities
│       └── supabase.js          # Supabase client
├── public/
│   ├── logo.png
│   └── fonts/
├── index.html
├── package.json
├── tailwind.config.js
├── postcss.config.js
└── vite.config.js
```

## License

MIT
