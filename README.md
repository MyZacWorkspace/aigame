# 🔥 Firewall Frenzy – Minimal Playable Prototype

A cybersecurity-themed tower-defense game. Defend your network against waves of cyber threats by placing defenses strategically and managing your resources.

## 🎮 **How to Play**

1. **Start a Wave**: Click "▶ Start Wave" to begin the attack.
2. **Place Defenses**: Click a tower button, then click on the canvas to place it.
3. **Manage Resources**: Earn credits by destroying enemies; spend them on towers.
4. **Defend**: Keep enemies from reaching the end of the path (core network).
5. **Survive**: Last through all 4 waves to win!

## 🎯 **Enemies (Threats)**

| Enemy | Speed | Health | Damage | Reward | Notes |
|-------|-------|--------|--------|--------|-------|
| 🦠 Virus | Fast | 1 | 1 | 5 | Basic threat |
| 🐍 Worm | Slow | 2 | 2 | 10 | Tougher |
| 💣 Ransomware | Very Slow | 4 | 5 | 25 | Devastating |
| 🌐 DDoS | Very Fast | 1 | 1 | 5 | Swarm attack |
| 🎭 Phishing | Medium | 1 | 1 | 5 | Deceptive |

## 🛡️ **Defenses (Towers)**

| Tower | Cost | Range | Damage | FireRate | Special |
|-------|------|-------|--------|----------|---------|
| 🔥 Firewall | 25 | 120 | 1.0 | 0.5/s | Basic defense |
| 🕵️ IDS | 40 | 180 | 1.5 | 0.3/s | Long range |
| 🪤 Honeypot | 35 | 100 | 0.5 | 1/s | High rate |
| ⚡ Patch | 50 | 150 | — | Healing | Restores network health |

## 📊 **Game Resources**

- **💰 Credits**: Earned by killing enemies, spent on towers
- **❤️ Health**: Network health (starts at 20). Reach 0 = game over
- **🌊 Wave**: Current wave number (1-4)

## 🎨 **Features**

- **Real-time pathfinding**: Enemies follow a dynamic network path
- **Tower targeting**: Towers automatically lock onto nearest threats
- **Range indicators**: Hover over placed towers to see their range
- **Visual feedback**: Towers glow when active; enemies show health bars
- **Progressive difficulty**: Later waves introduce harder threats and more enemies

## 🚀 **Quick Start**

### Option 1: Local File (Fastest)
```bash
# Navigate to project directory
cd c:\Users\zmact\coding\aigame

# Open index.html in your browser
# Windows: start index.html
# macOS: open index.html
# Linux: xdg-open index.html
```

### Option 2: Local Server
```bash
# Using Python 3
python -m http.server 8000

# Or using Node.js (if installed)
npx http-server

# Then open http://localhost:8000 in your browser
```

## 📁 **File Structure**

```
aigame/
├── index.html      # Game canvas & UI
├── styles.css      # Cyberpunk styling
├── main.js         # Game logic & entities
└── README.md       # This file
```

## 🔧 **Technical Details**

- **Engine**: Vanilla HTML5 Canvas + JavaScript
- **Frame Rate**: 60 FPS (requestAnimationFrame)
- **Physics**: Simple 2D pathfinding with linear interpolation
- **No Dependencies**: Pure vanilla JS—works offline

## 🎓 **Educational Value**

Players learn real cybersecurity concepts:
- **Layered Defense**: Single tower insufficient; must combine defenses
- **Resource Management**: Balance spending on offense vs. healing
- **Threat Recognition**: Different attack vectors with unique behaviors
- **Monitoring**: IDS reveals threats early; Honeypots distract attackers

## 🐛 **Known Limitations** (Prototype)

- No persistence (game resets on page reload)
- No pause/resume
- No sound effects or background music
- Limited wave variety (could expand with 10+ themed levels)
- No unit selection or tower upgrades

## ✨ **Future Enhancements**

1. **Upgrades**: Spend credits to boost tower stats
2. **Persistent Save**: LocalStorage for progress
3. **Multiplayer**: Co-op or competitive modes
4. **Campaign**: Story-driven levels (Home → Corporate → Cloud → Critical Infrastructure)
5. **Mobile Optimizations**: Touch controls, responsive canvas
6. **Audio**: Ambient sounds + attack/kill SFX
7. **Boss Waves**: Special APT (Advanced Persistent Threat) enemies with unique mechanics

---

**Status**: ✅ Playable Prototype  
**Last Updated**: November 2025  
**Author**: Game Design Team
