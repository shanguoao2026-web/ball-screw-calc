import test from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdtempSync, openSync, closeSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const run = (...args) => {
  const dir = mkdtempSync(join(tmpdir(), 'ball-screw-test-'));
  const out = openSync(join(dir, 'stdout'), 'w');
  const err = openSync(join(dir, 'stderr'), 'w');
  try {
    const result = spawnSync(process.execPath, ['dist/cli.js', ...args], { stdio: ['ignore', out, err] });
    if (result.error) throw result.error;
    return { status: result.status, stdout: readFileSync(join(dir, 'stdout'), 'utf8'), stderr: readFileSync(join(dir, 'stderr'), 'utf8') };
  } finally {
    closeSync(out);
    closeSync(err);
    rmSync(dir, { recursive: true, force: true });
  }
};
const base = ['--lead', '10', '--force', '1000'];
const close = (actual, expected, tolerance) => assert.ok(Math.abs(actual - expected) < tolerance, `${actual} ≈ ${expected}`);
const json = (...args) => {
  const output = run(...base, ...args, '--json');
  assert.equal(output.status, 0, output.stderr);
  assert.equal(output.stderr, '');
  return JSON.parse(output.stdout);
};

test('default efficiency and torque reference value', () => {
  const result = json();
  close(result.torque_Nm, 1.7684, 0.00005);
  assert.equal(result.efficiency, 0.9);
  assert.equal(result.rpm, undefined);
  close(json('--efficiency', '0.9').torque_Nm, 1.7684, 0.00005);
});
test('rpm produces speed, power and L10 life reference values', () => {
  const result = json('--rpm', '1500', '--dynamic-load', '10000');
  assert.equal(result.speed_m_s, 0.25);
  close(result.power_W, 277.78, 0.005);
  assert.equal(result.life_revolutions, 1e9);
  assert.equal(result.life_travel_km, 10000);
  close(result.life_hours, 11111.1, 0.05);
});
test('speed produces equivalent rpm and life hours', () => {
  const result = json('--speed', '0.25', '--dynamic-load', '10000');
  assert.equal(result.rpm, 1500);
  close(result.life_hours, 11111.1, 0.05);
});
test('life without speed omits hours; unit efficiency is accepted', () => {
  const result = json('--dynamic-load', '10000', '--efficiency', '1');
  assert.equal(result.life_revolutions, 1e9);
  assert.equal(result.life_hours, undefined);
});
test('invalid arguments exit 1 with stderr and no stdout', () => {
  const invalid = [[], ['--lead', '10'], [...base, '--efficiency', '1.2'],
    [...base, '--rpm', '1500', '--speed', '0.25'], [...base, '--wat'],
    [...base, '--lead', '20'], [...base, '--rpm'], [...base, 'extra']];
  for (const option of ['--lead', '--force', '--efficiency', '--rpm', '--speed', '--dynamic-load']) {
    for (const value of ['0', '-1', 'NaN', 'Infinity', '1e999', 'abc', '']) {
      const prefix = option === '--lead' ? ['--force', '1000'] : option === '--force' ? ['--lead', '10'] : base;
      invalid.push([...prefix, option, value]);
    }
  }
  for (const args of invalid) {
    const result = run(...args);
    assert.equal(result.status, 1, JSON.stringify(args));
    assert.match(result.stderr, /^Error: /);
    assert.equal(result.stdout, '');
  }
});
test('table and help output', () => {
  const table = run(...base);
  assert.equal(table.status, 0);
  assert.match(table.stdout, /Drive torque \(N·m\).*1\.768/);
  const help = run('--help');
  assert.equal(help.status, 0);
  assert.match(help.stdout, /Usage:/);
  assert.match(help.stdout, /--dynamic-load/);
});
