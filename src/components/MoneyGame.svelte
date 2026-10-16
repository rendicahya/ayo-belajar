<script>
  import { untrack } from 'svelte';
  import { genMoney, rupiah, sum } from '../lib/generate.js';
  import { play } from '../lib/sound.js';
  import { speak } from '../lib/speech.js';
  import Keypad from './Keypad.svelte';
  import Money from './Money.svelte';

  let props = $props();
  const level = untrack(() => props.level);
  const q = genMoney(level);
  const { type } = level;
  const total = q.items ? sum(q.items.map((i) => i.price)) : 0;

  let stage = $state(0); // soal "shop": 0 = total, 1 = kembalian
  let typed = $state('');
  let solved = $state(false);
  let message = $state({ text: '', kind: '' });
  let shake = $state(0);
  let attempts = 0;

  const showNote = $derived(type === 'change' || (type === 'shop' && stage === 1));
  const question = $derived(
    {
      count: 'Berapa jumlah semua uang ini?',
      total: 'Berapa total harga belanjaannya?',
      change: 'Berapa uang kembaliannya?',
      shop: stage === 0 ? 'Langkah 1: Berapa total harga belanjaannya?' : 'Langkah 2: Berapa uang kembaliannya?',
    }[type],
  );

  function wrong(text) {
    attempts++;
    shake++;
    message = { text, kind: 'bad' };
    play('wrong');
  }

  function win(text) {
    solved = true;
    message = { text, kind: 'ok' };
    play('correct');
    props.onSolved(attempts === 0);
  }

  // ---- ketik jumlah uang ----
  function input(d) {
    if (solved || typed.length >= 6 || (typed === '' && d === 0)) return;
    typed += d;
    message = { text: '', kind: '' };
    play('tap');
  }
  function erase() {
    if (!solved) typed = typed.slice(0, -1);
  }
  function check() {
    if (solved || !typed) return;
    const got = Number(typed);
    const exp = q.answers[stage];
    if (got !== exp) {
      const hint =
        type === 'count'
          ? 'Jumlahkan dari uang yang paling besar, ya.'
          : showNote
            ? `Kembalian = uang yang dibayar − harga.`
            : 'Jumlahkan semua harganya, ya.';
      wrong(`${got > exp ? 'Kebanyakan' : 'Kurang'}! ${hint} 💪`);
      return;
    }
    if (type === 'shop' && stage === 0) {
      stage = 1;
      typed = '';
      message = { text: `Betul, totalnya ${rupiah(total)}! 👍`, kind: 'ok' };
      play('pop');
      return;
    }
    win(
      showNote
        ? `${rupiah(q.note)} − ${rupiah(q.note - q.answers.at(-1))} = ${rupiah(q.answers.at(-1))}. Kembaliannya ${rupiah(q.answers.at(-1))}.`
        : `Betul, ${rupiah(exp)}!`,
    );
  }

  // ---- bayar dengan uang pas ----
  let tray = $state([]);
  const paid = $derived(sum(tray));
  function addMoney(v) {
    if (solved) return;
    tray = [...tray, v].sort((a, b) => b - a);
    message = { text: '', kind: '' };
    play('pop');
  }
  function removeMoney(i) {
    if (solved) return;
    tray = tray.filter((_, j) => j !== i);
    play('tap');
  }
  function checkPay() {
    if (solved || !tray.length) return;
    const price = q.items[0].price;
    if (paid === price) win(`Pas! Uangmu ${rupiah(paid)}. 🎉`);
    else if (paid > price) wrong(`Uangmu ${rupiah(paid)}, kelebihan ${rupiah(paid - price)}. Ketuk uang di dompet untuk mengambilnya kembali. 💪`);
    else wrong(`Uangmu ${rupiah(paid)}, masih kurang ${rupiah(price - paid)}. 💪`);
  }

  function onkeydown(e) {
    if (type === 'pay' || e.ctrlKey || e.metaKey || e.altKey) return;
    if (/^[0-9]$/.test(e.key)) input(Number(e.key));
    else if (e.key === 'Backspace') erase();
    else if (e.key === 'Enter') check();
    else return;
    e.preventDefault();
  }
</script>

<svelte:window {onkeydown} />

{#if type === 'count'}
  <p class="hint">Hitung semua uang di bawah ini.</p>
  <div class="cash">
    {#each q.pieces as v}<Money value={v} />{/each}
  </div>
{:else}
  <div class="shop">
    <div class="awning" aria-hidden="true"></div>
    <p class="shopname">🏪 Warung Ceria</p>
    <div class="items">
      {#each q.items as item}
        <button class="item" onclick={() => speak(`${item.name} ${rupiah(item.price)}`)} aria-label="{item.name} {rupiah(item.price)}">
          <span class="emoji">{item.emoji}</span>
          <span class="name">{item.name}</span>
          <span class="price">{rupiah(item.price)}</span>
        </button>
      {/each}
    </div>
    {#if type === 'shop' && stage === 1}
      <p class="sum">Total belanja: <b>{rupiah(total)}</b></p>
    {/if}
  </div>
{/if}

{#if showNote}
  <div class="pay">
    <span>Kamu membayar dengan</span>
    <Money value={q.note} />
  </div>
{/if}

{#if type === 'pay'}
  <p class="hint">Ketuk uang untuk membayar <b>{q.items[0].name}</b> dengan uang pas.</p>
  <div class="wallet">
    {#each q.wallet as v}<Money value={v} onclick={() => addMoney(v)} />{/each}
  </div>
  {#key shake}
    <div class="tray" class:bad={shake > 0 && !solved} class:ok={solved}>
      <span class="traylabel">👛 Uang yang dibayar: <b>{rupiah(paid)}</b></span>
      <div class="traycash">
        {#each tray as v, i (i + '-' + v)}
          <Money value={v} small onclick={() => removeMoney(i)} />
        {:else}
          <span class="empty">Belum ada uang</span>
        {/each}
      </div>
    </div>
  {/key}
  <p class="msg {message.kind}" aria-live="polite">{message.text}</p>
  <div class="center">
    <button class="btn" style="--c:var(--ok)" disabled={solved || !tray.length} onclick={checkPay}>✔ Bayar</button>
  </div>
{:else}
  <p class="question">{question}</p>
  {#key shake}
    <div class="amount" class:bad={shake > 0 && !solved && message.kind === 'bad'} class:ok={solved}>
      <span class="rp">Rp</span>
      <span class="val">{typed ? rupiah(Number(typed)).slice(2) : ''}<span class="caret" class:hide={solved}></span></span>
    </div>
  {/key}
  <p class="msg {message.kind}" aria-live="polite">{message.text}</p>
  <div class="center">
    <Keypad oninput={input} onerase={erase} oncheck={check} canCheck={!!typed} disabled={solved} />
  </div>
{/if}

<style>
  .cash,
  .wallet {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: center;
    gap: 10px;
    margin: 14px auto;
    max-width: 600px;
  }

  .shop {
    position: relative;
    max-width: 640px;
    margin: 0 auto;
    padding: 34px 12px 14px;
    border-radius: var(--radius);
    background: var(--card);
    box-shadow: var(--shadow);
    overflow: hidden;
  }

  .awning {
    position: absolute;
    inset: 0 0 auto;
    height: 22px;
    background: repeating-linear-gradient(90deg, var(--coral) 0 28px, var(--card) 28px 56px);
    border-bottom: 3px solid rgba(0, 0, 0, 0.08);
  }

  .shopname {
    text-align: center;
    font-weight: 600;
    color: var(--muted);
    margin-bottom: 10px;
  }

  .items {
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    gap: 10px;
  }

  .item {
    display: grid;
    justify-items: center;
    gap: 2px;
    width: clamp(96px, 27vw, 140px);
    padding: 10px 6px;
    border-radius: 18px;
    background: var(--bg);
    border: 3px solid var(--line);
  }

  .emoji {
    font-size: 2.6rem;
    line-height: 1.1;
  }

  .name {
    font-weight: 500;
  }

  .price {
    padding: 2px 10px;
    border-radius: 999px;
    background: var(--sun);
    color: var(--on-sun);
    font-weight: 700;
    font-size: 1.1rem;
  }

  .sum {
    margin-top: 12px;
    text-align: center;
    font-size: 1.15rem;
  }

  .pay {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: center;
    gap: 10px;
    margin: 14px 0 4px;
    font-weight: 500;
  }

  .question {
    margin: 14px 0 8px;
    text-align: center;
    font-size: 1.2rem;
    font-weight: 600;
  }

  .amount {
    display: flex;
    align-items: baseline;
    justify-content: center;
    gap: 8px;
    width: min(100%, 340px);
    margin: 0 auto 6px;
    padding: 8px 16px;
    border-radius: 20px;
    border: 4px solid var(--sun);
    background: var(--active-bg);
    font-variant-numeric: tabular-nums;
  }

  .amount.ok {
    border-color: var(--ok);
    background: var(--ok-soft);
    color: var(--ok);
  }

  .amount.bad {
    border-color: var(--bad);
    background: var(--bad-soft);
    animation: shake 0.4s;
  }

  .rp {
    font-size: 1.6rem;
    font-weight: 600;
    color: var(--muted);
  }

  .val {
    min-width: 4ch;
    font-size: clamp(2.2rem, 10vw, 3rem);
    font-weight: 700;
  }

  .caret {
    display: inline-block;
    width: 3px;
    height: 0.9em;
    margin-left: 3px;
    vertical-align: -0.08em;
    background: var(--ink);
    animation: blink 1s steps(1) infinite;
  }

  .caret.hide {
    display: none;
  }

  @keyframes blink {
    50% {
      opacity: 0;
    }
  }

  .tray {
    display: grid;
    gap: 8px;
    max-width: 600px;
    margin: 6px auto 0;
    padding: 12px;
    border-radius: var(--radius);
    background: var(--card);
    box-shadow: var(--shadow);
    border: 3px dashed var(--line);
  }

  .tray.bad {
    border: 3px solid var(--bad);
    animation: shake 0.4s;
  }

  .tray.ok {
    border: 3px solid var(--ok);
  }

  .traylabel {
    text-align: center;
    font-size: 1.1rem;
  }

  .traycash {
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    gap: 6px;
    min-height: 48px;
  }

  .empty {
    align-self: center;
    color: var(--muted);
  }

  .shop + .hint {
    margin-top: 14px;
  }

  .center {
    display: flex;
    justify-content: center;
  }

  .msg {
    margin: 10px 0;
  }
</style>
