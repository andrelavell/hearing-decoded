export type Episode = {
  id: string;
  title: string;
  body: string;
  audioUrl: string;
  captionsVttUrl?: string;
  transcriptJsonUrl?: string;
  rating: number; // 0-5
  views: number;
  createdAt: string; // ISO
  updatedAt: string; // ISO
  duration?: number; // seconds
  // Academic metadata (optional)
  authors?: { name: string; credentials?: string; affiliation?: string }[];
  permalink?: string; // stable URL
  doi?: string; // digital object identifier
  keyPoints?: string[];
  references?: string[];
  license?: string;
};

export type NewEpisodeInput = {
  title: string;
  body: string;
  audioUrl: string;
  rating?: number;
  views?: number;
};
