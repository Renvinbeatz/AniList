export type Person = { username: string; display_name: string | null; avatar_preset: string | null; is_owner: boolean; is_following: boolean }
export type PeoplePage = { items: Person[]; total: number; page: number }
export function peopleQuery(value: unknown): string | null {
  if (typeof value !== 'string') return null
  const text = value.trim()
  return [...text].length <= 30 && !/[\u0000-\u001f\u007f]/.test(text) ? text : null
}
export function socialPage(value: unknown) {
  if (value === undefined) return 1
  if (typeof value !== 'string' || !/^[1-9]\d{0,3}$/.test(value)) return null
  const page = Number(value)
  return page <= 1000 ? page : null
}
