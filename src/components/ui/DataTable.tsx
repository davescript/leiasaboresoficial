import { ReactNode } from 'react'

export type Column<T> = {
  header: string
  accessor: (row: T) => ReactNode
}

export function DataTable<T>({ rows, columns }: { rows: T[]; columns: Column<T>[] }) {
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full text-sm">
        <thead>
          <tr className="text-left">
            {columns.map((c, i) => (
              <th key={i} className="p-3 font-medium text-zinc-700">{c.header}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i} className="border-t">
              {columns.map((c, j) => (
                <td key={j} className="p-3">{c.accessor(r)}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}