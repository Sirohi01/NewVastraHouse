"use client";

export type DataTableColumn<T> = {
  align?: "left" | "right" | "center";
  header: string;
  render: (row: T) => React.ReactNode;
};

export function DataTable<T>({
  columns,
  emptyMessage = "No records found.",
  getRowKey,
  rows,
}: Readonly<{
  columns: readonly DataTableColumn<T>[];
  emptyMessage?: string;
  getRowKey: (row: T) => string;
  rows: readonly T[];
}>) {
  if (!rows.length) {
    return (
      <div className="rounded-md border border-border bg-card p-4 text-center text-sm text-muted-foreground">
        {emptyMessage}
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-md border border-border bg-card">
      <div className="overflow-x-auto">
        <table className="w-full min-w-max border-collapse text-sm">
          <thead className="bg-muted text-left">
            <tr>
              {columns.map((column) => (
                <th
                  className={`whitespace-nowrap px-3 py-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground ${
                    column.align === "right"
                      ? "text-right"
                      : column.align === "center"
                        ? "text-center"
                        : ""
                  }`}
                  key={column.header}
                >
                  {column.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr className="border-t border-border" key={getRowKey(row)}>
                {columns.map((column) => (
                  <td
                    className={`px-3 py-2 ${
                      column.align === "right"
                        ? "text-right"
                        : column.align === "center"
                          ? "text-center"
                          : ""
                    }`}
                    key={column.header}
                  >
                    {column.render(row)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
