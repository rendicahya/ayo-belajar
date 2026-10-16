<script>
  import { untrack } from 'svelte';
  import { genCompare, genExprCompare } from '../lib/generate.js';
  import { play } from '../lib/sound.js';
  import { speak } from '../lib/speech.js';

  let props = $props();
  const level = untrack(() => props.level);

  const { left, right } = level.expr
    ? genExprCompare(level)
    : (({ a, b }) => ({ left: { text: String(a), value: a }, right: { text: String(b), value: b } }))(
        genCompare(level),
      );
  const isExpr = Boolean(level.expr);
  const correct = left.value < right.value ? '<' : left.value > right.value ? '>' : '=';
  const choices = [
    { sym: '<', label: 'Lebih kecil', phrase: 'lebih kecil dari', key: ['<', ','] },
    { sym: '=', label: 'Sama dengan', phrase: 'sama dengan', key: ['='] },
    { sym: '>', label: 'Lebih besar', phrase: 'lebih besar dari', key: ['>', '.'] },
  ];

  let wrong = $state([]);
  let shown = $state(null);
  let solved = $state(false);
  let shake = $state(0);
  let attempts = 0;

  function choose(c) {
    if (solved || wrong.includes(c.sym)) return;
    shown = c.sym;
    if (c.sym === correct) {
      solved = true;
      play('correct');
      props.onSolved(attempts === 0);
    } else {
      attempts++;
      shake++;
      wrong = [...wrong, c.sym];
      play('wrong');
      setTimeout(() => {
        if (!solved) shown = null;
      }, 700);
    }
  }

  function onkeydown(e) {
    const c = choices.find((c) => c.key.includes(e.key));
    if (c) {
      e.preventDefault();
      choose(c);
    }
  }

  const sentence = $derived(
    solved
      ? isExpr
        ? `${left.text} = ${left.value}, ${right.text} = ${right.value}. Jadi ${left.text} ${choices.find((c) => c.sym === correct).phrase} ${right.text}.`
        : `${left.text} ${choices.find((c) => c.sym === correct).phrase} ${right.text}`
      : '',
  );
</script>

<svelte:window {onkeydown} />

<p class="hint">
  {#if isExpr}Hitung dulu kedua sisi, lalu pilih tandanya.{:else}Bilangan kiri <b>dibanding</b> bilangan kanan, tandanya apa?{/if}
  <span class="sub">🔊 Ketuk bilangan untuk mendengarnya.</span>
</p>

<div class="duel" class:expr={isExpr}>
  <button class="num" style="--c:var(--coral)" onclick={() => speak(left.text)}>{left.text}</button>
  {#key shake}
    <div class="slot" class:ok={solved} class:bad={shown && !solved}>{shown ?? '?'}</div>
  {/key}
  <button class="num" style="--c:var(--sky)" onclick={() => speak(right.text)}>{right.text}</button>
</div>

<div class="choices">
  {#each choices as c}
    <button
      class="choice"
      class:wrong={wrong.includes(c.sym)}
      class:right={solved && c.sym === correct}
      disabled={solved || wrong.includes(c.sym)}
      onclick={() => choose(c)}
    >
      <span class="sym">{c.sym}</span>
      <span class="label">{c.label}</span>
    </button>
  {/each}
</div>

{#if solved}
  <p class="msg ok">{sentence}</p>
{:else if wrong.length}
  <p class="msg bad">Belum tepat, coba tanda yang lain! 💪</p>
{:else}
  <p class="tip">🐊 Ingat: mulut buaya selalu terbuka ke bilangan yang <b>lebih besar</b>!</p>
{/if}

<style>
  .sub {
    display: block;
    font-size: 0.9em;
  }

  .duel {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: clamp(8px, 3vw, 28px);
    margin: 24px 0;
  }

  .num {
    flex: 0 1 auto;
    min-width: clamp(84px, 26vw, 220px);
    padding: 16px 12px;
    border-radius: var(--radius);
    background: var(--card);
    border: 4px solid var(--c);
    box-shadow: var(--shadow);
    text-align: center;
    font-size: clamp(2.2rem, 10vw, 5rem);
    font-weight: 600;
    line-height: 1.1;
    color: var(--c);
    font-variant-numeric: tabular-nums;
    white-space: nowrap;
  }

  .expr .num {
    font-size: clamp(1.6rem, 6.5vw, 3.4rem);
  }

  .slot {
    display: grid;
    place-items: center;
    flex: none;
    width: clamp(58px, 15vw, 110px);
    height: clamp(58px, 15vw, 110px);
    border-radius: 50%;
    border: 4px dashed var(--dash);
    background: var(--card);
    font-size: clamp(2rem, 9vw, 4rem);
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

  /* Ekspresi panjang di layar sempit: susun atas-bawah */
  @media (max-width: 560px) {
    .duel.expr {
      flex-direction: column;
      gap: 10px;
    }

    .expr .num {
      width: min(100%, 300px);
      font-size: 2.6rem;
    }
  }

  .choices {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 170px));
    justify-content: center;
    gap: 10px;
  }

  .choice {
    display: grid;
    justify-items: center;
    gap: 2px;
    padding: 12px 6px;
    border-radius: var(--radius);
    background: var(--grape);
    color: #fff;
    box-shadow: 0 6px 0 rgba(0, 0, 0, 0.2);
    transition:
      transform 0.08s,
      opacity 0.2s;
  }

  .choice:nth-child(2) {
    background: var(--sun);
    color: var(--on-sun);
  }

  .choice:nth-child(3) {
    background: var(--pink);
  }

  .choice:active:not(:disabled) {
    transform: translateY(5px);
    box-shadow: 0 1px 0 rgba(0, 0, 0, 0.2);
  }

  .choice:disabled {
    cursor: default;
  }

  .choice.wrong {
    opacity: 0.3;
  }

  .choice.right {
    background: var(--ok);
    color: #fff;
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
    margin-top: 18px;
    font-size: 1.25rem;
  }

  .tip {
    margin-top: 18px;
    text-align: center;
    color: var(--muted);
  }
</style>
