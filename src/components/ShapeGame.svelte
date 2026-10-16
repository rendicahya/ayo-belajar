<script>
  import { untrack } from 'svelte';
  import { genShape, SHAPES } from '../lib/generate.js';
  import { play } from '../lib/sound.js';
  import { speak, canSpeak } from '../lib/speech.js';
  import Shape from './Shape.svelte';
  import ChoiceButtons from './ChoiceButtons.svelte';

  let props = $props();
  const level = untrack(() => props.level);
  const q = genShape(level);
  const { type } = level;

  let wrong = $state([]);
  let solved = $state(false);
  let message = $state({ text: '', kind: '' });
  let shake = $state(0);
  let attempts = 0;

  function finish(ok, badText, okText) {
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

  function pickChoice(o, i) {
    if (solved || wrong.includes(i)) return;
    const id = typeof o === 'string' ? o : o.id;
    const ok = (type === 'sides' || type === 'corners' ? o : id) === q.answer;
    if (!ok) wrong = [...wrong, i];
    const s = SHAPES[q.shape?.id ?? q.answer];
    finish(
      ok,
      {
        name: 'Belum tepat. Perhatikan sisi dan sudutnya. 💪',
        sides: 'Coba ketuk setiap sisinya untuk menghitung. 💪',
        corners: 'Coba ketuk setiap titik sudutnya untuk menghitung. 💪',
        clue: 'Belum tepat. Baca lagi cirinya, ya. 💪',
      }[type],
      {
        name: `Betul, ini ${s.name.toLowerCase()}!`,
        sides: `${s.name} punya ${s.sides} sisi.`,
        corners: s.corners ? `${s.name} punya ${s.corners} titik sudut.` : 'Lingkaran tidak punya titik sudut!',
        clue: `Betul, aku ${s.name.toLowerCase()}!`,
      }[type],
    );
  }

  // ---- tandai sisi / titik sudut ----
  let marked = $state([]);
  function mark(i) {
    if (solved) return;
    marked = marked.includes(i) ? marked.filter((x) => x !== i) : [...marked, i];
    play(marked.includes(i) ? 'pop' : 'tap');
  }

  // ---- cari semua bangun yang sama ----
  let chosen = $state([]);
  function toggle(i) {
    if (solved) return;
    chosen = chosen.includes(i) ? chosen.filter((x) => x !== i) : [...chosen, i];
    message = { text: '', kind: '' };
    play(chosen.includes(i) ? 'pop' : 'tap');
  }
  function checkFind() {
    if (solved || !chosen.length) return;
    const targets = q.field.map((s, i) => (s.id === q.target ? i : -1)).filter((i) => i >= 0);
    const extra = chosen.filter((i) => !targets.includes(i)).length;
    const missing = targets.filter((i) => !chosen.includes(i)).length;
    finish(
      !extra && !missing,
      extra ? `Ada ${extra} yang bukan ${SHAPES[q.target].name.toLowerCase()}. 💪` : `Masih ada ${missing} lagi yang belum dipilih. 💪`,
      `Betul! Ada ${targets.length} ${SHAPES[q.target].name.toLowerCase()}.`,
    );
  }
</script>

{#snippet nameItem(id)}{SHAPES[id].name}{/snippet}
{#snippet shapeItem(s)}
  <Shape shape={s} size={96} />
  {#if solved}<small class="cap">{SHAPES[s.id].name}</small>{/if}
{/snippet}

{#if type === 'name'}
  <p class="hint">Apa nama bangun ini?</p>
  <div class="stage"><Shape shape={q.shape} size={210} /></div>
  <ChoiceButtons options={q.choices} isRight={(o) => o === q.answer} onpick={pickChoice} {wrong} {solved} item={nameItem} wide />
{:else if type === 'find'}
  <p class="hint">Ketuk semua <b>{SHAPES[q.target].name.toLowerCase()}</b>, lalu tekan Cek.</p>
  {#key shake}
    <div class="field" class:bad={shake > 0 && !solved}>
      {#each q.field as s, i}
        <button class="tile" class:on={chosen.includes(i)} onclick={() => toggle(i)} aria-pressed={chosen.includes(i)} aria-label="Bangun {i + 1}">
          <Shape shape={s} size={84} selected={chosen.includes(i)} />
        </button>
      {/each}
    </div>
  {/key}
  <div class="center">
    <button class="btn" style="--c:var(--ok)" disabled={solved || !chosen.length} onclick={checkFind}>✔ Cek</button>
  </div>
{:else if type === 'sides' || type === 'corners'}
  <p class="hint">
    Berapa {type === 'sides' ? 'sisi' : 'titik sudut'} bangun ini?
    <span class="sub">Ketuk {type === 'sides' ? 'setiap sisi' : 'setiap titik sudut'} untuk menandai sambil menghitung.</span>
  </p>
  <div class="stage">
    <Shape shape={q.shape} size={230} mark={solved ? null : type} {marked} onmark={mark} />
  </div>
  <p class="count">Sudah ditandai: <b>{marked.length}</b></p>
  <ChoiceButtons options={q.choices} isRight={(o) => o === q.answer} onpick={pickChoice} {wrong} {solved} />
{:else}
  <div class="clue">
    <span class="who" aria-hidden="true">🕵️</span>
    <p>“{q.clue}” <b>Siapakah aku?</b></p>
    {#if canSpeak}<button class="say" onclick={() => speak(`${q.clue} Siapakah aku?`)} aria-label="Bacakan">🔊</button>{/if}
  </div>
  <div class="pick">
    <ChoiceButtons options={q.choices} isRight={(o) => o.id === q.answer} onpick={pickChoice} {wrong} {solved} item={shapeItem} />
  </div>
{/if}

<p class="msg {message.kind}" aria-live="polite">{message.text}</p>

<style>
  .sub {
    display: block;
    font-size: 0.9em;
  }

  .stage {
    display: flex;
    justify-content: center;
    margin: 14px auto;
    padding: 14px;
    max-width: 300px;
    border-radius: var(--radius);
    background: var(--card);
    box-shadow: var(--shadow);
  }

  .count {
    text-align: center;
    color: var(--muted);
    margin-bottom: 10px;
  }

  .field {
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: 8px;
    max-width: 520px;
    margin: 14px auto;
  }

  .field.bad {
    animation: shake 0.4s;
  }

  .tile {
    display: grid;
    place-items: center;
    aspect-ratio: 1;
    padding: 8px;
    border-radius: 18px;
    background: var(--card);
    box-shadow: var(--shadow);
    border: 4px solid transparent;
  }

  .tile.on {
    border-color: var(--sun);
    background: var(--active-bg);
  }

  .center {
    display: flex;
    justify-content: center;
  }

  .clue {
    display: flex;
    align-items: flex-start;
    gap: 12px;
    max-width: 640px;
    margin: 0 auto 16px;
    padding: 16px;
    border-radius: var(--radius);
    background: var(--card);
    box-shadow: var(--shadow);
    border: 3px solid var(--sky);
  }

  .who {
    font-size: 2.4rem;
    line-height: 1;
  }

  .clue p {
    flex: 1;
    font-size: 1.2rem;
    line-height: 1.45;
  }

  .say {
    font-size: 1.6rem;
    line-height: 1;
  }

  .pick :global(.choice) {
    display: grid;
    justify-items: center;
    flex-basis: 130px;
    background: var(--card) !important;
    border: 3px solid var(--line);
    box-shadow: var(--shadow);
    color: var(--ink);
  }

  .pick :global(.choice.right) {
    border-color: var(--ok);
    background: var(--ok-soft) !important;
  }

  .cap {
    font-size: 0.9rem;
    font-weight: 600;
  }

  .msg {
    margin-top: 16px;
  }
</style>
