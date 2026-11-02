#!/usr/bin/env node

const help = `Usage: ball-screw-calc --lead L --force F [options]

Ball screw drive sizing (Node 18+).

  --lead L           Screw lead in mm (required, positive)
  --force F          Axial load in N (required, positive)
  --efficiency E     Efficiency in (0, 1] (default: 0.9)
  --rpm N            Rotational speed in rpm (positive)
  --speed V          Linear speed in m/s (positive; alternative to --rpm)
  --dynamic-load CA  Dynamic load rating in N (positive)
  --json             Print JSON instead of a table
  --help             Show this help
`;

const numericOptions = new Set(['lead', 'force', 'efficiency', 'rpm', 'speed', 'dynamic-load']);

function main(args: string[]): void {
  const values = new Map<string, number>();
  const flags = new Set<string>();
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === '--help' || arg === '--json') {
      if (flags.has(arg)) throw new Error(`Duplicate option: ${arg}`);
      flags.add(arg);
      continue;
    }
    const name = arg.startsWith('--') ? arg.slice(2) : '';
    if (!numericOptions.has(name)) throw new Error(`Unknown argument: ${arg}`);
    if (values.has(name)) throw new Error(`Duplicate option: ${arg}`);
    const raw = args[++i];
    if (raw === undefined || raw.trim() === '' || raw.startsWith('--')) {
      throw new Error(`Missing value for ${arg}`);
    }
    const value = Number(raw);
    if (!Number.isFinite(value) || value <= 0) throw new Error(`${arg} must be a finite positive number`);
    values.set(name, value);
  }
  if (flags.has('--help')) {
    process.stdout.write(help);
    return;
  }
  const lead = values.get('lead');
  const force = values.get('force');
  if (lead === undefined || force === undefined) throw new Error('--lead and --force are required');
  const efficiency = values.get('efficiency') ?? 0.9;
  if (efficiency > 1) throw new Error('--efficiency must be in (0, 1]');
  if (values.has('rpm') && values.has('speed')) throw new Error('--rpm and --speed cannot be used together');

  const torque = force * lead / (2000 * Math.PI * efficiency);
  const result: Record<string, number> = {
    lead_mm: lead, force_N: force, efficiency, torque_Nm: torque,
  };
  const rpm = values.get('rpm') ?? (values.has('speed') ? values.get('speed')! * 60000 / lead : undefined);
  if (rpm !== undefined) {
    result.rpm = rpm;
    result.speed_m_s = rpm * lead / 60000;
    result.power_W = 2 * Math.PI * rpm * torque / 60;
  }
  const dynamicLoad = values.get('dynamic-load');
  if (dynamicLoad !== undefined) {
    result.dynamic_load_N = dynamicLoad;
    result.life_revolutions = (dynamicLoad / force) ** 3 * 1e6;
    result.life_travel_km = result.life_revolutions * lead / 1e6;
    if (rpm !== undefined) result.life_hours = result.life_revolutions / (60 * rpm);
  }
  for (const [key, value] of Object.entries(result)) {
    if (!Number.isFinite(value) || value <= 0) throw new Error(`Calculated ${key} is outside the supported numeric range`);
  }
  if (flags.has('--json')) {
    process.stdout.write(JSON.stringify(result, null, 2) + '\n');
    return;
  }
  const labels: Record<string, string> = {
    lead_mm: 'Lead (mm)', force_N: 'Axial load (N)', efficiency: 'Efficiency',
    torque_Nm: 'Drive torque (N·m)', rpm: 'Speed (rpm)', speed_m_s: 'Linear speed (m/s)',
    power_W: 'Power (W)', dynamic_load_N: 'Dynamic load (N)',
    life_revolutions: 'L10 life (rev)', life_travel_km: 'L10 travel (km)', life_hours: 'L10 life (h)',
  };
  process.stdout.write('Quantity             | Value\n---------------------|----------------------\n');
  for (const [key, value] of Object.entries(result)) {
    process.stdout.write(`${labels[key].padEnd(20)} | ${Number(value.toPrecision(8))}\n`);
  }
}

try {
  main(process.argv.slice(2));
} catch (error) {
  process.stderr.write(`Error: ${error instanceof Error ? error.message : String(error)}\n`);
  process.exitCode = 1;
}
