import { useAdminListShops, useAdminUpdateShopStatus, getAdminListShopsQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { Check, X } from "lucide-react";
import { format } from "date-fns";

export default function ShopsPage() {
  const { data: shops, isLoading } = useAdminListShops();
  const updateStatus = useAdminUpdateShopStatus();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const handleUpdateStatus = (id: number, status: "active" | "suspended" | "pending") => {
    updateStatus.mutate(
      { id, data: { status } },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getAdminListShopsQueryKey() });
          toast({ title: "Shop updated", description: `Shop status changed to ${status}` });
        },
        onError: () => {
          toast({ title: "Error", description: "Failed to update shop status", variant: "destructive" });
        }
      }
    );
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-emerald-500/15 text-emerald-700 hover:bg-emerald-500/25 border-emerald-200">Active</Badge>;
      case 'suspended':
        return <Badge variant="destructive">Suspended</Badge>;
      case 'pending':
        return <Badge variant="secondary" className="bg-amber-500/15 text-amber-700 hover:bg-amber-500/25 border-amber-200">Pending</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Shops</h1>
        <p className="text-muted-foreground mt-1">Manage vendor shops and applications</p>
      </div>

      <div className="rounded-md border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Shop Name</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Area</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Joined</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              [...Array(5)].map((_, i) => (
                <TableRow key={i}>
                  <TableCell><Skeleton className="h-5 w-[150px]" /></TableCell>
                  <TableCell><Skeleton className="h-5 w-[100px]" /></TableCell>
                  <TableCell><Skeleton className="h-5 w-[100px]" /></TableCell>
                  <TableCell><Skeleton className="h-5 w-[80px]" /></TableCell>
                  <TableCell><Skeleton className="h-5 w-[100px]" /></TableCell>
                  <TableCell><Skeleton className="h-8 w-[120px] ml-auto" /></TableCell>
                </TableRow>
              ))
            ) : shops?.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-32 text-center text-muted-foreground">
                  No shops found.
                </TableCell>
              </TableRow>
            ) : (
              shops?.map((shop) => (
                <TableRow key={shop.id}>
                  <TableCell className="font-medium">
                    {shop.name}
                    <div className="text-xs text-muted-foreground font-normal">/{shop.slug}</div>
                  </TableCell>
                  <TableCell>{shop.category}</TableCell>
                  <TableCell>{shop.area}</TableCell>
                  <TableCell>{getStatusBadge(shop.status)}</TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    {shop.createdAt ? format(new Date(shop.createdAt), 'MMM d, yyyy') : 'N/A'}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      {shop.status === 'pending' && (
                        <>
                          <Button 
                            size="sm" 
                            variant="outline" 
                            className="bg-emerald-50 text-emerald-600 border-emerald-200 hover:bg-emerald-100 hover:text-emerald-700"
                            onClick={() => handleUpdateStatus(shop.id, 'active')}
                            disabled={updateStatus.isPending}
                          >
                            <Check className="w-4 h-4 mr-1" />
                            Approve
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline" 
                            className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                            onClick={() => handleUpdateStatus(shop.id, 'suspended')}
                            disabled={updateStatus.isPending}
                          >
                            <X className="w-4 h-4 mr-1" />
                            Reject
                          </Button>
                        </>
                      )}
                      {shop.status === 'active' && (
                        <Button 
                          size="sm" 
                          variant="outline" 
                          className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                          onClick={() => handleUpdateStatus(shop.id, 'suspended')}
                          disabled={updateStatus.isPending}
                        >
                          Suspend
                        </Button>
                      )}
                      {shop.status === 'suspended' && (
                        <Button 
                          size="sm" 
                          variant="outline" 
                          onClick={() => handleUpdateStatus(shop.id, 'active')}
                          disabled={updateStatus.isPending}
                        >
                          Reactivate
                        </Button>
                      )}
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
