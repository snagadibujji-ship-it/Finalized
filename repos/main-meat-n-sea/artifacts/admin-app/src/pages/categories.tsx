import { useState } from "react";
import { useListCategories, useCreateCategory, useDeleteCategory, getListCategoriesQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { Trash2, Plus, Tags } from "lucide-react";

export default function CategoriesPage() {
  const { data: categories, isLoading } = useListCategories();
  const createCategory = useCreateCategory();
  const deleteCategory = useDeleteCategory();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [newCategoryName, setNewCategoryName] = useState("");
  const [newCategoryIcon, setNewCategoryIcon] = useState("");

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCategoryName.trim()) return;

    createCategory.mutate(
      { data: { name: newCategoryName, icon: newCategoryIcon } },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListCategoriesQueryKey() });
          setNewCategoryName("");
          setNewCategoryIcon("");
          toast({ title: "Category added", description: "The new category has been created." });
        },
        onError: () => {
          toast({ title: "Error", description: "Failed to create category", variant: "destructive" });
        }
      }
    );
  };

  const handleDelete = (id: number) => {
    if (!confirm("Are you sure you want to delete this category?")) return;
    
    deleteCategory.mutate(
      { id },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListCategoriesQueryKey() });
          toast({ title: "Category deleted" });
        },
        onError: () => {
          toast({ title: "Error", description: "Failed to delete category", variant: "destructive" });
        }
      }
    );
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Categories</h1>
        <p className="text-muted-foreground mt-1">Manage shop categories platform-wide</p>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card className="md:col-span-1 border-dashed shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg">Add New Category</CardTitle>
            <CardDescription>Create a new category for shops.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreate} className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Name</label>
                <Input 
                  placeholder="e.g. Groceries" 
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                  disabled={createCategory.isPending}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Icon (optional, emoji/text)</label>
                <Input 
                  placeholder="e.g. Food" 
                  value={newCategoryIcon}
                  onChange={(e) => setNewCategoryIcon(e.target.value)}
                  disabled={createCategory.isPending}
                />
              </div>
              <Button type="submit" className="w-full" disabled={createCategory.isPending || !newCategoryName.trim()}>
                <Plus className="w-4 h-4 mr-2" />
                Add Category
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card className="md:col-span-2 shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Tags className="w-5 h-5 text-muted-foreground" />
              Active Categories
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="grid grid-cols-2 gap-4">
                {[...Array(6)].map((_, i) => (
                  <Skeleton key={i} className="h-16 w-full rounded-lg" />
                ))}
              </div>
            ) : categories?.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground border border-dashed rounded-lg">
                No categories found.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {categories?.map((cat) => (
                  <div key={cat.id} className="flex items-center justify-between p-3 border rounded-lg bg-card hover:border-primary/50 transition-colors">
                    <div className="flex items-center gap-3">
                      {cat.icon && (
                        <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center text-sm">
                          {cat.icon}
                        </div>
                      )}
                      <span className="font-medium">{cat.name}</span>
                    </div>
                    <Button 
                      variant="ghost" 
                      size="icon"
                      className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                      onClick={() => handleDelete(cat.id)}
                      disabled={deleteCategory.isPending}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
