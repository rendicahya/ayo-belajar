<script>
  import { onMount, onDestroy } from 'svelte';
  import { COLORS } from '../lib/drawings.js';
  import { play } from '../lib/sound.js';
  import { speak } from '../lib/speech.js';

  const KEY = 'jb-canvas';
  const PAPER = '#ffffff';
  const SIZES = [0.012, 0.028, 0.06]; // tebal kuas, dibanding lebar kertas
  const STAMPS = ['⭐', '❤️', '🌸', '🐱', '🌞', '🚗', '🦋', '🌈'];

  // goresan disimpan relatif terhadap lebar kertas, supaya tetap pas saat ukuran layar berubah
  let items = $state.raw(load());
  let color = $state('biru');
  let size = $state(1);
  let tool = $state('pen'); // pen | eraser | stamp
  let stamp = $state(STAMPS[0]);
  let confirmClear = $state(false);
  let canvas = $state();
  let ctx;
  let current = null;
  let pointer = null;
  let ro;

  function load() {
    try {
      const v = JSON.parse(localStorage.getItem(KEY));
      return Array.isArray(v) ? v : [];
    } catch {
      return [];
    }
  }

  function persist() {
    try {
      localStorage.setItem(KEY, JSON.stringify(items));
    } catch {
      // penyimpanan penuh atau tidak tersedia — gambar tetap ada selama halaman terbuka
    }
  }

  function drawItem(c, it, W) {
    if (it.stamp) {
      c.font = `${it.s * W}px system-ui, "Apple Color Emoji", "Segoe UI Emoji", sans-serif`;
      c.textAlign = 'center';
      c.textBaseline = 'middle';
      c.fillText(it.stamp, it.x * W, it.y * W);
      return;
    }
    const p = it.pts;
    c.strokeStyle = it.c;
    c.fillStyle = it.c;
    c.lineWidth = it.w * W;
    c.lineCap = 'round';
    c.lineJoin = 'round';
    if (p.length === 1) {
      c.beginPath();
      c.arc(p[0][0] * W, p[0][1] * W, (it.w * W) / 2, 0, Math.PI * 2);
      c.fill();
      return;
    }
    c.beginPath();
    c.moveTo(p[0][0] * W, p[0][1] * W);
    // garis dihaluskan lewat titik tengah antar titik sentuh
    for (let i = 1; i < p.length - 1; i++) {
      const mx = ((p[i][0] + p[i + 1][0]) / 2) * W;
      const my = ((p[i][1] + p[i + 1][1]) / 2) * W;
      c.quadraticCurveTo(p[i][0] * W, p[i][1] * W, mx, my);
    }
    const e = p.at(-1);
    c.lineTo(e[0] * W, e[1] * W);
    c.stroke();
  }

  function render(c = ctx, W = canvas.width, H = canvas.height) {
    c.fillStyle = PAPER;
    c.fillRect(0, 0, W, H);
    for (const it of items) drawItem(c, it, W);
  }

  function fit() {
    const r = canvas.getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(r.width * dpr);
    canvas.height = Math.round(r.height * dpr);
    render();
  }

  onMount(() => {
    ctx = canvas.getContext('2d');
    ro = new ResizeObserver(fit);
    ro.observe(canvas);
  });
  onDestroy(() => ro?.disconnect());

  function pos(e) {
    const r = canvas.getBoundingClientRect();
    return [(e.clientX - r.left) / r.width, (e.clientY - r.top) / r.width];
  }

  function down(e) {
    if (pointer !== null) return; // satu jari saja
    confirmClear = false;
    const [x, y] = pos(e);
    if (tool === 'stamp') {
      items = [...items, { stamp, x, y, s: [0.08, 0.13, 0.2][size] }];
      play('pop');
      render();
      persist();
      return;
    }
    pointer = e.pointerId;
    canvas.setPointerCapture(e.pointerId);
    current = { c: tool === 'eraser' ? PAPER : COLORS[color], w: SIZES[size] * (tool === 'eraser' ? 1.6 : 1), pts: [[x, y]] };
    items = [...items, current];
    render();
  }

  function move(e) {
    if (e.pointerId !== pointer || !current) return;
    const events = e.getCoalescedEvents?.() ?? [e];
    for (const ev of events) current.pts.push(pos(ev).map((v) => Math.round(v * 10000) / 10000));
    // cukup gambar ulang ujung goresan; gambar penuh saat jari diangkat
    const W = canvas.width;
    drawItem(ctx, { ...current, pts: current.pts.slice(-3) }, W);
  }

  function up(e) {
    if (e.pointerId !== pointer) return;
    pointer = null;
    current = null;
    render();
    persist();
  }

  function pickColor(c) {
    color = c;
    tool = 'pen';
    play('tap');
    speak(c);
  }

  function undo() {
    if (!items.length) return;
    items = items.slice(0, -1);
    play('tap');
    render();
    persist();
  }

  function clearAll() {
    if (!confirmClear) {
      confirmClear = true;
      return;
    }
    confirmClear = false;
    items = [];
    play('tap');
    render();
    persist();
  }

  function save() {
    const out = document.createElement('canvas');
    out.width = 1200;
    out.height = Math.round((1200 * canvas.height) / canvas.width);
    render(out.getContext('2d'), out.width, out.height);
    const d = new Date();
    const stamp2 = (n) => String(n).padStart(2, '0');
    const a = document.createElement('a');
    a.download = `gambarku-${d.getFullYear()}${stamp2(d.getMonth() + 1)}${stamp2(d.getDate())}-${stamp2(d.getHours())}${stamp2(d.getMinutes())}.png`;
    a.href = out.toDataURL('image/png');
    a.click();
    play('correct');
  }
</script>

<p class="hint">Gambar apa saja sesukamu! Gambarmu tersimpan di perangkat ini.</p>

<div class="paper">
  <canvas
    bind:this={canvas}
    onpointerdown={down}
    onpointermove={move}
    onpointerup={up}
    onpointercancel={up}
    aria-label="Kertas gambar"
  ></canvas>
</div>

<div class="tools">
  <div class="row" role="radiogroup" aria-label="Warna">
    {#each Object.keys(COLORS) as c}
      <button
        class="swatch"
        class:on={tool === 'pen' && color === c}
        style="--sw:{COLORS[c]}"
        role="radio"
        aria-checked={tool === 'pen' && color === c}
        aria-label={c}
        onclick={() => pickColor(c)}
      ></button>
    {/each}
    <button class="tool" class:on={tool === 'eraser'} onclick={() => ((tool = 'eraser'), play('tap'))} aria-label="Penghapus" title="Penghapus">🧽</button>
  </div>

  <div class="row">
    {#each SIZES as _, i}
      <button class="tool size" class:on={size === i} onclick={() => ((size = i), play('tap'))} aria-label="Ukuran {i + 1}">
        <i style="width:{8 + i * 9}px; height:{8 + i * 9}px"></i>
      </button>
    {/each}
    <span class="sep"></span>
    {#each STAMPS as s}
      <button class="tool" class:on={tool === 'stamp' && stamp === s} onclick={() => ((tool = 'stamp'), (stamp = s), play('tap'))} aria-label="Stempel {s}">{s}</button>
    {/each}
  </div>

  <div class="row actions">
    <button class="btn light small" onclick={undo} disabled={!items.length}>↶ Batal</button>
    <button class="btn light small" class:warn={confirmClear} onclick={clearAll} disabled={!items.length}>
      🗑️ {confirmClear ? 'Yakin? Ketuk lagi' : 'Hapus semua'}
    </button>
    <button class="btn small" style="--c:var(--ok)" onclick={save} disabled={!items.length}>💾 Simpan gambar</button>
  </div>
</div>

<style>
  .paper {
    max-width: 760px;
    margin: 12px auto 0;
    padding: 8px;
    border-radius: var(--radius);
    background: var(--card);
    box-shadow: var(--shadow);
  }

  canvas {
    display: block;
    width: 100%;
    aspect-ratio: 4 / 3;
    max-height: 62vh;
    border-radius: 16px;
    background: #fff;
    touch-action: none;
    cursor: crosshair;
  }

  @media (max-width: 600px) and (orientation: portrait) {
    canvas {
      aspect-ratio: 3 / 4;
      max-height: 58vh;
    }
  }

  .tools {
    display: grid;
    gap: 10px;
    max-width: 760px;
    margin: 12px auto 0;
  }

  .row {
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    align-items: center;
    gap: 8px;
  }

  .swatch {
    width: 40px;
    height: 40px;
    border-radius: 50%;
    background: var(--sw);
    box-shadow: inset 0 -4px 0 rgba(0, 0, 0, 0.18);
    transition: transform 0.12s;
  }

  .swatch.on,
  .tool.on {
    transform: scale(1.12);
    outline: 3px solid var(--ink);
    outline-offset: 2px;
  }

  .tool {
    display: grid;
    place-items: center;
    width: 42px;
    height: 42px;
    border-radius: 14px;
    background: var(--card);
    box-shadow: 0 3px 0 var(--line);
    font-size: 1.4rem;
    line-height: 1;
  }

  .size i {
    display: block;
    border-radius: 50%;
    background: var(--ink);
  }

  .sep {
    width: 2px;
    height: 28px;
    background: var(--line);
    margin: 0 4px;
  }

  .actions .warn {
    background: var(--bad-soft);
    color: var(--bad);
  }
</style>
