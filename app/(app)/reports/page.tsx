"use client"

import { useMemo, useState } from "react"
import useSWR from "swr"
import { BarChart3 } from "lucide-react"
import { fetchCharacters, fetchColors, fetchDesigns, fetchSizes } from "@/lib/catalogs"
import { fetchExpenses, fetchPayments, fetchSales } from "@/lib/business"
import { PageHeader } from "@/components/page-header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"

type Period = "weekly" | "monthly" | "quarterly" | "yearly" | "custom"

function money(value: number) {
  return new Intl.NumberFormat("es-CR", {
    style: "currency",
    currency: "CRC",
    maximumFractionDigits: 0,
  }).format(value)
}

function iso(date: Date) {
  return date.toISOString().slice(0, 10)
}

function periodRange(period: Period) {
  const now = new Date()
  const start = new Date(now)
  if (period === "weekly") start.setDate(now.getDate() - 7)
  if (period === "monthly") start.setMonth(now.getMonth() - 1)
  if (period === "quarterly") start.setMonth(now.getMonth() - 3)
  if (period === "yearly") start.setFullYear(now.getFullYear() - 1)
  return { from: iso(start), to: iso(now) }
}

function topName(ids: Array<string | null>, names: Map<string, string>) {
  const counts = new Map<string, number>()
  for (const id of ids) {
    if (!id) continue
    counts.set(id, (counts.get(id) ?? 0) + 1)
  }
  let bestId = ""
  let bestCount = 0
  for (const [id, count] of counts.entries()) {
    if (count > bestCount) {
      bestId = id
      bestCount = count
    }
  }
  return bestId ? `${names.get(bestId) ?? "Sin nombre"} (${bestCount})` : "—"
}

function topValue(values: Array<string | null>) {
  const counts = new Map<string, number>()
  for (const value of values) {
    if (!value) continue
    counts.set(value, (counts.get(value) ?? 0) + 1)
  }
  let best = ""
  let bestCount = 0
  for (const [value, count] of counts.entries()) {
    if (count > bestCount) {
      best = value
      bestCount = count
    }
  }
  return best ? `${best} (${bestCount})` : "—"
}

export default function ReportsPage() {
  const [period, setPeriod] = useState<Period>("monthly")
  const defaultRange = periodRange(period)
  const [customFrom, setCustomFrom] = useState(defaultRange.from)
  const [customTo, setCustomTo] = useState(defaultRange.to)
  const { data: sales, isLoading: loadingSales, error: salesError } = useSWR("sales", fetchSales)
  const { data: expenses, isLoading: loadingExpenses, error: expensesError } = useSWR("expenses", fetchExpenses)
  const { data: payments, isLoading: loadingPayments, error: paymentsError } = useSWR("payments", fetchPayments)
  const { data: characters } = useSWR("characters", fetchCharacters)
  const { data: designs } = useSWR("designs", fetchDesigns)
  const { data: colors } = useSWR("colors", fetchColors)
  const { data: sizes } = useSWR("sizes", fetchSizes)
  const loading = loadingSales || loadingExpenses || loadingPayments
  const error = salesError || expensesError || paymentsError
  const range = period === "custom" ? { from: customFrom, to: customTo } : defaultRange

  const characterNames = useMemo(() => new Map((characters ?? []).map((item) => [item.id, item.name])), [characters])
  const designNames = useMemo(() => new Map((designs ?? []).map((item) => [item.id, item.name])), [designs])
  const colorNames = useMemo(() => new Map((colors ?? []).map((item) => [item.id, item.name])), [colors])
  const sizeNames = useMemo(() => new Map((sizes ?? []).map((item) => [item.id, item.name])), [sizes])

  const filteredSales = (sales ?? []).filter((sale) => {
    const date = sale.order_date ?? ""
    return (!range.from || date >= range.from) && (!range.to || date <= range.to)
  })
  const filteredExpenses = (expenses ?? []).filter((expense) => {
    const date = expense.expense_date ?? ""
    return (!range.from || date >= range.from) && (!range.to || date <= range.to)
  })
  const gross = filteredSales.reduce((sum, sale) => sum + (sale.sale_price ?? 0), 0)
  const expenseTotal = filteredExpenses.reduce((sum, expense) => sum + (expense.amount ?? 0), 0)
  const costs = filteredSales.reduce((sum, sale) => sum + (sale.shirt_cost ?? 0) + (sale.dtf_cost ?? 0) + (sale.packaging_cost ?? 0) + (sale.other_costs ?? 0), 0)
  const shirts = filteredSales.reduce((sum, sale) => sum + (sale.quantity ?? 0), 0)
  const paidBySale = new Map<string, number>()
  for (const payment of payments ?? []) {
    if (payment.sale_id) paidBySale.set(payment.sale_id, (paidBySale.get(payment.sale_id) ?? 0) + (payment.amount ?? 0))
  }
  const pendingPayment = filteredSales.filter((sale) => Math.max((sale.sale_price ?? 0) - (paidBySale.get(sale.id) ?? 0), 0) > 0).length
  const pendingDelivery = filteredSales.filter((sale) => !["entregado", "cancelado"].includes(sale.production_status ?? "")).length

  const cards = [
    ["Ventas brutas", money(gross)],
    ["Gastos", money(expenseTotal)],
    ["Utilidad estimada", money(gross - costs - expenseTotal)],
    ["Camisas vendidas", shirts.toString()],
    ["Personaje más vendido", topName(filteredSales.map((sale) => sale.character_id), characterNames)],
    ["Diseño más vendido", topName(filteredSales.map((sale) => sale.design_id), designNames)],
    ["Color más vendido", topName(filteredSales.map((sale) => sale.color_id), colorNames)],
    ["Talla más vendida", topName(filteredSales.map((sale) => sale.size_id), sizeNames)],
    ["Acabado más vendido", topValue(filteredSales.map((sale) => sale.finish_type))],
    ["Pendientes de pago", pendingPayment.toString()],
    ["Pendientes de entrega", pendingDelivery.toString()],
  ]

  return (
    <>
      <PageHeader title="Reportes" description="Métricas por periodo para ventas, gastos y producción." />
      <div className="mb-4 grid gap-3 sm:grid-cols-3">
        <div className="grid gap-2">
          <Label>Periodo</Label>
          <Select value={period} onValueChange={(value) => setPeriod(value as Period)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="weekly">Semanal</SelectItem>
              <SelectItem value="monthly">Mensual</SelectItem>
              <SelectItem value="quarterly">Trimestral</SelectItem>
              <SelectItem value="yearly">Anual</SelectItem>
              <SelectItem value="custom">Personalizado</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="grid gap-2">
          <Label>Desde</Label>
          <Input type="date" value={period === "custom" ? customFrom : range.from} disabled={period !== "custom"} onChange={(e) => setCustomFrom(e.target.value)} />
        </div>
        <div className="grid gap-2">
          <Label>Hasta</Label>
          <Input type="date" value={period === "custom" ? customTo : range.to} disabled={period !== "custom"} onChange={(e) => setCustomTo(e.target.value)} />
        </div>
      </div>
      {error && <div role="alert" className="mb-4 rounded-lg border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">Error al cargar reportes: {error.message}</div>}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {cards.map(([label, value]) => (
          <Card key={label}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{label}</CardTitle>
              <BarChart3 className="size-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>{loading ? <Skeleton className="h-8 w-24" /> : <p className="text-2xl font-semibold tracking-tight">{value}</p>}</CardContent>
          </Card>
        ))}
      </div>
    </>
  )
}
