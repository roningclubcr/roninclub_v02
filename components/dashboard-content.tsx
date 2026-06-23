"use client"

import useSWR from "swr"
import { AlertTriangle, Banknote, CreditCard, Package, Receipt, Shirt, ShoppingCart, Stamp } from "lucide-react"
import { fetchInventory, fetchPayments, fetchSales, fetchExpenses } from "@/lib/business"
import { PageHeader } from "@/components/page-header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

function money(value: number) {
  return new Intl.NumberFormat("es-CR", {
    style: "currency",
    currency: "CRC",
    maximumFractionDigits: 0,
  }).format(value)
}

function inCurrentMonth(date: string | null) {
  if (!date) return false
  const now = new Date()
  const value = new Date(`${date}T00:00:00`)
  return value.getFullYear() === now.getFullYear() && value.getMonth() === now.getMonth()
}

export function DashboardContent() {
  const { data: sales, isLoading: loadingSales, error: salesError } = useSWR("sales", fetchSales)
  const { data: expenses, isLoading: loadingExpenses, error: expensesError } = useSWR("expenses", fetchExpenses)
  const { data: payments, isLoading: loadingPayments, error: paymentsError } = useSWR("payments", fetchPayments)
  const { data: inventory, isLoading: loadingInventory, error: inventoryError } = useSWR("inventory", fetchInventory)
  const loading = loadingSales || loadingExpenses || loadingPayments || loadingInventory
  const error = salesError || expensesError || paymentsError || inventoryError

  const monthSales = (sales ?? []).filter((sale) => inCurrentMonth(sale.order_date))
  const monthExpenses = (expenses ?? []).filter((expense) => inCurrentMonth(expense.expense_date))
  const monthGross = monthSales.reduce((sum, sale) => sum + (sale.sale_price ?? 0), 0)
  const monthExpenseTotal = monthExpenses.reduce((sum, expense) => sum + (expense.amount ?? 0), 0)
  const estimatedCosts = monthSales.reduce(
    (sum, sale) =>
      sum +
      (sale.shirt_cost ?? 0) +
      (sale.dtf_cost ?? 0) +
      (sale.packaging_cost ?? 0) +
      (sale.other_costs ?? 0),
    0,
  )
  const pendingOrders = (sales ?? []).filter((sale) => !["entregado", "cancelado"].includes(sale.production_status ?? "")).length
  const stampPending = (sales ?? []).filter((sale) => ["listo_para_estampar", "falta_dtf"].includes(sale.production_status ?? "")).length
  const delivered = (sales ?? []).filter((sale) => sale.production_status === "entregado").length
  const paidBySale = new Map<string, number>()
  for (const payment of payments ?? []) {
    if (payment.sale_id) paidBySale.set(payment.sale_id, (paidBySale.get(payment.sale_id) ?? 0) + (payment.amount ?? 0))
  }
  const receivable = (sales ?? []).reduce((sum, sale) => {
    return sum + Math.max((sale.sale_price ?? 0) - (paidBySale.get(sale.id) ?? 0), 0)
  }, 0)
  const lowStock = (inventory ?? []).filter((item) => (item.stock_actual ?? 0) <= (item.stock_minimo ?? 0)).length

  const cards = [
    { label: "Ventas del mes", value: money(monthGross), icon: ShoppingCart },
    { label: "Gastos del mes", value: money(monthExpenseTotal), icon: Receipt },
    { label: "Ganancia neta estimada", value: money(monthGross - estimatedCosts - monthExpenseTotal), icon: Banknote },
    { label: "Pedidos pendientes", value: pendingOrders.toString(), icon: Package },
    { label: "Por estampar", value: stampPending.toString(), icon: Stamp },
    { label: "Entregados", value: delivered.toString(), icon: Shirt },
    { label: "Cuentas por cobrar", value: money(receivable), icon: CreditCard },
    { label: "Inventario bajo", value: lowStock.toString(), icon: AlertTriangle },
  ]

  return (
    <>
      <PageHeader title="Dashboard" description="Resumen operativo de Ronin Club." />
      {error && (
        <div role="alert" className="mb-4 rounded-lg border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          Error al cargar métricas: {error.message}
        </div>
      )}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((card) => {
          const Icon = card.icon
          return (
            <Card key={card.label}>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">{card.label}</CardTitle>
                <Icon className="size-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                {loading ? <Skeleton className="h-8 w-24" /> : <p className="text-2xl font-semibold tracking-tight">{card.value}</p>}
              </CardContent>
            </Card>
          )
        })}
      </div>
    </>
  )
}
