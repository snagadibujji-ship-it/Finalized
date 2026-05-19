import { useListAvailableJobs, useAcceptJob, getListAvailableJobsQueryKey, getListMyJobsQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Layout } from "@/components/layout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MapPin, Navigation, Loader2 } from "lucide-react";

export default function JobsPage() {
  const { data: jobs, isLoading } = useListAvailableJobs();
  const acceptJob = useAcceptJob();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const handleAccept = (jobId: number) => {
    acceptJob.mutate(
      { id: jobId },
      {
        onSuccess: () => {
          toast({ title: "Job Accepted", description: "This delivery is now assigned to you." });
          queryClient.invalidateQueries({ queryKey: getListAvailableJobsQueryKey() });
          queryClient.invalidateQueries({ queryKey: getListMyJobsQueryKey() });
        },
        onError: (err) => {
          toast({ title: "Error", description: err.message, variant: "destructive" });
        },
      }
    );
  };

  return (
    <Layout>
      <div className="space-y-4">
        <h1 className="text-2xl font-black uppercase tracking-tight">Available Jobs</h1>
        
        {isLoading ? (
          <div className="flex justify-center p-8"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
        ) : jobs?.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-12 text-center bg-muted rounded-xl border border-dashed">
            <div className="h-16 w-16 bg-muted-foreground/10 rounded-full flex items-center justify-center mb-4">
              <Navigation className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-bold">No jobs available</h3>
            <p className="text-muted-foreground text-sm mt-1">Check back soon for new deliveries.</p>
          </div>
        ) : (
          <div className="grid gap-4">
            {jobs?.map((job) => (
              <Card key={job.id} className="overflow-hidden border-2" data-testid={`card-job-${job.id}`}>
                <CardContent className="p-0">
                  <div className="p-4 bg-muted/30 border-b">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <div className="text-sm font-bold text-muted-foreground uppercase tracking-wider mb-1">Order #{job.orderId}</div>
                        <div className="font-bold text-xl">Ready for Pickup</div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-bold text-muted-foreground uppercase tracking-wider mb-1">Earning</div>
                        <div className="font-black text-2xl text-green-600">--</div> {/* Add fee when available */}
                      </div>
                    </div>
                  </div>
                  <div className="p-4 flex flex-col gap-4">
                    <div className="flex items-start gap-3">
                      <div className="mt-0.5 bg-primary/20 p-2 rounded-full text-primary">
                        <MapPin className="h-5 w-5" />
                      </div>
                      <div>
                        <div className="font-bold">Pickup Needed</div>
                        <div className="text-sm text-muted-foreground line-clamp-2">Check details for address</div>
                      </div>
                    </div>
                    <Button 
                      onClick={() => handleAccept(job.id)}
                      disabled={acceptJob.isPending}
                      className="w-full h-14 text-lg font-black uppercase tracking-widest shadow-md"
                      data-testid={`button-accept-${job.id}`}
                    >
                      {acceptJob.isPending ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : null}
                      Accept Job
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}
