import { useState, useRef, useMemo, useCallback, useEffect } from 'react'
import { AgGridReact } from 'ag-grid-react'
import type { ColDef, GridReadyEvent } from 'ag-grid-community'
import { ModuleRegistry, AllCommunityModule } from 'ag-grid-community'
import { CellSelectionModule, ClipboardModule, RangeSelectionModule, MenuModule } from 'ag-grid-enterprise'
import 'ag-grid-community/styles/ag-theme-quartz.css'
import './App.css'

// Register AG Grid modules
ModuleRegistry.registerModules([AllCommunityModule, CellSelectionModule, ClipboardModule, RangeSelectionModule, MenuModule])

interface RowData {
  department: string
  [key: string]: string | number // For dynamic month columns
}

function App() {
  const gridRef = useRef<AgGridReact<RowData>>(null)

  // Generate month columns for 2026 and 2027
  const monthColumns = useMemo(() => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
    const cols: string[] = []
    for (const year of [2026, 2027]) {
      for (const month of months) {
        cols.push(`${month} ${year}`)
      }
    }
    return cols
  }, [])

  const [rowData] = useState<RowData[]>(() => {
    const departments = [
      'Engineering',
      'Product',
      'Design',
      'Marketing',
      'Sales',
      'Customer Success',
      'Operations',
      'Finance',
      'HR',
      'Legal'
    ]

    return departments.map(dept => {
      const row: RowData = { department: dept }
      // Initialize with random FTE values between 2 and 20
      monthColumns.forEach(month => {
        row[month] = Math.floor(Math.random() * 18) + 2
      })
      return row
    })
  })

  const columnDefs: ColDef<RowData>[] = useMemo(() => {
    const cols: ColDef<RowData>[] = [
      {
        field: 'department',
        headerName: 'Department',
        editable: false,
        pinned: 'left',
        width: 180,
        cellStyle: { fontWeight: 'bold', backgroundColor: '#f8f9fa' }
      }
    ]

    // Add month columns
    monthColumns.forEach(month => {
      cols.push({
        field: month,
        headerName: month,
        editable: true,
        width: 100,
        valueFormatter: (params) => params.value !== null && params.value !== undefined ? params.value.toString() : '',
        valueParser: (params) => {
          const num = parseFloat(params.newValue)
          return isNaN(num) ? 0 : num
        }
      })
    })

    return cols
  }, [monthColumns])

  const defaultColDef = useMemo<ColDef>(() => ({
    minWidth: 100,
    suppressKeyboardEvent: (params) => {
      // When editing, allow arrow keys to exit edit mode and navigate
      if (params.editing) {
        const key = params.event.key
        const isArrowKey = ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(key)

        if (isArrowKey) {
          // Stop editing and navigate
          params.api.stopEditing()
          return false // Allow AG Grid to handle navigation
        }
      }
      return false
    }
  }), [])

  const onGridReady = useCallback((params: GridReadyEvent) => {
    console.log('✅ Grid ready!', params.api)
    console.log('✅ Row count:', params.api.getDisplayedRowCount())
  }, [])

  const fillDown = useCallback(() => {
    console.log('fillDown called')
    const api = gridRef.current?.api
    if (!api) {
      console.log('No API available')
      return
    }

    const cellRanges = api.getCellRanges()
    console.log('Cell ranges:', cellRanges)
    if (!cellRanges || cellRanges.length === 0) {
      console.log('No cell ranges selected')
      return
    }

    const range = cellRanges[0]
    const startRow = Math.min(range.startRow!.rowIndex, range.endRow!.rowIndex)
    const endRow = Math.max(range.startRow!.rowIndex, range.endRow!.rowIndex)
    const columns = range.columns

    console.log(`Filling down from row ${startRow} to ${endRow}`)

    if (!columns || columns.length === 0) return

    // For each column in the selection
    columns.forEach(column => {
      const colId = column.getColId()

      // Get the value from the first row
      const firstRowNode = api.getDisplayedRowAtIndex(startRow)
      if (!firstRowNode) return

      const sourceValue = firstRowNode.data[colId]
      console.log(`Filling column ${colId} with value:`, sourceValue)

      // Fill down to all rows in the range
      for (let rowIndex = startRow + 1; rowIndex <= endRow; rowIndex++) {
        const rowNode = api.getDisplayedRowAtIndex(rowIndex)
        if (rowNode) {
          rowNode.setDataValue(colId, sourceValue)
        }
      }
    })
  }, [])

  const fillRight = useCallback(() => {
    console.log('fillRight called')
    const api = gridRef.current?.api
    if (!api) {
      console.log('No API available')
      return
    }

    const cellRanges = api.getCellRanges()
    console.log('Cell ranges:', cellRanges)
    if (!cellRanges || cellRanges.length === 0) {
      console.log('No cell ranges selected')
      return
    }

    const range = cellRanges[0]
    const startRow = Math.min(range.startRow!.rowIndex, range.endRow!.rowIndex)
    const endRow = Math.max(range.startRow!.rowIndex, range.endRow!.rowIndex)
    const columns = range.columns

    if (!columns || columns.length < 2) {
      console.log('Need at least 2 columns selected')
      return
    }

    const firstColId = columns[0].getColId()
    console.log(`Filling right from column ${firstColId}`)

    // For each row in the selection
    for (let rowIndex = startRow; rowIndex <= endRow; rowIndex++) {
      const rowNode = api.getDisplayedRowAtIndex(rowIndex)
      if (!rowNode) continue

      // Get the value from the first column
      const sourceValue = rowNode.data[firstColId]
      console.log(`Row ${rowIndex}: filling with value:`, sourceValue)

      // Fill right to all columns in the range
      for (let i = 1; i < columns.length; i++) {
        const colId = columns[i].getColId()
        rowNode.setDataValue(colId, sourceValue)
      }
    }
  }, [])

  const copyWithHeaders = useCallback(() => {
    const api = gridRef.current?.api
    if (!api) return

    const cellRanges = api.getCellRanges()
    if (!cellRanges || cellRanges.length === 0) return

    const range = cellRanges[0]
    const startRow = Math.min(range.startRow!.rowIndex, range.endRow!.rowIndex)
    const endRow = Math.max(range.startRow!.rowIndex, range.endRow!.rowIndex)
    const columns = range.columns

    if (!columns || columns.length === 0) return

    // Build header row
    const headers = columns.map(col => col.getColDef().headerName || col.getColId())

    // Build data rows
    const rows: string[][] = []
    rows.push(headers)

    for (let rowIndex = startRow; rowIndex <= endRow; rowIndex++) {
      const rowNode = api.getDisplayedRowAtIndex(rowIndex)
      if (rowNode) {
        const rowData = columns.map(col => {
          const colId = col.getColId()
          const value = rowNode.data[colId]
          return value !== null && value !== undefined ? String(value) : ''
        })
        rows.push(rowData)
      }
    }

    // Convert to TSV (tab-separated values)
    const tsv = rows.map(row => row.join('\t')).join('\n')

    // Copy to clipboard
    navigator.clipboard.writeText(tsv)
  }, [])

  const getContextMenuItems = useCallback((params: any) => {
    return [
      {
        name: 'Fill Down',
        action: () => {
          console.log('Fill Down clicked')
          fillDown()
        },
        icon: '<span style="font-size: 16px;">↓</span>'
      },
      {
        name: 'Fill Right',
        action: () => {
          console.log('Fill Right clicked')
          fillRight()
        },
        icon: '<span style="font-size: 16px;">→</span>'
      },
      'separator',
      'copy',
      {
        name: 'Copy with Headers',
        action: () => {
          console.log('Copy with Headers clicked')
          copyWithHeaders()
        },
        icon: '<span style="font-size: 16px;">📋</span>'
      },
      'paste',
      'separator',
      'export'
    ]
  }, [fillDown, fillRight, copyWithHeaders])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Check if Ctrl (or Cmd on Mac) + Shift is pressed
      if (!(e.ctrlKey || e.metaKey) || !e.shiftKey) return

      if (e.key === 'ArrowDown') {
        e.preventDefault()
        fillDown()
      } else if (e.key === 'ArrowRight') {
        e.preventDefault()
        fillRight()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [fillDown, fillRight])

  console.log('🔍 App rendering, rowData length:', rowData.length)

  return (
    <div style={{ width: '100%', height: '100vh', display: 'flex', flexDirection: 'column', background: '#ffffff' }}>
      <div style={{ padding: '20px', borderBottom: '1px solid #ccc', background: '#f8f9fa' }}>
        <h1 style={{ margin: '0 0 16px 0', fontSize: '24px' }}>FTE Planner 2026-2027 - Excel-like Interactions</h1>
        <div style={{ fontSize: '14px', color: '#666' }}>
          <p style={{ margin: '4px 0' }}><strong>Excel-like Features:</strong></p>
          <ul style={{ margin: '8px 0', paddingLeft: '20px' }}>
            <li><strong>Undo/Redo:</strong> Ctrl+Z / Ctrl+Y (Cmd+Z / Cmd+Shift+Z on Mac)</li>
            <li><strong>Fill Down:</strong> Ctrl+Shift+↓ or right-click menu</li>
            <li><strong>Fill Right:</strong> Ctrl+Shift+→ or right-click menu</li>
            <li><strong>Context Menu:</strong> Right-click for fill, copy, copy with headers, paste, export</li>
            <li><strong>Cell editing:</strong> Double-click, Enter, or F2 to edit</li>
            <li><strong>Arrow key navigation while editing:</strong> Exit edit mode and move to adjacent cell</li>
            <li><strong>Range selection:</strong> Click and drag to select multiple cells</li>
            <li><strong>Fill handle:</strong> Drag from bottom-right corner of selection to fill</li>
            <li><strong>Clipboard:</strong> Ctrl+C / Ctrl+V for copy/paste</li>
            <li><strong>Navigation:</strong> Arrow keys, Tab, Enter to move between cells</li>
          </ul>
        </div>
      </div>

      <div style={{ flex: 1, position: 'relative', background: '#e0e0e0', padding: '10px' }}>
        <div style={{
          position: 'absolute',
          top: '10px',
          left: '10px',
          right: '10px',
          bottom: '10px',
          background: 'white'
        }}>
          <div className="ag-theme-quartz" style={{ width: '100%', height: '100%' }}>
            <AgGridReact<RowData>
              ref={gridRef}
              rowData={rowData}
              columnDefs={columnDefs}
              defaultColDef={defaultColDef}
              onGridReady={onGridReady}
              undoRedoCellEditing={true}
              undoRedoCellEditingLimit={20}
              cellSelection={{
                handle: {
                  mode: 'fill',
                },
              }}
              enableCellTextSelection={false}
              ensureDomOrder={true}
              getContextMenuItems={getContextMenuItems}
            />
          </div>
        </div>
      </div>
    </div>
  )
}

export default App
