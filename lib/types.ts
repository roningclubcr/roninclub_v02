export type ContactMethod = "instagram" | "whatsapp"
export type FinishType = "plain" | "washed" | "none"
export type ItemType = "camisa" | "dtf" | "empaque" | "etiqueta" | "otro"
export type PaymentMethod = "sinpe" | "efectivo" | "transferencia" | "tarjeta" | "otro"
export type ExpenseCategory =
  | "camisas"
  | "dtf"
  | "empaque"
  | "publicidad"
  | "envios"
  | "equipo"
  | "software"
  | "otro"

export interface Client {
  id: string
  name: string
  phone: string | null
  contact_method: ContactMethod | null
  instagram_user: string | null
  notes: string | null
  created_at: string
}

export interface ClientInput {
  name: string
  phone: string | null
  contact_method: ContactMethod | null
  instagram_user: string | null
  notes: string | null
}

export interface Character {
  id: string
  name: string
  franchise: string | null
  status: string | null
  notes: string | null
  created_at: string
}

export interface CharacterInput {
  name: string
  franchise: string | null
  status: string | null
  notes: string | null
}

export interface Design {
  id: string
  character_id: string | null
  name: string
  design_type: string | null
  suggested_price_plain: number | null
  suggested_price_washed: number | null
  estimated_dtf_cost: number | null
  image_url: string | null
  status: string | null
  created_at: string
}

export interface DesignInput {
  character_id: string | null
  name: string
  design_type: string | null
  suggested_price_plain: number | null
  suggested_price_washed: number | null
  estimated_dtf_cost: number | null
  image_url: string | null
  status: string | null
}

export interface Color {
  id: string
  name: string
  finish_type: FinishType | null
  status: string | null
  created_at: string
}

export interface ColorInput {
  name: string
  finish_type: FinishType | null
  status: string | null
}

export interface Size {
  id: string
  name: string
}

export interface SizeInput {
  name: string
}

export type ProductionStatus =
  | "pedido_recibido"
  | "falta_comprar_camisa"
  | "falta_dtf"
  | "falta_empaque"
  | "listo_para_estampar"
  | "estampado"
  | "empacado"
  | "entregado"
  | "cancelado"

export type PaymentStatus = "pendiente" | "abonado" | "pagado" | "reembolsado"

export interface InventoryItem {
  id: string
  item_type: ItemType | string
  finish_type: FinishType | null
  color_id: string | null
  size_id: string | null
  stock_actual: number | null
  stock_minimo: number | null
  unit_cost: number | null
  supplier: string | null
  notes: string | null
  created_at: string
}

export interface InventoryInput {
  item_type: ItemType | string
  finish_type: FinishType | null
  color_id: string | null
  size_id: string | null
  stock_actual: number | null
  stock_minimo: number | null
  unit_cost: number | null
  supplier: string | null
  notes: string | null
}

export interface Sale {
  id: string
  sale_number: string | null
  client_id: string | null
  character_id: string | null
  design_id: string | null
  color_id: string | null
  size_id: string | null
  finish_type: FinishType | null
  quantity: number | null
  sale_price: number | null
  shirt_cost: number | null
  dtf_cost: number | null
  packaging_cost: number | null
  other_costs: number | null
  production_status: ProductionStatus | null
  payment_status: PaymentStatus | null
  order_date: string | null
  estimated_delivery_date: string | null
  real_delivery_date: string | null
  notes: string | null
  created_at: string
}

export interface SaleInput {
  sale_number: string | null
  client_id: string | null
  character_id: string | null
  design_id: string | null
  color_id: string | null
  size_id: string | null
  finish_type: FinishType | null
  quantity: number | null
  sale_price: number | null
  shirt_cost: number | null
  dtf_cost: number | null
  packaging_cost: number | null
  other_costs: number | null
  production_status: ProductionStatus | null
  payment_status: PaymentStatus | null
  order_date: string | null
  estimated_delivery_date: string | null
  real_delivery_date: string | null
  notes: string | null
}

export interface Payment {
  id: string
  sale_id: string | null
  payment_date: string | null
  amount: number | null
  payment_method: PaymentMethod | string | null
  reference: string | null
  notes: string | null
  created_at: string
}

export interface PaymentInput {
  sale_id: string | null
  payment_date: string | null
  amount: number | null
  payment_method: PaymentMethod | string | null
  reference: string | null
  notes: string | null
}

export interface Expense {
  id: string
  expense_date: string | null
  category: ExpenseCategory | string | null
  description: string
  amount: number | null
  payment_method: PaymentMethod | string | null
  supplier: string | null
  sale_id: string | null
  receipt_url: string | null
  notes: string | null
  created_at: string
}

export interface ExpenseInput {
  expense_date: string | null
  category: ExpenseCategory | string | null
  description: string
  amount: number | null
  payment_method: PaymentMethod | string | null
  supplier: string | null
  sale_id: string | null
  receipt_url: string | null
  notes: string | null
}
