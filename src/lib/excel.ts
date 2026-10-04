import type { InventoryItem } from '../types'

function stamp(): string {
  const d = new Date()
  const p = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}`
}

function todayLabel(): string {
  const d = new Date()
  return `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日`
}

async function downloadWorkbook(
  workbook: import('exceljs').Workbook,
  filename: string,
) {
  const buffer = await workbook.xlsx.writeBuffer()
  const blob = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

function styleHeaderRow(row: import('exceljs').Row, fills: string) {
  row.height = 28
  row.eachCell((cell) => {
    cell.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 12, name: 'Yu Gothic' }
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: fills },
    }
    cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true }
    cell.border = {
      top: { style: 'thin', color: { argb: 'FF163628' } },
      left: { style: 'thin', color: { argb: 'FF163628' } },
      bottom: { style: 'thin', color: { argb: 'FF163628' } },
      right: { style: 'thin', color: { argb: 'FF163628' } },
    }
  })
}

function styleDataCell(cell: import('exceljs').Cell, zebra: boolean) {
  cell.font = { name: 'Yu Gothic', size: 11 }
  cell.alignment = { vertical: 'middle', wrapText: true }
  cell.border = {
    top: { style: 'thin', color: { argb: 'FFC3D0C5' } },
    left: { style: 'thin', color: { argb: 'FFC3D0C5' } },
    bottom: { style: 'thin', color: { argb: 'FFC3D0C5' } },
    right: { style: 'thin', color: { argb: 'FFC3D0C5' } },
  }
  if (zebra) {
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFF3F7F3' },
    }
  }
}

export async function exportFullExcel(items: InventoryItem[]) {
  const ExcelJS = await import('exceljs')
  const wb = new ExcelJS.Workbook()
  wb.creator = '笠ヶ岳山荘 在庫管理'
  wb.created = new Date()

  const ws = wb.addWorksheet('在庫一覧', {
    views: [{ state: 'frozen', ySplit: 3, xSplit: 0 }],
    properties: { defaultRowHeight: 22 },
  })

  ws.mergeCells('A1:E1')
  const title = ws.getCell('A1')
  title.value = `笠ヶ岳山荘 在庫一覧（${todayLabel()}）`
  title.font = { bold: true, size: 16, name: 'Yu Gothic', color: { argb: 'FF1F4D3A' } }
  title.alignment = { vertical: 'middle', horizontal: 'left' }
  ws.getRow(1).height = 32

  ws.mergeCells('A2:E2')
  const sub = ws.getCell('A2')
  sub.value = `全${items.length}件 ／ カテゴリごとに見やすく並べています`
  sub.font = { size: 10, name: 'Yu Gothic', color: { argb: 'FF5D6F64' } }

  const headers = ['商品名', 'カテゴリ', '1個口', '在庫数', '備考']
  const headerRow = ws.addRow(headers)
  styleHeaderRow(headerRow, 'FF1F4D3A')

  ws.columns = [
    { key: 'name', width: 28 },
    { key: 'category', width: 20 },
    { key: 'pack', width: 12 },
    { key: 'stock', width: 10 },
    { key: 'note', width: 28 },
  ]

  const sorted = [...items].sort((a, b) => {
    const cat = a.category.localeCompare(b.category, 'ja')
    if (cat !== 0) return cat
    return a.name.localeCompare(b.name, 'ja')
  })

  let lastCategory = ''
  let zebra = false
  for (const item of sorted) {
    const category = item.category.trim() || 'その他'
    if (category !== lastCategory) {
      lastCategory = category
      const catRow = ws.addRow([`■ ${category}`, '', '', '', ''])
      ws.mergeCells(`A${catRow.number}:E${catRow.number}`)
      catRow.height = 24
      const cell = catRow.getCell(1)
      cell.font = { bold: true, size: 11, name: 'Yu Gothic', color: { argb: 'FF1F4D3A' } }
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFD5E0D6' },
      }
      cell.alignment = { vertical: 'middle' }
      zebra = false
    }

    const row = ws.addRow([
      item.name,
      category,
      item.packSize,
      item.stock,
      item.note,
    ])
    row.height = 24
    row.eachCell((cell, col) => {
      styleDataCell(cell, zebra)
      if (col === 4) {
        cell.alignment = { vertical: 'middle', horizontal: 'center' }
      }
    })
    zebra = !zebra
  }

  if (sorted.length === 0) {
    const empty = ws.addRow(['（まだ商品がありません）', '', '', '', ''])
    ws.mergeCells(`A${empty.number}:E${empty.number}`)
  }

  ws.autoFilter = {
    from: { row: 3, column: 1 },
    to: { row: Math.max(3, ws.rowCount), column: 5 },
  }

  await downloadWorkbook(wb, `笠ヶ岳山荘_在庫一覧_${stamp()}.xlsx`)
}

export async function exportOrderExcel(items: InventoryItem[]) {
  const ExcelJS = await import('exceljs')
  const wb = new ExcelJS.Workbook()
  wb.creator = '笠ヶ岳山荘 在庫管理'
  wb.created = new Date()

  const ws = wb.addWorksheet('発注', {
    views: [{ state: 'frozen', ySplit: 3 }],
    properties: { defaultRowHeight: 26 },
  })

  ws.mergeCells('A1:F1')
  const title = ws.getCell('A1')
  title.value = `笠ヶ岳山荘 発注リスト（${todayLabel()}）`
  title.font = { bold: true, size: 16, name: 'Yu Gothic', color: { argb: 'FF1F4D3A' } }
  ws.getRow(1).height = 32

  ws.mergeCells('A2:F2')
  ws.getCell('A2').value =
    '黄色の「発注数」欄に、このエクセル上で追加入力してください（商品名・1個口・在庫は参考）'
  ws.getCell('A2').font = { size: 10, name: 'Yu Gothic', color: { argb: 'FF8A5A1B' } }

  const headerRow = ws.addRow(['No.', 'カテゴリ', '商品名', '1個口', '在庫数', '発注数'])
  styleHeaderRow(headerRow, 'FF3F7A58')
  // highlight 発注数 header
  const orderHeader = headerRow.getCell(6)
  orderHeader.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFC45C26' },
  }

  ws.columns = [
    { width: 6 },
    { width: 18 },
    { width: 30 },
    { width: 12 },
    { width: 10 },
    { width: 12 },
  ]

  const sorted = [...items].sort((a, b) => {
    const cat = a.category.localeCompare(b.category, 'ja')
    if (cat !== 0) return cat
    return a.name.localeCompare(b.name, 'ja')
  })

  let lastCategory = ''
  let no = 0
  for (const item of sorted) {
    const category = item.category.trim() || 'その他'
    if (category !== lastCategory) {
      lastCategory = category
      const catRow = ws.addRow([`■ ${category}`, '', '', '', '', ''])
      ws.mergeCells(`A${catRow.number}:F${catRow.number}`)
      catRow.height = 24
      const cell = catRow.getCell(1)
      cell.font = { bold: true, size: 11, name: 'Yu Gothic', color: { argb: 'FF1F4D3A' } }
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFD5E0D6' },
      }
    }

    no += 1
    const row = ws.addRow([
      no,
      category,
      item.name,
      item.packSize,
      item.stock,
      '', // 発注数はエクセルで追加入力
    ])
    row.height = 28
    row.eachCell((cell, col) => {
      styleDataCell(cell, no % 2 === 0)
      if (col === 1 || col === 5 || col === 6) {
        cell.alignment = { vertical: 'middle', horizontal: 'center' }
      }
      if (col === 6) {
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFFFF3C4' },
        }
        cell.border = {
          top: { style: 'medium', color: { argb: 'FFC45C26' } },
          left: { style: 'medium', color: { argb: 'FFC45C26' } },
          bottom: { style: 'medium', color: { argb: 'FFC45C26' } },
          right: { style: 'medium', color: { argb: 'FFC45C26' } },
        }
        cell.font = { bold: true, name: 'Yu Gothic', size: 12 }
      }
    })
  }

  if (sorted.length === 0) {
    const empty = ws.addRow(['', '', '（まだ商品がありません）', '', '', ''])
    ws.mergeCells(`C${empty.number}:F${empty.number}`)
  }

  // 入力しやすいよう発注数列を選択しやすい位置に
  ws.views = [{ state: 'frozen', ySplit: 3, activeCell: 'F4' }]

  await downloadWorkbook(wb, `笠ヶ岳山荘_発注_${stamp()}.xlsx`)
}
