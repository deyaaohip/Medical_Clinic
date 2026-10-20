"use client";

import * as React from "react";
import { AlertTriangle, Boxes, Package, Plus, RefreshCw, Search, Warehouse } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageShell } from "@/components/clinic/ui/page-shell";
import { PageHeader } from "@/components/clinic/ui/page-header";
import { StatCard } from "@/components/clinic/ui/stat-card";
import { LoadingBlock } from "@/components/clinic/ui/state-blocks";
import { StockList } from "@/components/clinic/inventory/stock-list";
import { SuppliersPanel } from "@/components/clinic/inventory/suppliers-panel";
import { OrdersPanel } from "@/components/clinic/inventory/orders-panel";
import { CreateItemDialog, type StockDraft } from "@/components/clinic/inventory/create-item-dialog";

export default function InventoryPage({ params }: { params: Promise<{ tenantId: string }> }) {
  const [tenantId, setTenantId] = React.useState("al-shifa");
  const [metrics, setMetrics] = React.useState<any>({});
  const [stock, setStock] = React.useState<any[]>([]);
  const [suppliers, setSuppliers] = React.useState<any[]>([]);
  const [warehouses, setWarehouses] = React.useState<any[]>([]);
  const [pos, setPos] = React.useState<any[]>([]);
  const [transfers, setTransfers] = React.useState<any[]>([]);
  const [search, setSearch] = React.useState("");
  const [loading, setLoading] = React.useState(true);
  const [modal, setModal] = React.useState(false);

  React.useEffect(() => {
    params.then((p) => setTenantId(p.tenantId));
  }, [params]);

  const load = React.useCallback(async () => {
    setLoading(true);
    const qs = new URLSearchParams({ search });
    const [m, s, sup, wh, po, tr] = await Promise.all([
      fetch(`/api/operations/${tenantId}/inventory-dashboard`).then((r) => r.json()),
      fetch(`/api/operations/${tenantId}/stock?${qs}`).then((r) => r.json()),
      fetch(`/api/operations/${tenantId}/suppliers`).then((r) => r.json()),
      fetch(`/api/operations/${tenantId}/warehouses`).then((r) => r.json()),
      fetch(`/api/operations/${tenantId}/purchase-orders`).then((r) => r.json()),
      fetch(`/api/operations/${tenantId}/transfers`).then((r) => r.json()),
    ]);
    if (m.success) setMetrics(m.metrics);
    if (s.success) setStock(s.data || []);
    if (sup.success) setSuppliers(sup.data || []);
    if (wh.success) setWarehouses(wh.data || []);
    if (po.success) setPos(po.data || []);
    if (tr.success) setTransfers(tr.data || []);
    setLoading(false);
  }, [tenantId, search]);

  React.useEffect(() => {
    load();
  }, [load]);

  async function create(draft: StockDraft) {
    const res = await fetch(`/api/operations/${tenantId}/stock`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(draft),
    });
    const data = await res.json();
    if (data.success) {
      setModal(false);
      load();
      alert("Inventory item created with barcode and QR.");
    }
  }

  return (
    <PageShell>
      <PageHeader
        icon={Package}
        eyebrow="Supply chain"
        title="Inventory & stock control"
        description="Medicines, supplies, purchase orders, suppliers, batches, barcode/QR, warehouses, transfers and expiry alerts."
        actions={
          <Button
            size="sm"
            className="h-9 gap-1.5 bg-teal-600 px-4 text-xs font-semibold shadow-sm hover:bg-teal-700"
            onClick={() => setModal(true)}
          >
            <Plus className="h-4 w-4" />
            New item
          </Button>
        }
      >
        <div className="relative w-full sm:w-80">
          <Search className="absolute start-3 top-2.5 h-4 w-4 text-slate-400" />
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search SKU or barcode..."
            className="h-9 w-full rounded-lg border border-slate-300 bg-white py-2 ps-9 pe-3 text-xs font-medium text-slate-900 shadow-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
          />
        </div>
      </PageHeader>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Items" value={metrics.items || 0} hint="SKUs tracked" icon={Boxes} tone="teal" />
        <StatCard label="On hand" value={metrics.stock || 0} hint="Units across warehouses" icon={Warehouse} tone="cyan" />
        <StatCard label="Low stock" value={metrics.lowStock || 0} hint="Below reorder point" icon={AlertTriangle} tone="rose" />
        <StatCard label="Expiring" value={metrics.expiringSoon || 0} hint="Within 30 days" icon={RefreshCw} tone="amber" />
      </div>

      {loading ? (
        <LoadingBlock label="Loading inventory" />
      ) : (
        <>
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            <div className="lg:col-span-2">
              <StockList stock={stock} />
            </div>
            <SuppliersPanel suppliers={suppliers} warehouses={warehouses} />
          </div>

          <OrdersPanel purchaseOrders={pos} transfers={transfers} />
        </>
      )}

      <CreateItemDialog open={modal} onOpenChange={setModal} onSubmit={create} />
    </PageShell>
  );
}
