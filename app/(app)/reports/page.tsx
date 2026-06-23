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
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

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

function countRank(values: string[]) {
  const counts = new Map<string, number>()
  for (const value of values) counts.set(value, (counts.get(value) ?? 0) + 1)
  return [...counts.entries()]
    .map(([label, count]) => ({ label, count }))
    .sort((a, b) => b.count - a.count)
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
  const averageTicket = filteredSales.length ? gross / filteredSales.length : 0

  const paidBySale = new Map<string, number>()
  for (const payment of payments ?? []) {
    if (payment.sale_id) paidBySale.set(payment.sale_id, (paidBySale.get(payment.sale_id) ?? 0) + (payment.amount ?? 0))
  }
  const receivable = filteredSales.reduce((sum, sale) => sum + Math.max((sale.sale_price ?? 0) - (paidBySale.get(sale.id) ?? 0), 0), 0)
  const pendingPayment = filteredSales.filter((sale) => Math.max((sale.sale_price ?? 0) - (paidBySale.get(sale.id) ?? 0), 0) > 0).length
  const pendingDelivery = filteredSales.filter((sale) => !["entregado", "cancelado"].includes(sale.production_status ?? "")).length

  const productRank = [
    ...countRank(filteredSales.map((sale) => (sale.character_id ? characterNames.get(sale.character_id) ?? "Sin nombre" : "Sin personaje"))).slice(0, 5).map((item) => ({ type: "Personaje", ...item })),
    ...countRank(filteredSales.map((sale) => (sale.design_id ? designNames.get(sale.design_id) ?? "Sin nombre" : "Sin diseno"))).slice(0, 5).map((item) => ({ type: "Diseno", ...item })),
  ]
  const attributeRank = [
    ...countRank(filteredSales.map((sale) => (sale.color_id ? colorNames.get(sale.color_id) ?? "Sin nombre" : "Sin color"))).slice(0, 4).map((item) => ({ type: "Color", ...item })),
    ...countRank(filteredSales.map((sale) => (sale.size_id ? sizeNames.get(sale.size_id) ?? "Sin nombre" : "Sin talla"))).slice(0, 4).map((item) => ({ type: "Talla", ...item })),
    ...countRank(filteredSales.map((sale) => sale.finish_type ?? "Sin acabado")).slice(0, 4).map((item) => ({ type: "Acabado", ...item })),
  ]
  const expenseRank = [...filteredExpenses.reduce((map, expense) => {
    const category = expense.category ?? "otro"
    const current = map.get(category) ?? 0
    map.set(category, current + (expense.amount ?? 0))
    return map
  }, new Map<string, number>()).entries()]
    .map(([label, total]) => ({ label, total }))
    .sort((a, b) => b.total - a.total)
    .slice(0, 8)

  const cards = [
    ["Ventas brutas", money(gross)],
    ["Gastos", money(expenseTotal)],
    ["Utilidad estimada", money(gross - costs - expenseTotal)],
    ["Ticket promedio", money(averageTicket)],
    ["Total por cobrar", money(receivable)],
    ["Camisas vendidas", shirts.toString()],
    ["Pendientes de pago", pendingPayment.toString()],
    ["Pendientes de entrega", pendingDelivery.toString()],
  ]

  return (
    <>
      <PageHeader title="Reportes" description="Metricas por periodo para ventas, gastos y produccion." />
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
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
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
      <div className="mt-6 grid gap-4 lg:grid-cols-3">
        <Card>
          <CardHeader><CardTitle>Ranking de productos</CardTitle></CardHeader>
          <CardContent>
            <Table>
              <TableHeader><TableRow><TableHead>Tipo</TableHead><TableHead>Nombre</TableHead><TableHead>Ventas</TableHead></TableRow></TableHeader>
              <TableBody>
                {productRank.map((item) => <TableRow key={`${item.type}-${item.label}`}><TableCell>{item.type}</TableCell><TableCell className="font-medium">{item.label}</TableCell><TableCell>{item.count}</TableCell></TableRow>)}
                {!productRank.length && <TableRow><TableCell colSpan={3} className="text-center text-muted-foreground">Sin ventas en el periodo.</TableCell></TableRow>}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Atributos mas vendidos</CardTitle></CardHeader>
          <CardContent>
            <Table>
              <TableHeader><TableRow><TableHead>Tipo</TableHead><TableHead>Valor</TableHead><TableHead>Ventas</TableHead></TableRow></TableHeader>
              <TableBody>
                {attributeRank.map((item) => <TableRow key={`${item.type}-${item.label}`}><TableCell>{item.type}</TableCell><TableCell className="font-medium">{item.label}</TableCell><TableCell>{item.count}</TableCell></TableRow>)}
                {!attributeRank.length && <TableRow><TableCell colSpan={3} className="text-center text-muted-foreground">Sin ventas en el periodo.</TableCell></TableRow>}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Gastos por categoria</CardTitle></CardHeader>
          <CardContent>
            <Table>
              <TableHeader><TableRow><TableHead>Categoria</TableHead><TableHead>Total</TableHead></TableRow></TableHeader>
              <TableBody>
                {expenseRank.map((item) => <TableRow key={item.label}><TableCell className="font-medium">{item.label}</TableCell><TableCell>{money(item.total)}</TableCell></TableRow>)}
                {!expenseRank.length && <TableRow><TableCell colSpan={2} className="text-center text-muted-foreground">Sin gastos en el periodo.</TableCell></TableRow>}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </>
  )
}
