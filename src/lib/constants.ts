export const LIBRARY_STATUS = {
  WATCHING: 'watching',
  PLANNED: 'planned',
  PAUSED: 'paused',
  COMPLETED: 'completed',
  DROPPED: 'dropped',
} as const

export type LibraryStatus = typeof LIBRARY_STATUS[keyof typeof LIBRARY_STATUS]

export const STATUS_LABELS: Record<LibraryStatus, string> = {
  [LIBRARY_STATUS.WATCHING]: 'Assistindo',
  [LIBRARY_STATUS.PLANNED]: 'Quero assistir',
  [LIBRARY_STATUS.PAUSED]: 'Pausado',
  [LIBRARY_STATUS.COMPLETED]: 'Concluído',
  [LIBRARY_STATUS.DROPPED]: 'Abandonado',
}
