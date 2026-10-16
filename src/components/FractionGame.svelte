<script>
  import { untrack } from 'svelte';
  import { genFraction, shuffle } from '../lib/generate.js';
  import { play } from '../lib/sound.js';
  import { speak, fractionWords } from '../lib/speech.js';
  import Pizza from './Pizza.svelte';

  let props = $props();
  const level = untrack(() => props.level);
  const q = genFraction(level);
  const { type } = level;
  const say = (f) => fractionWords(f.k, f.d);

  let solved = $state(false);
  let message = $state({ text: '', kind: '' });
  let shake = $state(0);
  let attempts = 0;

  function finish(ok, badText, okText = '') {
    if (ok) {
      solved = true;
      message = { text: okText, kind: 'ok' };
      play('correct');
      props.onSolved(attempts === 0);
    } else {
      attempts++;
      shake++;
      message = { text: badText, kind: 'bad' };
      play('wrong');
    }
  }

  // ---- kenali pecahan ----
  // potongan bertopping diacak supaya anak menghitung, bukan melihat pola
  const shown = type === 'identify' ? shuffle([...Array(q.target.d).keys()]).slice(0, q.target.k) : [];
  let wrongChoices = $state([]);
  function choose(c, i) {
    if (solved || wrongChoices.includes(i)) return;
    if (c.k !== q.target.k || c.d !== q.target.d) wrongChoices = [...wrongChoices, i];
    finish(
      c.k === q.target.k && c.d === q.target.d,
      'Belum tepat. Hitung semua potongannya, lalu yang bertopping. 💪',
      `${q.target.k} dari ${q.target.d} potongan, jadi ${q.target.k}/${q.target.d} (${say(q.target)}).`,
    );
  }

  // ---- warnai pizza ----
  let colored = $state([]);
  function toggle(i) {
    if (solved) return;
    colored = colored.includes(i) ? colored.filter((x) => x !== i) : [...colored, i];
    message = { text: '', kind: '' };
    play(colored.includes(i) ? 'pop' : 'tap');
  }
  function checkColor() {
    if (solved) return;
    const n = colored.length;
    const { k, d } = q.target;
    finish(
      n === k,
      n < k ? `Baru ${n} potongan. Tambah lagi, ya! 💪` : `Kebanyakan! Yang diminta hanya ${k} potongan. 💪`,
      `Betul! ${k} dari ${d} potongan = ${k}/${d}.`,
    );
  }

  // ---- bandingkan ----
  const cmp = q.a ? Math.sign(q.a.k * q.b.d - q.b.k * q.a.d) : 0;
  const correct = cmp < 0 ? '<' : cmp > 0 ? '>' : '=';
  const choices = [
    { sym: '<', label: 'Lebih kecil', phrase: 'lebih kecil dari', key: ['<', ','] },
    { sym: '=', label: 'Sama dengan', phrase: 'sama dengan', key: ['='] },
    { sym: '>', label: 'Lebih besar', phrase: 'lebih besar dari', key: ['>', '.'] },
  ];
  let wrongSyms = $state([]);
  let picked = $state(null);
  function compare(c) {
    if (solved || wrongSyms.includes(c.sym)) return;
    picked = c.sym;
    if (c.sym !== correct) {
      wrongSyms = [...wrongSyms, c.sym];
      setTimeout(() => !solved && (picked = null), 700);
    }
    const phrase = choices.find((x) => x.sym === correct).phrase;
    finish(
      c.sym === correct,
      'Belum tepat. Lihat pizzanya: mana yang toppingnya lebih banyak? 💪',
      `${q.a.k}/${q.a.d} ${phrase} ${q.b.k}/${q.b.d}.${cmp === 0 ? ' Bagiannya sama banyak walau potongannya berbeda!' : ''}`,
    );
  }

  function onkeydown(e) {
    if (!q.a) return;
    const c = choices.find((c) => c.key.includes(e.key));
    if (c) {
      e.preventDefault();
      compare(c);
    }
  }
</script>

<svelte:window {onkeydown} />

{#snippet frac(f, cls = '')}
  <span class="frac {cls}" aria-label={say(f)}><span>{f.k}</span><span class="bar"></span><span>{f.d}</span></span>
{/snippet}

{#if type === 'identify'}
  <p class="hint">Pizza ini dipotong sama besar. Berapa bagian yang diberi <b>topping</b>?</p>
  <div class="center">
    {#key shake}<Pizza d={q.target.d} filled={shown} size={220} bad={shake > 0 && !solved} />{/key}
  </div>
  <div class="choices">
    {#each q.choices as c, i}
      <button
        class="choice"
        class:wrong={wrongChoices.includes(i)}
        class:right={solved && c.k === q.target.k && c.d === q.target.d}
        disabled={solved || wrongChoices.includes(i)}
        onclick={() => choose(c, i)}
      >
        {@render frac(c)}
      </button>
    {/each}
  </div>
{:else if type === 'color'}
  <p class="hint">Ketuk potongan pizza untuk memberi topping sebanyak pecahan ini.</p>
  <div class="target">
    <button class="say" onclick={() => speak(say(q.target))} aria-label="Dengarkan {say(q.target)}">
      {@render frac(q.target, 'big')}
    </button>
    {#key shake}<Pizza d={q.target.d} filled={colored} ontoggle={solved ? null : toggle} size={240} bad={shake > 0 && !solved} />{/key}
  </div>
  <p class="count">Bertopping: <b>{colored.length}</b> dari {q.target.d} potongan</p>
  <div class="center">
    <button class="btn" style="--c:var(--ok)" disabled={solved || !colored.length} onclick={checkColor}>✔ Cek</button>
  </div>
{:else}
  <p class="hint">Mana yang lebih banyak? Lihat pizzanya, lalu pilih tandanya.</p>
  <div class="duel">
    {#each [q.a, q.b] as f, i}
      {#if i === 1}
        {#key shake}
          <div class="slot" class:ok={solved} class:bad={picked && !solved}>{picked ?? '?'}</div>
        {/key}
      {/if}
      <button class="side" onclick={() => speak(say(f))} aria-label="Dengarkan {say(f)}">
        <Pizza d={f.d} filled={[...Array(f.k).keys()]} size={150} />
        {@render frac(f, 'mid')}
      </button>
    {/each}
  </div>
  <div class="cmp">
    {#each choices as c}
      <button
        class="cchoice"
        class:wrong={wrongSyms.includes(c.sym)}
        class:right={solved && c.sym === correct}
        disabled={solved || wrongSyms.includes(c.sym)}
        onclick={() => compare(c)}
      >
        <span class="sym">{c.sym}</span>
        <span class="label">{c.label}</span>
      </button>
    {/each}
  </div>
{/if}

<p class="msg {message.kind}" aria-live="polite">{message.text}</p>

<style>
  .center {
    display: flex;
    justify-content: center;
    margin: 14px 0;
  }

  .frac {
    display: inline-grid;
    justify-items: center;
    line-height: 1;
    font-weight: 700;
    font-variant-numeric: tabular-nums;
  }

  .frac .bar {
    width: 1.3em;
    height: 0.12em;
    margin: 0.1em 0;
    border-radius: 9px;
    background: currentColor;
  }

  .frac.big {
    font-size: clamp(3rem, 14vw, 4.4rem);
    color: var(--coral);
  }

  .frac.mid {
    font-size: 2.2rem;
  }

  .choices {
    display: flex;
    justify-content: center;
    gap: 10px;
  }

  .choice {
    flex: 0 1 120px;
    padding: 10px 4px;
    border-radius: var(--radius);
    background: var(--coral);
    color: #fff;
    font-size: clamp(1.8rem, 8vw, 2.4rem);
    box-shadow: 0 6px 0 rgba(0, 0, 0, 0.2);
  }

  .choice:nth-child(2) {
    background: var(--sky);
  }

  .choice:nth-child(3) {
    background: var(--grape);
  }

  .choice:nth-child(4) {
    background: var(--pink);
  }

  .choice:active:not(:disabled),
  .cchoice:active:not(:disabled) {
    transform: translateY(5px);
    box-shadow: 0 1px 0 rgba(0, 0, 0, 0.2);
  }

  .choice.wrong,
  .cchoice.wrong {
    opacity: 0.3;
  }

  .choice.right,
  .cchoice.right {
    background: var(--ok);
    color: #fff;
  }

  .target {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: center;
    gap: 16px 36px;
    margin: 14px 0 6px;
  }

  .say {
    padding: 10px 24px;
    border-radius: var(--radius);
    background: var(--card);
    box-shadow: var(--shadow);
  }

  .count {
    text-align: center;
    color: var(--muted);
    font-size: 1.1rem;
    margin-bottom: 10px;
  }

  .duel {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: clamp(8px, 3vw, 28px);
    margin: 16px 0;
  }

  .side {
    display: grid;
    justify-items: center;
    gap: 8px;
    width: clamp(120px, 36vw, 190px);
    padding: 12px 8px;
    border-radius: var(--radius);
    background: var(--card);
    box-shadow: var(--shadow);
    color: var(--ink);
  }

  .slot {
    display: grid;
    place-items: center;
    flex: none;
    width: clamp(54px, 14vw, 90px);
    height: clamp(54px, 14vw, 90px);
    border-radius: 50%;
    border: 4px dashed #c9c3dd;
    background: var(--card);
    font-size: clamp(1.8rem, 8vw, 3rem);
    font-weight: 700;
    color: var(--muted);
  }

  .slot.ok {
    border: 4px solid var(--ok);
    background: var(--ok-soft);
    color: var(--ok);
    animation: pop 0.3s ease-out;
  }

  .slot.bad {
    border: 4px solid var(--bad);
    background: var(--bad-soft);
    color: var(--bad);
    animation: shake 0.4s;
  }

  .cmp {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 170px));
    justify-content: center;
    gap: 10px;
  }

  .cchoice {
    display: grid;
    justify-items: center;
    gap: 2px;
    padding: 12px 6px;
    border-radius: var(--radius);
    background: var(--grape);
    color: #fff;
    box-shadow: 0 6px 0 rgba(0, 0, 0, 0.2);
  }

  .cchoice:nth-child(2) {
    background: var(--sun);
    color: var(--ink);
  }

  .cchoice:nth-child(3) {
    background: var(--pink);
  }

  .sym {
    font-size: 2.4rem;
    font-weight: 700;
    line-height: 1;
  }

  .label {
    font-weight: 500;
    font-size: clamp(0.85rem, 3.4vw, 1.1rem);
  }

  .msg {
    margin-top: 16px;
  }
</style>
