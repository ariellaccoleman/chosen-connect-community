
import React, { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useHubs, useHubMutations } from '@/hooks/hubs';
import { Link } from 'react-router-dom';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Star, Pencil, Trash2, ArrowLeft } from 'lucide-react';
import { HubWithTag } from '@/types/hub';

const AdminHubs: React.FC = () => {
  const { isAdmin } = useAuth();
  const { data: hubs, isLoading, error } = useHubs();
  const { toggleFeatured, deleteHub, isTogglingFeatured, isDeleting } = useHubMutations();
  const [hubToDelete, setHubToDelete] = useState<HubWithTag | null>(null);

  // Redirect if not admin
  if (!isAdmin) {
    return <Navigate to="/dashboard" replace />;
  }

  const handleToggleFeatured = (hubId: string, isFeatured: boolean) => {
    toggleFeatured({ id: hubId, isFeatured });
  };

  const handleDeleteClick = (hub: HubWithTag) => {
    setHubToDelete(hub);
  };

  const confirmDelete = () => {
    if (hubToDelete) {
      deleteHub(hubToDelete.id);
      setHubToDelete(null);
    }
  };

  const cancelDelete = () => {
    setHubToDelete(null);
  };

  if (isLoading) {
    return (
      <div className="container mx-auto py-6">
        <Skeleton className="h-8 w-40 mb-2" />
        <Skeleton className="h-4 w-60 mb-6" />
        <Skeleton className="h-64 w-full rounded-lg" />
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6">
      <Link to="/admin" className="text-sm text-muted-foreground hover:underline inline-flex items-center">
        <ArrowLeft className="h-4 w-4 mr-1" />
        Back to Admin Dashboard
      </Link>
      
      <div className="flex justify-between items-center mb-6 mt-2">
        <div>
          <h1 className="text-3xl font-bold font-heading">Manage Hubs</h1>
          <p className="text-muted-foreground">
            Create, edit, and manage content hubs
          </p>
        </div>
        
        <Link to="/admin/hubs/new">
          <Button>Create Hub</Button>
        </Link>
      </div>

      {error ? (
        <div className="p-4 border border-red-200 rounded bg-red-50 text-red-700 my-4">
          <p>Error loading hubs: {error instanceof Error ? error.message : 'Unknown error'}</p>
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Tag</TableHead>
                <TableHead>Featured</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {hubs && hubs.length > 0 ? (
                hubs.map((hub) => (
                  <TableRow key={hub.id}>
                    <TableCell className="font-medium">{hub.name}</TableCell>
                    <TableCell>{hub.tag_name}</TableCell>
                    <TableCell>
                      <Button
                        variant={hub.is_featured ? "default" : "outline"}
                        size="sm"
                        onClick={() => handleToggleFeatured(hub.id, !hub.is_featured)}
                        disabled={isTogglingFeatured}
                      >
                        <Star className={`h-4 w-4 mr-1 ${hub.is_featured ? "text-yellow-200" : ""}`} />
                        {hub.is_featured ? "Featured" : "Not Featured"}
                      </Button>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Link to={`/admin/hubs/edit/${hub.id}`}>
                          <Button variant="outline" size="sm">
                            <Pencil className="h-4 w-4 mr-1" />
                            Edit
                          </Button>
                        </Link>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleDeleteClick(hub)}
                          disabled={isDeleting}
                        >
                          <Trash2 className="h-4 w-4 mr-1" />
                          Delete
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-6">
                    No hubs found. Create your first hub to get started.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!hubToDelete} onOpenChange={(open) => !open && setHubToDelete(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Hub</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete the hub "{hubToDelete?.name}"? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={cancelDelete}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={confirmDelete} disabled={isDeleting}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminHubs;
