export interface Poem {
  title: string;
  author: string;
  lines: string[];
  linecount?: string | number;
}

export interface PoetryDbError {
  status: number;
  url: string;
  message: string;
}
