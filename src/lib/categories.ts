export const DEFAULT_CATEGORIES = [
  '高山米穀（食品）',
  '台所用品',
  '発電室・トイレ・お風呂',
  '売店',
  '文房具',
  '飲み物・薬',
  'その他',
] as const

const KEYWORD_RULES: { category: string; keywords: string[] }[] = [
  {
    category: '飲み物・薬',
    keywords: [
      'お茶',
      '紅茶',
      'コーヒー',
      'ジュース',
      '水',
      'サイダー',
      'ビール',
      '酒',
      '薬',
      '絆創膏',
      '湿布',
      'ドリンク',
      'お茶パック',
    ],
  },
  {
    category: '文房具',
    keywords: [
      'ペン',
      'ボールペン',
      'マジック',
      'ノート',
      '用紙',
      '封筒',
      'ホッチキス',
      'テープ',
      'のり',
      'はさみ',
      'ファイル',
      '文房具',
      '印鑑',
    ],
  },
  {
    category: '売店',
    keywords: [
      '売店',
      'お菓子',
      'チョコ',
      '飴',
      'ガム',
      'カップ麺',
      'インスタント',
      '土産',
      'ポストカード',
      '切手',
    ],
  },
  {
    category: '発電室・トイレ・お風呂',
    keywords: [
      'トイレ',
      'お風呂',
      '発電',
      '洗剤',
      '石鹸',
      'シャンプー',
      'トイレットペーパー',
      'ティッシュ',
      'ゴミ袋',
      '塩素',
      '燃料',
      '灯油',
      'ガス',
      '電池',
      '掃除',
    ],
  },
  {
    category: '台所用品',
    keywords: [
      'ラップ',
      'ホイル',
      'ジップロック',
      'スポンジ',
      '洗剤',
      'ゴミ袋',
      '手袋',
      'ラップ',
      'キッチン',
      'まな板',
      '包丁',
      'フライパン',
      '鍋',
      'ラップ',
      'サラン',
      'クッキングシート',
      '割り箸',
      'コップ',
      '皿',
      'ボウル',
    ],
  },
  {
    category: '高山米穀（食品）',
    keywords: [
      '米',
      '味噌',
      '醤油',
      '塩',
      '砂糖',
      '油',
      'マヨネーズ',
      'ケチャップ',
      'ドレッシング',
      'カレー',
      'だし',
      '麺',
      'うどん',
      'そば',
      'パスタ',
      '缶詰',
      '野菜',
      '肉',
      '魚',
      '卵',
      '豆腐',
      '牛乳',
      'バター',
      'チーズ',
      '粉',
      'ソース',
      '酢',
      '昆布',
      'わかめ',
      '大根',
      '漬け',
      '麩',
      'パン',
      'ご飯',
      '調味',
    ],
  },
]

const MEMORY_KEY = 'kasagatake-category-memory'

function loadMemory(): Record<string, string> {
  try {
    const raw = localStorage.getItem(MEMORY_KEY)
    if (!raw) return {}
    const parsed = JSON.parse(raw) as Record<string, string>
    return parsed && typeof parsed === 'object' ? parsed : {}
  } catch {
    return {}
  }
}

function saveMemory(memory: Record<string, string>) {
  localStorage.setItem(MEMORY_KEY, JSON.stringify(memory))
}

export function normalizeName(name: string): string {
  return name.trim().replace(/\s+/g, '').toLowerCase()
}

export function rememberCategory(name: string, category: string) {
  const key = normalizeName(name)
  if (!key || !category.trim()) return
  const memory = loadMemory()
  memory[key] = category.trim()
  saveMemory(memory)
}

export function suggestCategory(
  name: string,
  learned?: Record<string, string>,
): string {
  const key = normalizeName(name)
  if (!key) return ''

  const memory = { ...loadMemory(), ...(learned ?? {}) }
  if (memory[key]) return memory[key]

  for (const rule of KEYWORD_RULES) {
    if (rule.keywords.some((kw) => name.includes(kw))) {
      return rule.category
    }
  }

  return 'その他'
}

export function collectCategories(items: { category: string }[]): string[] {
  const set = new Set<string>(DEFAULT_CATEGORIES)
  for (const item of items) {
    const c = item.category.trim()
    if (c) set.add(c)
  }
  return [...set]
}
