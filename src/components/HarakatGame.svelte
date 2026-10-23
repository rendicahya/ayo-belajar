<script>
  import { untrack } from 'svelte';
  import { genHarakat, MARKS, MARK_NAMES } from '../lib/hijaiyah.js';
  import { play } from '../lib/sound.js';
  import { say } from '../lib/speech.js';
  import ChoiceButtons from './ChoiceButtons.svelte';
  import AskBar from './AskBar.svelte';

  let props = $props();
  const q = genHarakat(untrack(() => props.level));
  // contoh tanda harakat di atas garis tatwil (ـ) supaya terlihat jelas
  const legend = q.vowels.map((v) => ({ v, mark: `ـ${MARKS[v]}`, name: MARK_NAMES[v] }));

  let wrong = $state([]);
  let solved = $state(false);
  let message = $state({ text: '', kind: '' });
  let attempts = 0;

  const tips = {
    fathah: 'Fathah (garis di atas) dibaca "a". Lihat hurufnya baik-baik, ya.',
    vowels: 'Garis di atas dibaca "a", garis di bawah dibaca "i", dan wau kecil di atas dibaca "u".',
    mixed: 'Lihat hurufnya dulu, lalu harakatnya: atas "a", bawah "i", wau kecil "u".',
    tanwin: 'Tanwin itu harakat dobel: dua garis di atas "an", dua di bawah "in", dhammah dobel "un".',
    word: 'Baca satu per satu dari kanan ke kiri, lalu sambung.',
  };

  function pickOption(v, i) {
    if (solved || wrong.includes(i)) return;
    if (v === q.answer) {
      solved = true;
      message = { text: `Betul, dibaca “${q.answer}”!`, kind: 'ok' };
      play('correct');
      say('Betul!');
      props.onSolved(attempts === 0);
      return;
    }
    attempts++;
    wrong = [...wrong, i];
    play('wrong');
    message = { text: `${tips[q.type]} 💪`, kind: 'bad' };
  }
</script>

<AskBar
  text={q.type === 'word' ? 'Bagaimana membaca sambungan ini?' : 'Bagaimana membacanya?'}
  spoken={q.type === 'word' ? 'Bagaimana membaca sambungan huruf ini? Baca dari kanan ke kiri.' : 'Bagaimana cara membaca huruf ini?'}
/>

<div class="card" class:ok={solved}>
  <span class="ar" class:long={q.type === 'word'}>{q.ar}</span>
  {#if solved}<span class="lat">{q.answer}</span>{/if}
</div>

<div class="legend" aria-label="Tanda harakat">
  {#each legend as l}
    <span class="chip"><span class="ar">{l.mark}</span> {l.name} = {l.v}</span>
  {/each}
</div>

<div class="pick">
  <ChoiceButtons options={q.choices} isRight={(v) => v === q.answer} onpick={pickOption} {wrong} {solved} />
</div>

<p class="msg {message.kind}" aria-live="polite">{message.text}</p>

<style>
  .card {
    display: grid;
    justify-items: center;
    min-width: 150px;
    width: fit-content;
    margin: 10px auto;
    padding: 6px 30px 14px;
    border-radius: 34px;
    background: var(--card);
    box-shadow: var(--shadow);
    border: 4px solid var(--lime);
  }

  .card.ok {
    border-color: var(--ok);
    background: var(--ok-soft);
  }

  .card .ar {
    font-size: clamp(4.5rem, 22vw, 6rem);
    line-height: 1.5;
  }

  .card .ar.long {
    font-size: clamp(3.4rem, 16vw, 4.6rem);
  }

  .lat {
    font-size: 1.6rem;
    font-weight: 700;
    color: var(--ok);
    animation: pop 0.35s ease-out;
  }

  .legend {
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    gap: 6px 10px;
    margin: 4px auto 0;
    max-width: 560px;
  }

  .chip {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 0 12px;
    border-radius: 999px;
    background: var(--card);
    box-shadow: 0 3px 0 var(--line);
    color: var(--muted);
    font-size: 0.95rem;
  }

  .chip .ar {
    font-size: 1.6rem;
    line-height: 1.6;
    color: var(--ink);
  }

  .pick {
    margin-top: 16px;
  }

  .pick :global(.choice) {
    text-transform: none;
  }

  .msg {
    margin-top: 14px;
  }
</style>
