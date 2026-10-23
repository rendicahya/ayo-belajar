<script>
  import { untrack } from 'svelte';
  import { genDoa } from '../lib/hijaiyah.js';
  import { play } from '../lib/sound.js';
  import { say } from '../lib/speech.js';
  import ChoiceButtons from './ChoiceButtons.svelte';
  import AskBar from './AskBar.svelte';
  import BuildTiles from './BuildTiles.svelte';

  let props = $props();
  const q = genDoa(untrack(() => props.level));
  const doa = q.item;

  let wrong = $state([]);
  let solved = $state(false);
  let message = $state({ text: '', kind: '' });
  let attempts = 0;

  const ask =
    q.type === 'next'
      ? { text: `${doa.title}: ayat sesudahnya apa?`, spoken: `${doa.title}. Ayat sesudahnya apa?` }
      : { text: `Susun ${doa.surah ? 'ayat-ayat' : ''} ${doa.title}!`.replace('  ', ' '), spoken: `Susun ${doa.title}. Mulai dari kanan.` };

  function win() {
    solved = true;
    message = { text: 'Masya Allah, hebat! 🌟', kind: 'ok' };
    play('correct');
    say('Masya Allah, hebat!');
    props.onSolved(attempts === 0);
  }

  function onwrong() {
    attempts++;
    message = { text: 'Hampir! Coba ingat lagi urutannya, ya. 💪', kind: 'bad' };
  }

  function pickOption(p, i) {
    if (solved || wrong.includes(i)) return;
    if (p === q.answer) return win();
    attempts++;
    wrong = [...wrong, i];
    play('wrong');
    message = { text: 'Belum tepat. Coba lantunkan pelan-pelan dari ayat sebelumnya. 💪', kind: 'bad' };
  }
</script>

<AskBar text={ask.text} spoken={ask.spoken} />

<section class="info">
  <b>{doa.title}</b>
  <span>{doa.surah ? doa.meaning : `Artinya: “${doa.meaning}”`}</span>
</section>

{#if q.type === 'next'}
  <div class="shown">
    <span class="no">Ayat {q.k + 1}</span>
    <p class="ar">{q.shown.ar}</p>
    <p class="lat">{q.shown.lat}</p>
  </div>
  <div class="list">
    <ChoiceButtons options={q.choices} isRight={(p) => p === q.answer} onpick={pickOption} {wrong} {solved} wide>
      {#snippet item(p)}
        <span class="ar">{p.ar}</span>
        <small>{p.lat}</small>
      {/snippet}
    </ChoiceButtons>
  </div>
{:else}
  <p class="hint">Ketuk potongan di bawah sesuai urutan, mulai dari kanan. Ketuk potongan di atas untuk mengembalikannya.</p>
  <div class="build">
    <BuildTiles tiles={q.tiles.map((t) => ({ ...t, text: t.ar }))} target={doa.parts.map((p) => p.ar)} wide rtl voice={false} onsolved={win} {onwrong}>
      {#snippet item(t)}
        <span class="ar">{t.ar}</span>
        <small>{t.lat}</small>
      {/snippet}
    </BuildTiles>
  </div>
  {#if solved}
    <div class="shown done">
      <p class="ar">{doa.parts.map((p) => p.ar).join(' ')}</p>
      <p class="lat">{doa.parts.map((p) => p.lat).join(' ')}</p>
    </div>
  {/if}
{/if}

<p class="msg {message.kind}" aria-live="polite">{message.text}</p>
<p class="note">Teks Arab mengikuti mushaf standar Indonesia. Lafalnya dicontohkan guru ngaji atau orang tua, ya.</p>

<style>
  .info {
    display: grid;
    gap: 2px;
    max-width: 560px;
    margin: 6px auto 0;
    text-align: center;
    color: var(--muted);
    font-size: 0.95rem;
    line-height: 1.35;
  }

  .info b {
    color: var(--ink);
    font-size: 1.1rem;
  }

  .shown {
    display: grid;
    justify-items: center;
    max-width: 640px;
    margin: 14px auto;
    padding: 10px 18px 14px;
    border-radius: var(--radius);
    background: var(--card);
    box-shadow: var(--shadow);
    text-align: center;
  }

  .shown.done {
    border: 3px solid var(--ok);
    background: var(--ok-soft);
  }

  .shown .ar {
    font-size: clamp(1.7rem, 7vw, 2.3rem);
  }

  .lat {
    color: var(--muted);
    font-style: italic;
  }

  .no {
    padding: 2px 12px;
    border-radius: 999px;
    background: var(--indigo);
    color: #fff;
    font-size: 0.85rem;
    font-weight: 600;
  }

  .build :global(.tile),
  .build :global(.slot.filled) {
    display: inline-grid;
    justify-items: center;
    padding: 2px 14px 8px;
  }

  .build :global(.slot:not(.filled)) {
    min-width: 90px;
  }

  .build .ar,
  .list .ar {
    font-size: clamp(1.45rem, 6.2vw, 1.9rem);
    line-height: 1.7;
  }

  small {
    font-size: 0.8rem;
    font-weight: 500;
    font-style: italic;
    opacity: 0.9;
  }

  .list :global(.choices) {
    flex-direction: column;
    align-items: stretch;
    max-width: 560px;
  }

  .list :global(.choice) {
    display: grid;
    justify-items: center;
    flex-basis: auto;
    padding: 6px 14px 12px;
  }

  .note {
    margin-top: 10px;
    text-align: center;
    color: var(--muted);
    font-size: 0.85rem;
  }
</style>
