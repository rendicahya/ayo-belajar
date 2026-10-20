<script>
  import { untrack, onDestroy } from 'svelte';
  import { genObjOp, rand } from '../lib/generate.js';
  import { play } from '../lib/sound.js';
  import { say } from '../lib/speech.js';
  import ChoiceButtons from './ChoiceButtons.svelte';
  import AskBar from './AskBar.svelte';

  let props = $props();
  const level = untrack(() => props.level);
  const q = genObjOp(level);
  const { animal, a, b, op } = q;
  const add = op === 'tambah';
  const sign = add ? '+' : '−';

  const story = add
    ? `Ada ${a} ${animal.name}. Datang ${b} ${animal.name} lagi. Sekarang ada berapa ${animal.name}?`
    : `Ada ${a} ${animal.name}. ${b} ${animal.name} pergi. Sisa berapa ${animal.name}?`;

  // tambah: a hewan lama + b hewan baru; kurang: b hewan terakhir akan pergi
  const field = Array.from({ length: add ? a + b : a }, (_, i) => ({
    rot: rand(-12, 12),
    late: add && i >= a,
    leaves: !add && i >= a - b,
  }));
  const stays = (f) => !f.leaves;

  let moved = $state(false); // hewan sudah datang / pergi
  let replay = $state(0);
  let wrong = $state([]);
  let solved = $state(false);
  let hinted = $state(false);
  let message = $state({ text: '', kind: '' });
  let attempts = 0;

  let timer = setTimeout(go, 1800);
  function go() {
    moved = true;
    play(add ? 'pop' : 'tap');
  }
  function again() {
    clearTimeout(timer);
    moved = false;
    replay++;
    say(story);
    timer = setTimeout(go, 1800);
  }

  // ketuk hewan untuk menghitung
  let marked = $state([]);
  let counting = null;
  function mark(i) {
    if (solved || counting || !moved || !stays(field[i])) return;
    if (marked.includes(i)) {
      marked = marked.filter((x) => x !== i);
      play('tap');
    } else {
      marked = [...marked, i];
      play('pop');
      say(String(marked.length));
    }
  }
  function countTogether() {
    hinted = true;
    clearTimeout(timer);
    moved = true;
    marked = [];
    const targets = field.map((f, i) => (stays(f) ? i : -1)).filter((i) => i >= 0);
    let k = 0;
    counting = setInterval(() => {
      marked = [...marked, targets[k]];
      play('pop');
      say(String(++k));
      if (k >= targets.length) {
        clearInterval(counting);
        counting = null;
      }
    }, 800);
  }
  onDestroy(() => {
    clearTimeout(timer);
    clearInterval(counting);
  });

  function pickNumber(n, i) {
    if (solved || wrong.includes(i)) return;
    if (n === q.answer) {
      solved = true;
      const text = `Betul! ${a} ${sign} ${b} = ${q.answer}.`;
      message = { text, kind: 'ok' };
      play('correct');
      say(add ? `Betul, sekarang ada ${q.answer} ${animal.name}!` : `Betul, sisa ${q.answer} ${animal.name}!`);
      props.onSolved(attempts === 0 && !hinted);
    } else {
      attempts++;
      wrong = [...wrong, i];
      message = { text: 'Belum tepat. Ketuk setiap hewan sambil menghitung, ya! 💪', kind: 'bad' };
      play('wrong');
    }
  }
</script>

<AskBar text={story} />

{#key replay}
  <div class="field">
    {#each field as f, i}
      {@const no = marked.indexOf(i) + 1}
      {#if !f.late || moved}
        <button
          class="animal"
          class:late={f.late}
          class:gone={f.leaves && moved}
          class:on={no > 0}
          style="--r:{f.rot}deg; --d:{f.late ? (i - a) * 0.15 : i * 0.05}s"
          onclick={() => mark(i)}
          disabled={f.leaves && moved}
          aria-label={animal.name}
        >
          <span class="body">{animal.emoji}</span>
          {#if no}<span class="no">{no}</span>{/if}
        </button>
      {/if}
    {/each}
  </div>
{/key}

<p class="sentence" class:show={level.sentence || solved}>
  {a} {sign} {b} = <b class:blank={!solved}>{solved ? q.answer : '?'}</b>
</p>

{#if moved}
  <ChoiceButtons options={q.choices} isRight={(n) => n === q.answer} onpick={pickNumber} {wrong} {solved} />
{/if}
{#if !solved}
  <div class="center pad">
    <button class="btn light small" onclick={again}>🔁 Lihat lagi</button>
    {#if !hinted && moved}<button class="btn light small" onclick={countTogether}>💡 Hitung bersama</button>{/if}
  </div>
{/if}

<p class="msg {message.kind}" aria-live="polite">{message.text}</p>

<style>
  .field {
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    gap: 6px;
    max-width: 560px;
    min-height: 100px;
    margin: 14px auto;
    padding: 14px;
    border-radius: var(--radius);
    background: var(--card);
    box-shadow: var(--shadow);
    overflow: hidden;
  }

  .animal {
    position: relative;
    display: grid;
    place-items: center;
    width: clamp(54px, 15vw, 74px);
    height: clamp(54px, 15vw, 74px);
    border-radius: 50%;
    border: 4px solid transparent;
    font-size: clamp(2rem, 9vw, 3rem);
    line-height: 1;
    animation: pop 0.35s ease-out backwards;
    animation-delay: var(--d, 0s);
  }

  .body {
    display: inline-block;
    transform: rotate(var(--r));
    transition:
      transform 0.9s ease-in,
      opacity 0.9s ease-in;
  }

  .late {
    animation: arrive 0.6s ease-out backwards;
    animation-delay: var(--d, 0s);
    background: var(--soft-sun);
  }

  .gone {
    border: 3px dashed var(--dash);
  }

  .gone .body {
    transform: translate(40px, -90px) rotate(30deg) scale(0.6);
    opacity: 0;
  }

  .animal.on {
    border-color: var(--sun);
    background: var(--active-bg);
  }

  .no {
    position: absolute;
    top: -6px;
    right: -6px;
    display: grid;
    place-items: center;
    min-width: 26px;
    height: 26px;
    padding: 0 4px;
    border-radius: 999px;
    background: var(--sun);
    color: var(--on-sun);
    font-size: 0.95rem;
    font-weight: 700;
    animation: pop 0.25s ease-out;
  }

  @keyframes arrive {
    from {
      transform: translateX(160px);
      opacity: 0;
    }
  }

  .sentence {
    visibility: hidden;
    text-align: center;
    font-size: clamp(1.8rem, 8vw, 2.4rem);
    font-weight: 700;
    margin: 4px 0 12px;
  }

  .sentence.show {
    visibility: visible;
  }

  .sentence .blank {
    color: var(--muted);
  }

  .sentence b:not(.blank) {
    color: var(--ok);
  }

  .center {
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    gap: 10px;
  }

  .pad {
    margin-top: 14px;
  }

  .msg {
    margin-top: 16px;
  }
</style>
