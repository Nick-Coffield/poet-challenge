import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, catchError, map, throwError } from 'rxjs';
import type { Poem, PoetryDbError } from './types';

@Injectable({ providedIn: 'root' })
export class PoetryService {
  private readonly BASE = 'https://poetrydb.org';

  constructor(private http: HttpClient) {}

  private normalize(input?: string, toLower = true): string | undefined {
    if (!input) return undefined;
    const collapsed = input.replace(/\s+/g, ' ').trim();
    return toLower ? collapsed.toLowerCase() : collapsed;
  }

  private buildUrl(author?: string, title?: string, exact = false): string {
    // When exact is ON, do not lowercase; only trim/collapse spaces
    const nAuthor = this.normalize(author, !exact);
    const nTitle  = this.normalize(title,  !exact);

    const safe = (s: string) => encodeURIComponent(s);
    let path = '';

    if (nAuthor && nTitle) {
      const a = exact ? `${safe(nAuthor)}:abs` : safe(nAuthor);
      const t = exact ? `${safe(nTitle)}:abs` : safe(nTitle);
      path = `/author,title/${a};${t}`;
    } else if (nAuthor) {
      const a = exact ? `${safe(nAuthor)}:abs` : safe(nAuthor);
      path = `/author/${a}`;
    } else if (nTitle) {
      const t = exact ? `${safe(nTitle)}:abs` : safe(nTitle);
      path = `/title/${t}`;
    } else {
      path = `/author`; // author listing
    }

    return `${this.BASE}${path}`;
  }

  search(author?: string, title?: string, exact = false): Observable<Poem[]> {
    const url = this.buildUrl(author, title, exact);
    return this.http.get<any>(url).pipe(
      map(res => {
        if (Array.isArray(res)) return res as Poem[];
        if (res && Array.isArray(res.authors)) {
          return res.authors.map((name: string) => ({
            author: name,
            title: '(author listing)',
            lines: []
          } as Poem));
        }
        return [];
      }),
      catchError((err: HttpErrorResponse) => {
        const info: PoetryDbError = {
          status: err.status || 0,
          url: err.url || '',
          message: err.message || 'Request failed',
        };
        return throwError(() => info);
      })
    );
  }

  random(count = 1): Observable<Poem[]> {
    const url = `${this.BASE}/random/${count}/author,title,lines`;
    return this.http.get<Poem[]>(url).pipe(
      catchError((err: HttpErrorResponse) => {
        const info: PoetryDbError = {
          status: err.status || 0,
          url: err.url || '',
          message: err.message || 'Request failed',
        };
        return throwError(() => info);
      })
    );
  }
}
