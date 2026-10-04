import type { InventoryItem } from '../types'

function stamp(): string {
  const d = new Date()
  const p = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}`
}

async function writeSheet(
  rows: Record<string, string>[],
  sheetName: string,
  filename: string,
) {
  const XLSX = await import('xlsx')
  const ws = XLSX.utils.json_to_sheet(rows)
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, sheetName)
  XLSX.writeFile(wb, filename)
}

export async function exportFullExcel(items: InventoryItem[]) {
  const rows = items.map((item) => ({
    商品名: item.name,
    カテゴリ: item.category,
    '1個口': item.packSize,
    在庫数: item.stock,
    発注数: item.orderQty,
    備考: item.note,
  }))
  await writeSheet(
    rows.length
      ? rows
      : [
          {
            商品名: '',
            カテゴリ: '',
            '1個口': '',
            在庫数: '',
            発注数: '',
            備考: '',
          },
        ],
    '在庫一覧',
    `笠ヶ岳山荘_在庫一覧_${stamp()}.xlsx`,
  )
}

export async function exportOrderExcel(items: InventoryItem[]) {
  const ordered = items.filter((item) => item.orderQty.trim() !== '')
  const rows = ordered.map((item) => ({
    商品名: item.name,
    '1個口': item.packSize,
    発注数: item.orderQty,
  }))
  await writeSheet(
    rows.length
      ? rows
      : [
          {
            商品名: '',
            '1個口': '',
            発注数: '',
          },
        ],
    '発注',
    `笠ヶ岳山荘_発注_${stamp()}.xlsx`,
  )
}
