import { useListMyJobs } from "@workspace/api-client-react";
import { Link } from "wouter";
import { Layout } from "@/components/layout";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2, ClipboardList, CheckCircle2, ChevronRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default function MyJobsPage() {
  const { data: jobs, isLoading } = useListMyJobs();

  const getStatusDisplay = (status: string) => {
    switch (status) {
      case 'accepted': return { label: 'To Pickup', color: 'bg-yellow-500' };
      case 'picked_up': return { label: 'In Transit', color: 'bg-blue-500' };
      case 'delivered': return { label: 'Delivered', color: 'bg-green-500' };
      case 'cancelled': return { label: 'Cancelled', color: 'bg-red-500' };
      default: return { label: status, color: 'bg-gray-500' };
    }
  };

  return (
    <Layout>
      <div className="space-y-4">
        <h1 className="text-2xl font-black uppercase tracking-tight">My Jobs</h1>
        
        {isLoading ? (
          <div className="flex justify-center p-8"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
        ) : jobs?.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-12 text-center bg-muted rounded-xl border border-dashed">
            <div className="h-16 w-16 bg-muted-foreground/10 rounded-full flex items-center justify-center mb-4">
              <ClipboardList className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-bold">No active jobs</h3>
            <p className="text-muted-foreground text-sm mt-1">Accept a job from the available list to get started.</p>
          </div>
        ) : (
          <div className="grid gap-3">
            {jobs?.map((job) => {
              const display = getStatusDisplay(job.status);
              return (
                <Link key={job.id} href={`/job/${job.id}`}>
                  <Card className="overflow-hidden border-2 cursor-pointer hover:border-primary transition-colors hover-elevate" data-testid={`card-myjob-${job.id}`}>
                    <CardContent className="p-4 flex items-center justify-between">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-sm font-bold text-muted-foreground uppercase tracking-wider">Order #{job.orderId}</span>
                          <Badge className={`${display.color} text-white border-transparent`}>{display.label}</Badge>
                        </div>
                        <div className="font-bold text-lg">
                          {job.status === 'delivered' ? (
                            <span className="flex items-center gap-1 text-green-600">
                              <CheckCircle2 className="h-5 w-5" /> Completed
                            </span>
                          ) : (
                            <span>Tap to view details</span>
                          )}
                        </div>
                      </div>
                      <ChevronRight className="h-6 w-6 text-muted-foreground" />
                    </CardContent>
                  </Card>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </Layout>
  );
}
