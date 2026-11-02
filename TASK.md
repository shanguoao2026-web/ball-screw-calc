# ball-screw-calc

Build a small TypeScript Node CLI (Node 18+, no runtime deps; devDeps typescript + @types/node only; tests with node:test) for ball screw drive sizing.

Features:
- --lead L (mm, required), --force F (axial load N, required).
- Optional --efficiency η (0 < η <= 1, default 0.9): drive torque T = F·L/(2000·π·η) N·m.
- Optional --rpm n: linear speed v = n·L/60000 m/s, power P = 2π·n·T/60 W.
- Optional --speed v (m/s) instead of --rpm: rpm n = v·60000/L. Giving both → error.
- Optional --dynamic-load Ca (N): L10 life revolutions = (Ca/F)^3·1e6, travel distance km = rev·L/1e6; with rpm/speed also life hours = rev/(60·n).
- Validate finite positive numbers, efficiency in (0,1]; errors to stderr with exit 1.
- Table output by default, --json, --help. README with examples, MIT LICENSE (author shanguoao2026-web), .gitignore with node_modules/ dist/ *.log .npm-cache/.
- npm test must build and pass. No secrets, no personal info.

Check values (must be in tests):
- L 10, F 1000, η 0.9 → T 1.7684 N·m.
- + rpm 1500 → v 0.25 m/s, P 277.78 W.
- speed 0.25 → rpm 1500.
- Ca 10000 → 1e9 rev, 10000 km, 11111.1 h at 1500 rpm.
- efficiency 1.2 → exit 1; rpm and speed together → exit 1.
