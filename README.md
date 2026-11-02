# ball-screw-calc

A TypeScript CLI for ball screw drive sizing. Requires Node.js 18 or newer.
No runtime dependencies; development uses TypeScript and Node type definitions.

```sh
npm install
npm run build
node dist/cli.js --help
npm test
```

Calculate drive torque (default efficiency 0.9):

```sh
node dist/cli.js --lead 10 --force 1000
# Drive torque: approximately 1.7684 N·m
```

Include speed, power, and L10 life in machine-readable output:

```sh
node dist/cli.js --lead 10 --force 1000 --rpm 1500 --dynamic-load 10000 --json
# speed_m_s: 0.25, power_W: 277.777..., life_revolutions: 1000000000,
# life_travel_km: 10000, life_hours: 11111.111...
```

Specify linear speed instead of rpm:

```sh
node dist/cli.js --lead 10 --force 1000 --speed 0.25 --efficiency 0.9 --json
# rpm: 1500
```

`--lead` (mm) and `--force` (N) are required. All numeric arguments must be
finite and positive. `--efficiency` must be at most 1. `--rpm` and `--speed`
are mutually exclusive. `--dynamic-load` is the dynamic load rating in N.
Errors go to stderr with exit status 1. Output defaults to a labeled table;
`--json` emits numeric fields with units in their names and full JS precision.
Speed and power fields appear only when rpm or speed is supplied. Life fields
appear only with dynamic load; life hours also require rpm or speed.

For lead L, force F, efficiency η, rotational speed n, and dynamic rating Ca:

- Torque T = F × L / (2000 × π × η), in N·m.
- Linear speed v = n × L / 60000, in m/s; n = v × 60000 / L.
- Power P = 2 × π × n × T / 60, in W.
- L10 life = (Ca / F)³ × 10⁶ revolutions.
- Travel = revolutions × L / 10⁶, in km.
- Life hours = revolutions / (60 × n).

Calculations outside the representable positive finite numeric range are rejected.

Licensed under the MIT License. Copyright 2026 shanguoao2026-web.
