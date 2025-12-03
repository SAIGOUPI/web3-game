🦄 Web3 Founder Simulator

A cyberpunk-themed idle clicker game where you simulate the journey of a Web3 developer, from writing the first line of code to minting your own achievement NFT on the Solana blockchain.

🎮 Game Mechanics

This is a classic incremental (idle) game with a Web3 twist.

1. The Grind (Clicker)

Write Code: Click the big button on the left to manually write code.

Earn Capital: Every line of code generates capital ($). Use this to fund your startup.

2. The Black Market (Upgrades)

Passive Income: Purchase items in the store to automate your workflow.

Items:

☕ Iced Americano: Basic productivity boost.

⌨️ Mech Keyboard: Faster typing.

👶 Intern: Cheap labor for passive income.

🤖 GPT-4 Sub: AI-powered coding.

👨‍💻 CTO: Massive architectural refactoring.

Visual Feedback: Every purchase adds a pixel-art character to your bottom "Co-working Space" bar.

3. The Objective (Web3 Integration)

Leaderboard: Your net worth is synced in real-time to a global Firebase leaderboard.

Achievement NFT: Once your total lifetime earnings reach $100,000:

Connect your Solana Wallet (Phantom recommended).

Ensure you are on Solana Devnet.

Mint the exclusive "Unicorn Founder" NFT directly to your wallet as on-chain proof of your success.

🛠️ Tech Stack

Frontend: Next.js 14, React, Tailwind CSS

Blockchain: Solana Web3.js, Metaplex Umi (for NFT Minting), Wallet Adapter

Backend: Firebase Firestore (Real-time Leaderboard)

Styling: Custom Cyberpunk UI, CSS Animations

🚀 Local Development Guide

Follow these steps to run the game on your local machine.

Prerequisites

Node.js (v18 or higher recommended)

A Firebase Project (for the leaderboard)

A Solana Wallet (e.g., Phantom) configured to Devnet

1. Clone the Repository

git clone [https://github.com/YOUR_USERNAME/web3-founder-simulator.git](https://github.com/YOUR_USERNAME/web3-founder-simulator.git)
cd web3-founder-simulator


2. Install Dependencies

⚠️ Important: Due to peer dependency conflicts between older Web3 libraries and newer React versions, please use the legacy flag.

npm install --legacy-peer-deps


3. Configure Environment Variables

Create a .env.local file in the root directory to store your Firebase configuration.

touch .env.local


Paste the following content into .env.local and replace the values with your Firebase project details:

NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project_id.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id


Note: If you skip this step, the game will run, but the Leaderboard feature will not work.

4. Run the Development Server

npm run dev


Open http://localhost:3000 with your browser to start playing.

📦 Deployment

This project is optimized for deployment on Vercel.

Push your code to a GitHub repository.

Import the project into Vercel.

Crucial Step: In Vercel's "Environment Variables" settings, add all the Firebase keys from your .env.local file.

Deploy!

📄 License

MIT License. Built for the Indie.fun Hackathon.