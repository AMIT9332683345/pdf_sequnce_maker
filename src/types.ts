export type Mode = 'color' | 'gray' | 'bw'
export type Quality = 'high' | 'balanced' | 'small'
export type PageItem = { id: string; name: string; file: File; source: string; thumb: string; width: number; height: number; mode: Mode; threshold: number }
