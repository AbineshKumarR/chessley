<div align="center">
  <h1>♟️ Chessley</h1>
  <p>
    An offline desktop chess application with a built-in AI opponent, multiple difficulty levels, and a clean interactive chessboard.
  </p>
  <p>
    <a href="https://github.com/AbineshKumarR/chessley">
      <img src="https://img.shields.io/github/stars/AbineshKumarR/chessley?style=for-the-badge" alt="GitHub Stars">
    </a>
    <a href="https://github.com/AbineshKumarR/chessley/issues">
      <img src="https://img.shields.io/github/issues/AbineshKumarR/chessley?style=for-the-badge" alt="GitHub Issues">
    </a>
    <a href="https://github.com/AbineshKumarR/chessley">
      <img src="https://img.shields.io/badge/Platform-Windows-blue?style=for-the-badge" alt="Platform">
    </a>
  </p>
</div>

---

## 📖 Table of Contents

* [✨ Features](#-features)
* [🧠 Chess Engine](#-chess-engine)
* [🛠️ Tech Stack](#-tech-stack)
* [🚀 Getting Started](#-getting-started)
* [📦 Building the Desktop App](#-building-the-desktop-app)
* [📁 Project Structure](#-project-structure)
* [🤝 Contributing](#-contributing)
* [📜 License](#-license)

---

## ✨ Features

* **🤖 Built-in Chess AI:** Play against a locally running chess bot without requiring an internet connection or external API.
* **🎯 Multiple Difficulty Levels:** Choose from different bot levels with varying playing strengths.
* **♟️ Interactive Chessboard:** Play chess through a responsive and intuitive board interface.
* **🧠 Intelligent Move Selection:** The chess engine uses search, position evaluation, and move ordering techniques to select moves.
* **⚡ Fast Local Gameplay:** Game logic and bot calculations run directly on the user's device.
* **🔊 Game Sounds:** Audio feedback for moves and other chess interactions.
* **👤 Player Avatars:** Includes custom avatars for different AI opponents.
* **💾 Local Persistence:** Game preferences and relevant data can be stored locally using browser storage.
* **📴 Fully Offline:** No backend server, account, or internet connection is required to play.

## 🧠 Chess Engine

Chessley includes its own JavaScript-based chess engine rather than relying on an online chess API.

The bot uses techniques such as:

* **Minimax / Alpha-Beta Search:** Searches possible future positions while pruning branches that cannot affect the final decision.
* **Position Evaluation:** Evaluates chess positions using material and positional factors.
* **MVV-LVA Move Ordering:** Prioritizes promising captures during search to improve alpha-beta pruning efficiency.
* **Depth-Based Difficulty:** Different difficulty levels can use different search configurations to provide varying playing strengths.
* **Legal Move Validation:** Uses `chess.js` to handle chess rules and legal move generation.

All engine calculations run locally, making the game completely playable without an internet connection.

## 🛠️ Tech Stack

* **Frontend:** ReactJS
* **Build Tool:** Vite
* **Desktop Framework:** Electron
* **Chess Logic:** chess.js
* **Chessboard:** react-chessboard
* **Icons:** Lucide React
* **Styling:** Tailwind CSS
* **State & Persistence:** React state and LocalStorage
* **Packaging:** Electron Builder

## 🚀 Getting Started

Clone the repository:

```bash
git clone https://github.com/AbineshKumarR/chessley.git
cd chessley
```

Install the dependencies:

```bash
npm install
```

### Run the web version

Start the Vite development server:

```bash
npm run dev
```

Open the development URL shown in the terminal, usually:

```text
http://localhost:3000
```

### Run the desktop version

Build the React application first:

```bash
npm run build
```

Then launch Chessley through Electron:

```bash
npm run electron
```

## 📦 Building the Desktop App

To create a standalone Windows installer:

```bash
npm run electron:build
```

The installer will be generated inside:

```text
release/
```

You can then install Chessley like a normal Windows desktop application.

Once installed, Chessley does not require:

* Node.js
* npm
* A development server
* A backend server
* An internet connection

## 📁 Project Structure

```text
chessley/
├── electron/
│   └── main.js
├── public/
│   └── avatars/
├── src/
│   ├── components/
│   ├── constants/
│   ├── engine/
│   └── ...
├── index.html
├── package.json
├── vite.config.js
└── README.md
```

## 🤝 Contributing

Contributions are welcome!

If you would like to improve Chessley, feel free to:

1. Fork the repository.
2. Create a new branch.
3. Make your changes.
4. Commit your changes.
5. Open a pull request.

Bug reports and feature suggestions are also welcome through GitHub Issues.

## 📜 License

This project is open source. See the repository for the applicable license and attribution information.
