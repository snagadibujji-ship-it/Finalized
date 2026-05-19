import { useAdminListOrders } from "@workspace/api-client-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";

export default function OrdersPage() {
  const { data: orders, isLoading } = useAdminListOrders();

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'placed':
        return <Badge variant="secondary">Placed</Badge>;
      case 'confirmed':
        return <Badge className="bg-blue-500/15 text-blue-700 hover:bg-blue-500/25 border-blue-200">Confirmed</Badge>;
      case 'preparing':
        return <Badge className="bg-amber-500/15 text-amber-700 hover:bg-amber-500/25 border-amber-200">Preparing</Badge>;
      case 'ready':
      case 'picked_up':
        return <Badge className="bg-indigo-500/15 text-indigo-700 hover:bg-indigo-500/25 border-indigo-200">In Transit</Badge>;
      case 'delivered':
        return <Badge className="bg-emerald-500/15 text-emerald-700 hover:bg-emerald-500/25 border-emerald-200">Delivered</Badge>;
      case 'cancelled':
        return <Badge variant="destructive">Cancelled</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Orders</h1>
        <p className="text-muted-foreground mt-1">Platform-wide order tracking</p>
      </div>

      <div className="rounded-md border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Order ID</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Customer</TableHead>
              <TableHead>Shop ID</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Total</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              [...Array(5)].map((_, i) => (
                <TableRow key={i}>
                  <TableCell><Skeleton className="h-5 w-[80px]" /></TableCell>
                  <TableCell><Skeleton className="h-5 w-[120px]" /></TableCell>
                  <TableCell><Skeleton className="h-5 w-[100px]" /></TableCell>
                  <TableCell><Skeleton className="h-5 w-[60px]" /></TableCell>
                  <TableCell><Skeleton className="h-5 w-[100px]" /></TableCell>
                  <TableCell><Skeleton className="h-5 w-[80px] ml-auto" /></TableCell>
                </TableRow>
              ))
            ) : orders?.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-32 text-center text-muted-foreground">
                  No orders found.
                </TableCell>
              </TableRow>
            ) : (
              orders?.map((order) => (
                <TableRow key={order.id}>
                  <TableCell className="font-medium text-primary">#{order.id}</TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    {order.createdAt ? format(new Date(order.createdAt), 'MMM d, h:mm a') : 'N/A'}
                  </TableCell>
                  <TableCell>User #{order.customerId}</TableCell>
                  <TableCell>Shop #{order.shopId}</TableCell>
                  <TableCell>{getStatusBadge(order.status)}</TableCell>
                  <TableCell className="text-right font-medium">
                    ${Number(order.total).toFixed(2)}
                    <div className="text-xs text-muted-foreground font-normal">
                      Fee: ${Number(order.deliveryFee).toFixed(2)}
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
