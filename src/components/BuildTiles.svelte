<script>
  /**
   * Menyusun kepingan (suku kata / kata) ke kotak-kotak jawaban dengan mengetuk.
   * Ketuk keping di bawah untuk menaruhnya di kotak kosong berikutnya, ketuk keping
   * di kotak untuk mengembalikannya. Saat semua kotak terisi, susunan langsung diperiksa.
   */
  import { untrack } from 'svelte';
  import { play } from '../lib/sound.js';
  import { speak } from '../lib/speech.js';

  let { tiles, target, tail = '', wide = false, onsolved, onwrong } = $props();

  let slots = $state(untrack(() => target.map(() => null))); // id keping di tiap kotak
  let marks = $state([]); // 'ok' / 'bad' per kotak setelah diperiksa
  let solved = $state(false);
  let busy = false;

  const byId = (id) => tiles.find((t) => t.id === id);
  const used = $derived(new Set(slots.filter((s) => s !== null)));

  function place(tile) {
    if (solved || busy || used.has(tile.id)) return;
    const i = slots.indexOf(null);
    if (i < 0) return;
    slots[i] = tile.id;
    marks = [];
    play('pop');
    speak(tile.text);
    if (!slots.includes(null)) check();
  }

  function unplace(i) {
    if (solved || busy || slots[i] === null) return;
    slots[i] = null;
    marks = [];
    play('tap');
  }

  function check() {
    marks = slots.map((id, i) => (byId(id).text === target[i] ? 'ok' : 'bad'));
    if (marks.every((m) => m === 'ok')) {
      solved = true;
      onsolved();
      return;
    }
    play('wrong');
    onwrong();
    // keping yang salah tempat dikembalikan, yang sudah benar tetap
    busy = true;
    setTimeout(() => {
      slots = slots.map((id, i) => (marks[i] === 'ok' ? id : null));
      busy = false;
    }, 900);
  }
</script>

<div class="slots" class:wide>
  {#each slots as id, i}
    <button
      class="slot"
      class:filled={id !== null}
      class:ok={solved || marks[i] === 'ok'}
      class:bad={marks[i] === 'bad'}
      disabled={solved || id === null}
      onclick={() => unplace(i)}
      aria-label={id === null ? `Kotak ${i + 1} kosong` : `${byId(id).text}, ketuk untuk mengembalikan`}
    >
      {id === null ? '' : byId(id).text}
    </button>
  {/each}
  {#if tail}<span class="tail">{tail}</span>{/if}
</div>

<div class="tray" class:wide>
  {#each tiles as t}
    <button class="tile" class:gone={used.has(t.id)} disabled={solved || used.has(t.id)} onclick={() => place(t)}>
      {t.text}
    </button>
  {/each}
</div>

<style>
  .slots,
  .tray {
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    align-items: flex-end;
    gap: 10px;
    max-width: 760px;
    margin: 18px auto;
  }

  .slot,
  .tile {
    min-width: clamp(72px, 20vw, 100px);
    min-height: clamp(64px, 17vw, 84px);
    padding: 8px 14px;
    border-radius: 20px;
    font-size: clamp(1.6rem, 7vw, 2.3rem);
    font-weight: 600;
  }

  .wide .slot,
  .wide .tile {
    min-width: 0;
    min-height: 56px;
    font-size: clamp(1.2rem, 5vw, 1.6rem);
  }

  .slot {
    border: 4px dashed var(--dash);
    background: transparent;
    color: var(--ink);
  }

  .slot.filled {
    border-style: solid;
    border-color: var(--sky);
    background: var(--card);
    box-shadow: var(--shadow);
  }

  .slot.ok {
    border-color: var(--ok);
    background: var(--ok-soft);
    color: var(--ok);
  }

  .slot.bad {
    border-color: var(--bad);
    background: var(--bad-soft);
    animation: shake 0.4s;
  }

  .wide .slot:not(.filled) {
    min-width: 72px;
  }

  .tail {
    font-size: 2.4rem;
    font-weight: 700;
    line-height: 1;
  }

  .tile {
    background: var(--grape);
    color: #fff;
    box-shadow: 0 6px 0 rgba(0, 0, 0, 0.2);
    transition: opacity 0.2s;
  }

  .tile:nth-child(3n + 2) {
    background: var(--pink);
  }

  .tile:nth-child(3n + 3) {
    background: var(--orange);
  }

  .tile:active:not(:disabled) {
    transform: translateY(5px);
    box-shadow: 0 1px 0 rgba(0, 0, 0, 0.2);
  }

  .tile.gone {
    opacity: 0.2;
  }
</style>
