<script>
  import { untrack, onDestroy } from 'svelte';
  import { genCount } from '../lib/generate.js';
  import { play } from '../lib/sound.js';
  import { speak, canSpeak } from '../lib/speech.js';
  import { settings } from '../lib/settings.svelte.js';
  import ChoiceButtons from './ChoiceButtons.svelte';

  let props = $props();
  const level = untrack(() => props.level);
  const q = genCount(level);
  const { type } = level;

  const question =
    type === 'count'
      ? `Ada berapa ${q.animal.name}?`
      : type === 'mixed'
        ? `Ada berapa ${q.animal.name}? Hitung ${q.animal.name} saja, ya.`
        : type === 'take'
          ? `Ambil ${q.answer} ${q.animal.name}.`
          : `Mana yang lebih ${q.ask === 'more' ? 'banyak' : 'sedikit'}?`;
  const say = (text) => !settings.muted && speak(text);
  say(question);

  let wrong = $state([]);
  let solved = $state(false);
  let hinted = $state(false);
  let message = $state({ text: '', kind: '' });
  let shake = $state(0);
  let attempts = 0;

  function finish(ok, badText, okText) {
    if (ok) {
      solved = true;
      message = { text: okText, kind: 'ok' };
      play('correct');
      say(okText);
      props.onSolved(attempts === 0 && !hinted);
    } else {
      attempts++;
      shake++;
      message = { text: badText, kind: 'bad' };
      play('wrong');
    }
  }

  // ---- ketuk hewan untuk menghitung / mengambil ----
  let marked = $state([]);
  const isTarget = (a) => a.emoji === q.animal.emoji;
  function mark(i) {
    if (solved || timer) return;
    if (!isTarget(q.field[i])) {
      play('tap');
      return;
    }
    if (marked.includes(i)) {
      marked = marked.filter((x) => x !== i);
      play('tap');
    } else {
      marked = [...marked, i];
      play('pop');
      if (type !== 'take') say(String(marked.length));
    }
    if (type === 'take') message = { text: '', kind: '' };
  }

  // petunjuk: hitung bersama satu per satu
  let timer = null;
  function countTogether() {
    hinted = true;
    marked = [];
    const targets = q.field.map((a, i) => (isTarget(a) ? i : -1)).filter((i) => i >= 0);
    let k = 0;
    timer = setInterval(() => {
      marked = [...marked, targets[k]];
      play('pop');
      say(String(++k));
      if (k >= targets.length) {
        clearInterval(timer);
        timer = null;
      }
    }, 800);
  }
  onDestroy(() => clearInterval(timer));

  function pickNumber(n, i) {
    if (solved || wrong.includes(i)) return;
    if (n !== q.answer) wrong = [...wrong, i];
    finish(n === q.answer, 'Belum tepat. Ketuk setiap hewan sambil menghitung, ya! 💪', `Betul, ada ${q.answer} ${q.animal.name}!`);
  }

  function checkTake() {
    if (solved || !marked.length) return;
    const n = marked.length;
    finish(
      n === q.answer,
      n > q.answer ? `Kebanyakan! Kamu mengambil ${n}. Kembalikan ${n - q.answer}, ya. 💪` : `Kurang! Kamu baru mengambil ${n}. Ambil ${q.answer - n} lagi, ya. 💪`,
      `Betul, ${q.answer} ${q.animal.name}!`,
    );
  }

  function pickGroup(g) {
    if (solved || wrong.includes(g)) return;
    if (g !== q.answer) wrong = [...wrong, g];
    const [a, b] = q.groups;
    const ok = g === q.answer;
    const big = a.n > b.n ? a : b;
    const small = a.n > b.n ? b : a;
    finish(
      ok,
      'Belum tepat. Coba hitung setiap kelompok dulu, ya! 💪',
      q.ask === 'more'
        ? `Betul! ${big.n} ${big.animal.name} lebih banyak dari ${small.n} ${small.animal.name}.`
        : `Betul! ${small.n} ${small.animal.name} lebih sedikit dari ${big.n} ${big.animal.name}.`,
    );
  }
</script>

<div class="ask">
  <p>{question}</p>
  {#if canSpeak}<button class="say" onclick={() => speak(question)} aria-label="Bacakan">🔊</button>{/if}
</div>

{#if type === 'compare'}
  <div class="groups">
    {#each q.groups as g, gi}
      <button
        class="group"
        class:wrong={wrong.includes(gi)}
        class:right={solved && gi === q.answer}
        disabled={solved || wrong.includes(gi)}
        onclick={() => pickGroup(gi)}
        aria-label="Kelompok {g.animal.name}"
      >
        <span class="herd small">
          {#each g.field as a, i}
            <span class="animal" style="--r:{a.rot}deg; --dy:{a.dy}px; --d:{i * 0.05}s">{a.emoji}</span>
          {/each}
        </span>
        {#if solved}<b class="tally">{g.n}</b>{/if}
      </button>
    {/each}
  </div>
{:else}
  {#key type === 'take' ? shake : 0}
    <div class="field" class:bad={type === 'take' && shake > 0 && !solved}>
      {#each q.field as a, i}
        {@const no = marked.indexOf(i) + 1}
        <button
          class="animal tap"
          class:on={no > 0}
          style="--r:{a.rot}deg; --dy:{a.dy}px; --d:{i * 0.05}s"
          onclick={() => mark(i)}
          aria-label={a.name}
        >
          {a.emoji}
          {#if no}<span class="no">{no}</span>{/if}
        </button>
      {/each}
    </div>
  {/key}

  {#if type === 'take'}
    <p class="count">Sudah diambil: <b>{marked.length}</b></p>
    <div class="center">
      <button class="btn" style="--c:var(--ok)" disabled={solved || !marked.length} onclick={checkTake}>✔ Cek</button>
    </div>
  {:else}
    <p class="count">Ketuk setiap {q.animal.name} sambil menghitung.</p>
    <ChoiceButtons options={q.choices} isRight={(n) => n === q.answer} onpick={pickNumber} {wrong} {solved} />
    {#if !solved && !hinted}
      <div class="center pad">
        <button class="btn light small" onclick={countTogether}>💡 Hitung bersama</button>
      </div>
    {/if}
  {/if}
{/if}

<p class="msg {message.kind}" aria-live="polite">{message.text}</p>

<style>
  .ask {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 10px;
    margin-bottom: 6px;
  }

  .ask p {
    font-size: clamp(1.3rem, 5.5vw, 1.8rem);
    font-weight: 700;
    text-align: center;
  }

  .say {
    font-size: 1.6rem;
    line-height: 1;
  }

  .field {
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    gap: 6px;
    max-width: 560px;
    margin: 14px auto;
    padding: 14px;
    border-radius: var(--radius);
    background: var(--card);
    box-shadow: var(--shadow);
  }

  .field.bad {
    animation: shake 0.4s;
  }

  .animal {
    position: relative;
    display: inline-grid;
    place-items: center;
    font-size: clamp(2.2rem, 10vw, 3.2rem);
    line-height: 1;
    transform: translateY(var(--dy)) rotate(var(--r));
    animation: pop 0.35s ease-out backwards;
    animation-delay: var(--d, 0s);
  }

  .tap {
    width: clamp(58px, 16vw, 80px);
    height: clamp(58px, 16vw, 80px);
    border-radius: 50%;
    border: 4px solid transparent;
    transition: background 0.15s;
  }

  .tap.on {
    border-color: var(--sun);
    background: var(--active-bg);
  }

  .no {
    position: absolute;
    top: -6px;
    right: -6px;
    display: grid;
    place-items: center;
    min-width: 28px;
    height: 28px;
    padding: 0 4px;
    border-radius: 999px;
    background: var(--sun);
    color: var(--on-sun);
    font-size: 1rem;
    font-weight: 700;
    animation: pop 0.25s ease-out;
  }

  .count {
    text-align: center;
    color: var(--muted);
    margin-bottom: 10px;
  }

  .groups {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 12px;
    max-width: 640px;
    margin: 14px auto;
  }

  .group {
    display: grid;
    align-content: center;
    justify-items: center;
    gap: 8px;
    min-height: 180px;
    padding: 12px 8px;
    border-radius: var(--radius);
    background: var(--card);
    box-shadow: var(--shadow);
    border: 4px solid var(--line);
    transition: opacity 0.2s;
  }

  .group:active:not(:disabled) {
    transform: scale(0.97);
  }

  .group.wrong {
    opacity: 0.35;
  }

  .group.right {
    border-color: var(--ok);
    background: var(--ok-soft);
  }

  .herd {
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    gap: 4px;
  }

  .herd.small .animal {
    font-size: clamp(1.7rem, 7vw, 2.4rem);
    padding: 2px;
  }

  .tally {
    font-size: 2rem;
    color: var(--ok);
  }

  .center {
    display: flex;
    justify-content: center;
  }

  .pad {
    margin-top: 14px;
  }

  .msg {
    margin-top: 16px;
  }
</style>
