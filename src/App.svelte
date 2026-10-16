<script>
  import { MODES } from './lib/modes.js';
  import { settings, toggleMute } from './lib/settings.svelte.js';
  import Home from './components/Home.svelte';
  import LevelSelect from './components/LevelSelect.svelte';
  import Game from './components/Game.svelte';

  let hash = $state(location.hash);

  // #/ → beranda, #/tambah → pilih level, #/tambah/2 → main level 2
  const route = $derived.by(() => {
    const [modeId, levelNo] = hash.replace(/^#\/?/, '').split('/');
    const mode = MODES[modeId];
    if (!mode) return { page: 'home' };
    const levelIndex = Number(levelNo) - 1;
    if (Number.isInteger(levelIndex) && mode.levels[levelIndex]) {
      return { page: 'game', mode, levelIndex, back: `#/${mode.id}` };
    }
    return { page: 'levels', mode, back: '#/' };
  });
</script>

<svelte:window onhashchange={() => (hash = location.hash)} />

<header>
  {#if route.back}
    <a class="round" href={route.back} aria-label="Kembali">←</a>
  {:else}
    <span class="round logo" aria-hidden="true">🧮</span>
  {/if}
  <div class="title">
    {#if route.mode}
      <span class="badge" style="--c:{route.mode.color}">{route.mode.icon}</span>
      {route.mode.title}
    {/if}
  </div>
  <button
    class="round"
    onclick={toggleMute}
    aria-label={settings.muted ? 'Nyalakan suara' : 'Matikan suara'}
    title={settings.muted ? 'Nyalakan suara' : 'Matikan suara'}
  >
    {settings.muted ? '🔇' : '🔊'}
  </button>
</header>

<main>
  {#key hash}
    <div class="page">
      {#if route.page === 'home'}
        <Home />
      {:else if route.page === 'levels'}
        <LevelSelect mode={route.mode} />
      {:else}
        <Game mode={route.mode} levelIndex={route.levelIndex} />
      {/if}
    </div>
  {/key}
</main>

<style>
  header {
    display: flex;
    align-items: center;
    gap: 12px;
    max-width: 960px;
    margin: 0 auto;
    padding: 14px 16px 0;
  }

  .round {
    display: grid;
    place-items: center;
    width: 52px;
    height: 52px;
    flex: none;
    border-radius: 50%;
    background: var(--card);
    box-shadow: 0 4px 0 var(--line);
    font-size: 1.6rem;
    font-weight: 700;
  }

  .round:active {
    transform: translateY(3px);
    box-shadow: 0 1px 0 var(--line);
  }

  .logo {
    box-shadow: none;
    background: none;
    font-size: 2rem;
  }

  .title {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 10px;
    font-size: 1.5rem;
    font-weight: 600;
    min-width: 0;
  }

  .badge {
    display: inline-grid;
    place-items: center;
    min-width: 40px;
    height: 40px;
    padding: 0 8px;
    border-radius: 14px;
    background: var(--c);
    color: #fff;
    font-size: 1.2rem;
    font-weight: 700;
  }

  main {
    max-width: 960px;
    margin: 0 auto;
    padding: 16px 16px 40px;
  }

  /* hanya opacity — transform di sini akan merusak posisi kartu yang sedang digeser */
  .page {
    animation: fade 0.25s ease-out;
  }

  @media (max-width: 480px) {
    .title {
      font-size: 1.2rem;
    }
  }
</style>
