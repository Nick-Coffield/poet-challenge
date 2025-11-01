import { Component, computed, effect, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder } from '@angular/forms';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { HttpClientModule } from '@angular/common/http';
import { PoetryService } from './poetry.service';
import type { Poem, PoetryDbError } from './types';

function escapeRegExp(s: string) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
function escapeHTML(s: string) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, HttpClientModule],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  // Data
  loading = signal(false);
  error = signal<PoetryDbError | null>(null);
  poems = signal<Poem[]>([]);
  selectedIndex = signal<number | null>(null);

  // Word tools
  word = signal<string>('');
  wordPanelOpen = signal<boolean>(true);
  bestMatch = signal<{ index: number; count: number; word: string } | null>(null);

  // Night hint (text only)
  isNight = signal<boolean>(false);

  form: ReturnType<FormBuilder['group']>;

  constructor(private fb: FormBuilder, private api: PoetryService) {
    this.form = this.fb.group({ author: [''], title: [''], exact: [false] });

    const sub = this.form.valueChanges
      .pipe(debounceTime(250), distinctUntilChanged())
      .subscribe(() => { if (this.canSearch) this.onSearch(false); });
    effect(() => sub);

    const hour = new Date().getHours();
    this.isNight.set(hour >= 22 || hour < 6);
  }

  get canSearch() {
    const { author, title } = this.form.value as { author?: string; title?: string };
    return (author?.trim()?.length || 0) > 0 || (title?.trim()?.length || 0) > 0;
  }

  resultSummary = computed(() => {
    const p = this.poems();
    if (!p.length) return 'No results yet.';
    const authors = new Set(p.map(x => x.author).filter(Boolean));
    return `${p.length} poem${p.length === 1 ? '' : 's'} • ${authors.size} author${authors.size === 1 ? '' : 's'}`;
  });

  // API
  onSearch(showSpinner = true) {
    this.error.set(null);
    this.selectedIndex.set(null);
    this.bestMatch.set(null);
    if (showSpinner) this.loading.set(true);

    const { author, title, exact } = this.form.value as { author?: string; title?: string; exact?: boolean };
    this.api.search(author || undefined, title || undefined, !!exact).subscribe({
      next: (res: Poem[]) => { this.poems.set(res); this.loading.set(false); },
      error: (err: PoetryDbError) => { this.loading.set(false); this.poems.set([]); this.error.set(err); }
    });
  }

  onRandom(count = 1) {
    this.error.set(null);
    this.selectedIndex.set(null);
    this.bestMatch.set(null);
    this.loading.set(true);
    this.api.random(count).subscribe({
      next: (res: Poem[]) => { this.poems.set(res); this.loading.set(false); },
      error: (err: PoetryDbError) => { this.loading.set(false); this.poems.set([]); this.error.set(err); }
    });
  }

  // Word tools
  private countWordInText(text: string, word: string): number {
    const w = (word || '').trim();
    if (!w) return 0;
    const rx = new RegExp(`\\b${escapeRegExp(w)}\\b`, 'gi');
    const m = text.match(rx);
    return m ? m.length : 0;
  }

  countInPoem(p: Poem): number {
    const w = (this.word() || '').trim();
    if (!w) return 0;
    const text = (p.lines || []).join('\n');
    return this.countWordInText(text, w);
  }

  highlightedPoem(p: Poem): string {
    const text = (p.lines || []).join('\n');
    const safe = escapeHTML(text);
    const w = (this.word() || '').trim();
    if (!w) return safe;
    const rx = new RegExp(`\\b(${escapeRegExp(w)})\\b`, 'gi');
    return safe.replace(rx, '<mark class="hl">$1</mark>');
  }

  findMostInResults() {
    const w = (this.word() || '').trim();
    if (!w) { this.bestMatch.set(null); return; }

    let max = 0, maxIdx = -1;
    this.poems().forEach((p, i) => {
      const text = (p.lines || []).join('\n');
      const count = this.countWordInText(text, w);
      if (count > max) { max = count; maxIdx = i; }
    });

    if (maxIdx >= 0 && max > 0) {
      this.bestMatch.set({ index: maxIdx, count: max, word: w });
      this.selectedIndex.set(maxIdx);
    } else {
      this.bestMatch.set({ index: -1, count: 0, word: w });
    }
  }

  fetchTopByWord(poolSize = 150, topK = 10) {
    const w = (this.word() || '').trim();
    if (!w) { this.bestMatch.set(null); return; }

    this.error.set(null);
    this.selectedIndex.set(null);
    this.bestMatch.set(null);
    this.loading.set(true);

    this.api.random(poolSize).subscribe({
      next: (res: Poem[]) => {
        const scored = res.map((p) => {
          const text = (p.lines || []).join('\n');
          return { poem: p, count: this.countWordInText(text, w) };
        }).filter(x => x.count > 0);

        scored.sort((a, b) => b.count - a.count);
        const top = scored.slice(0, topK);
        this.poems.set(top.map(x => x.poem));
        this.loading.set(false);

        if (top.length > 0) {
          this.bestMatch.set({ index: 0, count: top[0].count, word: w });
          this.selectedIndex.set(0);
        } else {
          this.bestMatch.set({ index: -1, count: 0, word: w });
        }
      },
      error: (err: PoetryDbError) => {
        this.loading.set(false);
        this.poems.set([]);
        this.error.set(err);
      }
    });
  }

  copyPoem(i: number) {
    const p = this.poems()[i];
    const text = `${p.title} — ${p.author}\n\n${(p.lines || []).join('\n')}`;
    navigator.clipboard?.writeText(text).catch(() => {});
  }

  toggle(i: number) { this.selectedIndex.set(this.selectedIndex() === i ? null : i); }
  trackByIdx = (_: number, __: Poem) => _;
}

export default App;
