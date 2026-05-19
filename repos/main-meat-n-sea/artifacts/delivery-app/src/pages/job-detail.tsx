import { useParams, useLocation } from "wouter";
import { useListMyJobs, useListAvailableJobs, useGetOrder, useAcceptJob, useUpdateJobStatus, getListAvailableJobsQueryKey, getListMyJobsQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Layout } from "@/components/layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, MapPin, Package, Navigation, ArrowLeft, CheckCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default function JobDetailPage() {
  const { id } = useParams();
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  const jobId = parseInt(id || "0", 10);

  // We find the job either in my jobs or available jobs
  const { data: myJobs, isLoading: isLoadingMy } = useListMyJobs();
  const { data: availableJobs, isLoading: isLoadingAvailable } = useListAvailableJobs();
  
  const job = myJobs?.find(j => j.id === jobId) || availableJobs?.find(j => j.id === jobId);
  
  const { data: order, isLoading: isLoadingOrder } = useGetOrder(job?.orderId || 0, {
    query: { enabled: !!job?.orderId, queryKey: ["order", job?.orderId] }
  });

  const acceptJob = useAcceptJob();
  const updateStatus = useUpdateJobStatus();

  const handleAccept = () => {
    acceptJob.mutate({ id: jobId }, {
      onSuccess: () => {
        toast({ title: "Job Accepted", description: "You are now assigned to this delivery." });
        queryClient.invalidateQueries({ queryKey: getListAvailableJobsQueryKey() });
        queryClient.invalidateQueries({ queryKey: getListMyJobsQueryKey() });
      },
      onError: (err) => {
        toast({ title: "Error", description: err.message, variant: "destructive" });
      }
    });
  };

  const handleUpdateStatus = (newStatus: "picked_up" | "delivered") => {
    updateStatus.mutate({ id: jobId, data: { status: newStatus } }, {
      onSuccess: () => {
        toast({ title: "Status Updated", description: `Job marked as ${newStatus.replace('_', ' ')}` });
        queryClient.invalidateQueries({ queryKey: getListMyJobsQueryKey() });
      },
      onError: (err) => {
        toast({ title: "Error", description: err.message, variant: "destructive" });
      }
    });
  };

  if (isLoadingMy || isLoadingAvailable || isLoadingOrder) {
    return (
      <Layout>
        <div className="flex justify-center p-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
      </Layout>
    );
  }

  if (!job) {
    return (
      <Layout>
        <div className="p-4">
          <Button variant="ghost" onClick={() => setLocation("/jobs")} className="mb-4">
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Jobs
          </Button>
          <div className="text-center p-8 bg-muted rounded-xl font-bold">Job not found</div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-4">
        <Button variant="ghost" onClick={() => setLocation(job.riderId ? "/my-jobs" : "/jobs")} className="px-0 -ml-2 hover:bg-transparent">
          <ArrowLeft className="mr-2 h-5 w-5" /> Back
        </Button>
        
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-black uppercase tracking-tight">Order #{job.orderId}</h1>
          <Badge className="text-sm px-3 py-1">
            {job.status.replace('_', ' ').toUpperCase()}
          </Badge>
        </div>

        <Card className="border-2 shadow-sm">
          <CardHeader className="bg-muted/30 border-b pb-4">
            <CardTitle className="flex items-center gap-2 text-lg">
              <MapPin className="h-5 w-5 text-primary" /> Delivery Details
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 space-y-4">
            {order ? (
              <>
                <div>
                  <div className="text-sm font-bold text-muted-foreground uppercase tracking-wider mb-1">Customer Address</div>
                  <div className="font-bold text-lg leading-tight">{order.deliveryAddress}</div>
                </div>
                {order.notes && (
                  <div className="bg-yellow-50 p-3 rounded-lg border border-yellow-200">
                    <div className="text-xs font-bold text-yellow-800 uppercase tracking-wider mb-1">Delivery Notes</div>
                    <div className="text-yellow-900 font-medium">{order.notes}</div>
                  </div>
                )}
                <div>
                  <div className="text-sm font-bold text-muted-foreground uppercase tracking-wider mb-1">Earning</div>
                  <div className="font-black text-3xl text-green-600">${order.deliveryFee || "5.00"}</div>
                </div>
              </>
            ) : (
              <div className="text-muted-foreground">Loading order details...</div>
            )}
          </CardContent>
        </Card>

        {job.status === "available" && (
          <Button 
            onClick={handleAccept}
            disabled={acceptJob.isPending}
            className="w-full h-16 text-xl font-black uppercase tracking-widest shadow-lg mt-4"
          >
            {acceptJob.isPending ? <Loader2 className="mr-2 h-6 w-6 animate-spin" /> : <Navigation className="mr-2 h-6 w-6" />}
            Accept Job
          </Button>
        )}

        {job.status === "accepted" && (
          <Button 
            onClick={() => handleUpdateStatus("picked_up")}
            disabled={updateStatus.isPending}
            className="w-full h-16 text-xl font-black uppercase tracking-widest shadow-lg mt-4"
          >
            {updateStatus.isPending ? <Loader2 className="mr-2 h-6 w-6 animate-spin" /> : <Package className="mr-2 h-6 w-6" />}
            Confirm Pickup
          </Button>
        )}

        {job.status === "picked_up" && (
          <Button 
            onClick={() => handleUpdateStatus("delivered")}
            disabled={updateStatus.isPending}
            className="w-full h-16 text-xl font-black uppercase tracking-widest shadow-lg mt-4 bg-green-600 hover:bg-green-700 text-white"
          >
            {updateStatus.isPending ? <Loader2 className="mr-2 h-6 w-6 animate-spin" /> : <CheckCircle className="mr-2 h-6 w-6" />}
            Mark Delivered
          </Button>
        )}
      </div>
    </Layout>
  );
}
