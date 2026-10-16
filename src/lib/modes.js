export const TOTAL_ROUNDS = 10;

const columnLevels = [
  { emoji: '🐣', name: 'Mudah', count: 2, digits: 1 },
  { emoji: '🐥', name: 'Lumayan', count: 2, digits: 2 },
  { emoji: '🦊', name: 'Sedang', count: 2, digits: 3 },
  { emoji: '🦁', name: 'Sulit', count: 3, digits: 2 },
  { emoji: '🐉', name: 'Jago', count: 3, digits: 3 },
].map((l) => ({ ...l, desc: `${l.count} bilangan, ${l.digits} digit` }));

export const MODES = {
  tambah: {
    id: 'tambah',
    kind: 'column',
    title: 'Penjumlahan',
    icon: '+',
    color: 'var(--coral)',
    tagline: 'Jumlahkan bersusun, simpan 1 ke kiri',
    levels: columnLevels,
  },
  kurang: {
    id: 'kurang',
    kind: 'column',
    title: 'Pengurangan',
    icon: '−',
    color: 'var(--sky)',
    tagline: 'Kurangkan bersusun, pinjam 1 dari kiri',
    levels: columnLevels,
  },
  banding: {
    id: 'banding',
    kind: 'compare',
    title: 'Perbandingan',
    icon: '<>',
    color: 'var(--grape)',
    tagline: 'Mana yang lebih besar?',
    levels: [
      { emoji: '🐣', name: 'Mudah', digits: 1, desc: 'Bilangan 0 sampai 9' },
      { emoji: '🐥', name: 'Lumayan', digits: 2, desc: 'Bilangan 2 digit' },
      { emoji: '🦊', name: 'Sedang', digits: 3, desc: 'Bilangan 3 digit' },
      { emoji: '🦁', name: 'Sulit', digits: 3, close: true, desc: '3 digit, angkanya mirip' },
      { emoji: '🐉', name: 'Jago', digits: 4, close: true, desc: '4 digit, angkanya mirip' },
    ],
  },
  urut: {
    id: 'urut',
    kind: 'sort',
    title: 'Mengurutkan',
    icon: '123',
    color: 'var(--lime)',
    tagline: 'Geser bilangan sampai urut',
    levels: [
      { emoji: '🐣', name: 'Mudah', count: 4, digits: 1, order: 'asc' },
      { emoji: '🐥', name: 'Lumayan', count: 5, digits: 2, order: 'asc' },
      { emoji: '🦊', name: 'Sedang', count: 5, digits: 2, order: 'desc' },
      { emoji: '🦁', name: 'Sulit', count: 6, digits: 3, order: 'asc' },
      { emoji: '🐉', name: 'Jago', count: 6, digits: 3, order: 'desc', close: true },
    ].map((l) => ({
      ...l,
      desc: `${l.count} bilangan ${l.digits} digit${l.close ? ' mirip' : ''}, ${
        l.order === 'asc' ? 'kecil → besar' : 'besar → kecil'
      }`,
    })),
  },
};
