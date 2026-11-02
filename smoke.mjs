// Smoke test: node smoke.mjs  (serves nothing itself: run `python3 -m http.server 8123` first)
// Plays the game in headless Chrome, checks merges, the galaxy and game over, and saves screenshots to /tmp.
import { spawn as run } from 'node:child_process';
import { writeFileSync } from 'node:fs';
import assert from 'node:assert/strict';

const URL = process.argv[2] || 'http://localhost:8123/';
const chrome = run('/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  ['--headless=new', '--remote-debugging-port=9333', '--user-data-dir=/tmp/evo-chrome', '--window-size=430,800', 'about:blank']);
const sleep = ms => new Promise(r => setTimeout(r, ms));
await sleep(1500);
const [tab] = (await (await fetch('http://localhost:9333/json')).json()).filter(t => t.type === 'page');
const ws = new WebSocket(tab.webSocketDebuggerUrl);
await new Promise(r => ws.onopen = r);
let id = 0; const wait = new Map(), errors = [];
ws.onmessage = ({ data }) => {
  const m = JSON.parse(data);
  if (m.id) wait.get(m.id)(m.result);
  if (m.method === 'Runtime.exceptionThrown') errors.push(m.params.exceptionDetails.exception?.description);
  if (m.method === 'Runtime.consoleAPICalled' && m.params.type === 'error') errors.push(m.params.args.map(a => a.value).join(' '));
};
const cdp = (method, params = {}) => new Promise(r => { wait.set(++id, r); ws.send(JSON.stringify({ id, method, params })); });
const js = async e => (await cdp('Runtime.evaluate', { expression: e, awaitPromise: true, returnByValue: true })).result.value;
const shot = async f => writeFileSync(f, Buffer.from((await cdp('Page.captureScreenshot')).data, 'base64'));

try {
  await cdp('Runtime.enable'); await cdp('Page.enable');
  await cdp('Page.navigate', { url: URL }); await sleep(2500);
  await shot('/tmp/evo-menu.png');
  await js(`document.getElementById('play').click()`);
  // drop 40 pieces, always in the same 3 spots so identical ones meet
  for (let i = 0; i < 40; i++) { await js(`aimX=${[120, 200, 280][i % 3]}; drop()`); await sleep(520); }
  await sleep(1500);
  await shot('/tmp/evo-play.png');
  const s = await js(`({score, maxTier, n: bodies().length, state})`);
  console.log('after drops', s);
  assert.ok(s.score > 0 && s.maxTier >= 2, 'merges should happen');

  await js(`start(); [[11,120,560],[10,300,560],[9,110,380],[8,290,380],[7,200,250],[6,330,220]].forEach(([t,x,y]) => spawn(t,x,y)); 0`); await sleep(1500);
  await shot('/tmp/evo-planets.png');
  await js(`start(); spawn(LAST, 140, 500); spawn(LAST, 260, 500); 0`); await sleep(900);
  await shot('/tmp/evo-galaxy.png');
  const g = await js(`({score, n: bodies().length, galaxies: galaxies.length})`);
  console.log('galaxy', g);
  assert.ok(g.score >= 1000 && g.n === 0, 'two solar systems should become a galaxy');

  await js(`start(); Body.setStatic(spawn(5, 200, 140), true); 0`); await sleep(6000);
  assert.equal(await js('state'), 'over', 'overflow should end the game');
  await shot('/tmp/evo-over.png');
  assert.deepEqual(errors, [], 'no JS errors');
  console.log('OK');
} finally { ws.close(); chrome.kill(); }
