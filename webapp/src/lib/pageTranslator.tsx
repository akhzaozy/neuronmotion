'use client';
import { useEffect, useRef } from 'react';

/**
 * ============================================================
 * NEURONMOTION, Penerjemah Halaman Penuh
 * ============================================================
 * Menerjemahkan seluruh teks yang tampil di halaman ketika pengguna memilih
 * bahasa Inggris, dengan membaca langsung isi DOM dan menggantinya lewat DeepL
 * di server.
 *
 * Pendekatan ini dipilih menggantikan penerjemahan label satu per satu. Dengan
 * kamus manual, setiap teks baru yang ditambahkan ke halaman harus diingat
 * untuk didaftarkan, dan yang terlewat akan tetap muncul dalam bahasa
 * Indonesia. Membaca DOM membuat cakupannya menyeluruh dengan sendirinya:
 * apa pun yang terlihat pengguna pasti ikut diterjemahkan.
 *
 * Kuota DeepL dijaga tiga lapis:
 *   1. cache di peramban, sehingga pindah halaman tidak memanggil apa pun,
 *   2. cache di memori server,
 *   3. cache berkas di server, sehingga satu kalimat hanya pernah dikirim ke
 *      DeepL satu kali untuk seluruh pengguna, bahkan setelah server restart.
 * ============================================================
 */

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

/** Elemen yang isinya bukan bahasa manusia atau tidak boleh diubah. */
const SKIP_TAGS = new Set([
  'SCRIPT', 'STYLE', 'NOSCRIPT', 'CODE', 'PRE', 'TEXTAREA', 'IFRAME', 'CANVAS',
]);

/** Atribut yang teksnya ikut terbaca pengguna. */
const TRANSLATABLE_ATTRS = ['placeholder', 'title', 'aria-label'];

const MAX_TEXTS_PER_REQUEST = 100;
const MAX_CHARS_PER_REQUEST = 3_500;

/** Terjemahan yang sudah diketahui peramban ini, agar pindah halaman terasa instan. */
const memoryCache = new Map<string, string>();

/** Catatan teks asli tiap simpul, dipakai untuk memulihkan saat kembali ke bahasa Indonesia. */
type Applied = { source: string; output: string };
const appliedText = new WeakMap<Text, Applied>();
const appliedAttr = new WeakMap<Element, Record<string, Applied>>();

/** Simpul yang sedang menunggu jawaban, supaya tidak dikirim dua kali. */
const inFlight = new Set<string>();

function loadPersistedCache() {
  try {
    const raw = sessionStorage.getItem('translationCache');
    if (!raw) return;
    for (const [k, v] of Object.entries(JSON.parse(raw) as Record<string, string>)) {
      memoryCache.set(k, v);
    }
  } catch {}
}

let persistTimer: ReturnType<typeof setTimeout> | null = null;
function persistCache() {
  if (persistTimer) return;
  persistTimer = setTimeout(() => {
    persistTimer = null;
    try {
      sessionStorage.setItem('translationCache', JSON.stringify(Object.fromEntries(memoryCache)));
    } catch {}
  }, 1_000);
}

/**
 * Teks yang tidak mengandung huruf sama sekali (angka, tanda baca, ikon) tidak
 * perlu diterjemahkan dan hanya akan memboroskan kuota.
 */
function isTranslatable(text: string) {
  const trimmed = text.trim();
  if (trimmed.length < 2) return false;
  return /\p{L}{2,}/u.test(trimmed);
}

function shouldSkipElement(el: Element | null): boolean {
  let node: Element | null = el;
  while (node) {
    if (SKIP_TAGS.has(node.tagName)) return true;
    if (node.hasAttribute('data-no-translate')) return true;
    node = node.parentElement;
  }
  return false;
}

interface Job {
  text: string;
  apply: (translated: string) => void;
}

/** Mengumpulkan seluruh teks dan atribut yang masih perlu diterjemahkan. */
function collectJobs(root: Node): Job[] {
  const jobs: Job[] = [];

  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT | NodeFilter.SHOW_ELEMENT);
  let node: Node | null = walker.currentNode;

  while (node) {
    if (node.nodeType === Node.TEXT_NODE) {
      const textNode = node as Text;
      const raw = textNode.data;
      const prev = appliedText.get(textNode);
      // Bila isinya masih sama dengan hasil terjemahan sebelumnya, simpul ini
      // sudah selesai. Bila berbeda, React baru saja menuliskan ulang isinya
      // dan teks itu perlu diterjemahkan lagi.
      if (isTranslatable(raw) && (!prev || prev.output !== raw) && !shouldSkipElement(textNode.parentElement)) {
        const source = prev && prev.source === raw ? prev.source : raw;
        jobs.push({
          text: source,
          apply: out => {
            textNode.data = out;
            appliedText.set(textNode, { source, output: out });
          },
        });
      }
    } else if (node.nodeType === Node.ELEMENT_NODE) {
      const el = node as Element;
      if (!shouldSkipElement(el)) {
        for (const attr of TRANSLATABLE_ATTRS) {
          const raw = el.getAttribute(attr);
          if (!raw || !isTranslatable(raw)) continue;
          const record = appliedAttr.get(el) || {};
          const prev = record[attr];
          if (prev && prev.output === raw) continue;
          const source = raw;
          jobs.push({
            text: source,
            apply: out => {
              el.setAttribute(attr, out);
              const next = appliedAttr.get(el) || {};
              next[attr] = { source, output: out };
              appliedAttr.set(el, next);
            },
          });
        }
      }
    }
    node = walker.nextNode();
  }

  return jobs;
}

/** Mengembalikan seluruh teks yang pernah diterjemahkan ke bahasa aslinya. */
function restoreAll(root: Node) {
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT | NodeFilter.SHOW_ELEMENT);
  let node: Node | null = walker.currentNode;

  while (node) {
    if (node.nodeType === Node.TEXT_NODE) {
      const textNode = node as Text;
      const prev = appliedText.get(textNode);
      if (prev && textNode.data === prev.output) {
        textNode.data = prev.source;
        appliedText.delete(textNode);
      }
    } else if (node.nodeType === Node.ELEMENT_NODE) {
      const el = node as Element;
      const record = appliedAttr.get(el);
      if (record) {
        for (const [attr, prev] of Object.entries(record)) {
          if (el.getAttribute(attr) === prev.output) el.setAttribute(attr, prev.source);
        }
        appliedAttr.delete(el);
      }
    }
    node = walker.nextNode();
  }
}

async function fetchTranslations(texts: string[]): Promise<string[]> {
  const res = await fetch(`${API_BASE}/api/translate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ texts, target: 'EN' }),
  });
  if (!res.ok) throw new Error(`translate HTTP ${res.status}`);
  const data = await res.json();
  if (!Array.isArray(data.translations)) throw new Error('respons tidak valid');
  return data.translations;
}

/** Judul tab ikut diterjemahkan karena berada di luar <body>. */
let titleApplied: Applied | null = null;

function collectTitleJob(): Job | null {
  const raw = document.title;
  if (!isTranslatable(raw)) return null;
  if (titleApplied && titleApplied.output === raw) return null;
  const source = raw;
  return {
    text: source,
    apply: out => {
      document.title = out;
      titleApplied = { source, output: out };
    },
  };
}

/**
 * Menjalankan satu putaran penerjemahan. Teks yang sudah ada di cache langsung
 * dipasang tanpa jaringan; sisanya dikirim berkelompok agar satu halaman panjang
 * tidak menjadi puluhan permintaan terpisah.
 */
async function translatePage(root: Node) {
  const jobs = collectJobs(root);
  const titleJob = collectTitleJob();
  if (titleJob) jobs.push(titleJob);
  if (jobs.length === 0) return;

  const pending: Job[] = [];
  for (const job of jobs) {
    const cached = memoryCache.get(job.text);
    if (cached !== undefined) job.apply(cached);
    else if (!inFlight.has(job.text)) pending.push(job);
  }
  if (pending.length === 0) return;

  // Teks yang sama bisa muncul di banyak tempat; cukup dikirim sekali.
  const unique = new Map<string, Job[]>();
  for (const job of pending) {
    const list = unique.get(job.text);
    if (list) list.push(job);
    else unique.set(job.text, [job]);
  }

  const uniqueTexts = [...unique.keys()];
  uniqueTexts.forEach(t => inFlight.add(t));

  const batches: string[][] = [];
  let current: string[] = [];
  let currentChars = 0;
  for (const text of uniqueTexts) {
    if (current.length >= MAX_TEXTS_PER_REQUEST || (current.length > 0 && currentChars + text.length > MAX_CHARS_PER_REQUEST)) {
      batches.push(current);
      current = [];
      currentChars = 0;
    }
    current.push(text);
    currentChars += text.length;
  }
  if (current.length > 0) batches.push(current);

  try {
    for (const batch of batches) {
      try {
        const translations = await fetchTranslations(batch);
        batch.forEach((text, i) => {
          const out = translations[i];
          if (typeof out !== 'string') return;
          memoryCache.set(text, out);
          for (const job of unique.get(text) || []) job.apply(out);
        });
      } catch (e) {
        // Kegagalan satu kelompok tidak menghentikan sisanya; teks yang gagal
        // tetap tampil dalam bahasa aslinya, bukan menjadi kosong.
        console.warn('Penerjemahan gagal untuk satu kelompok teks:', e);
      }
    }
    persistCache();
  } finally {
    uniqueTexts.forEach(t => inFlight.delete(t));
  }
}

/**
 * Dipasang sekali di dalam I18nProvider. Tidak menampilkan apa pun, hanya
 * mengawasi perubahan halaman dan menerjemahkan isinya bila perlu.
 */
export default function PageTranslator({ lang }: { lang: 'id' | 'en' }) {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    loadPersistedCache();
  }, []);

  useEffect(() => {
    const root = document.body;

    if (lang === 'id') {
      restoreAll(root);
      if (titleApplied && document.title === titleApplied.output) {
        document.title = titleApplied.source;
        titleApplied = null;
      }
      return;
    }

    // Penundaan singkat menggabungkan banyak perubahan React menjadi satu
    // putaran, sehingga render bertahap tidak menghasilkan banyak permintaan.
    const schedule = () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => {
        timerRef.current = null;
        translatePage(root);
      }, 150);
    };

    schedule();

    const observer = new MutationObserver(schedule);
    observer.observe(root, {
      childList: true,
      subtree: true,
      characterData: true,
      attributeFilter: TRANSLATABLE_ATTRS,
    });

    // Judul tab ditulis ulang oleh Next setiap kali metadata halaman dipasang,
    // sehingga <head> perlu diawasi terpisah agar terjemahannya dipasang lagi.
    const headObserver = new MutationObserver(schedule);
    headObserver.observe(document.head, { childList: true, subtree: true, characterData: true });

    return () => {
      observer.disconnect();
      headObserver.disconnect();
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [lang]);

  return null;
}
