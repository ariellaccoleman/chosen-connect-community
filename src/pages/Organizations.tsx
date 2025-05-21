
import React, { useState } from 'react';
import Layout from '@/components/layout/Layout';
import { useOrganizations } from '@/hooks/organizations';
import { Button } from '@/components/ui/button';
import { PlusCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { APP_ROUTES } from '@/config/routes';
import { useAuth } from '@/hooks/useAuth';
import OrganizationCard from '@/components/organizations/OrganizationCard'; 
import { Skeleton } from '@/components/ui/skeleton';

const Organizations = () => {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  
  // Use the organizations hook - the hook accepts no arguments
  const { data, isLoading, error } = useOrganizations();
  
  // Safely access the organizations data
  const organizations = data?.data || [];
  
  // Filter organizations based on search query
  const filteredOrgs = organizations.filter(org => 
    org.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <Layout>
      <div className="container py-6">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">Organizations</h1>
          {user && (
            <Button asChild>
              <Link to={APP_ROUTES.ORGANIZATION_CREATE}>
                <PlusCircle className="mr-2 h-4 w-4" />
                Create Organization
              </Link>
            </Button>
          )}
        </div>
        
        <div className="mb-6">
          <input
            type="text"
            placeholder="Search organizations..."
            className="w-full px-4 py-2 border border-gray-300 rounded-md"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        
        {isLoading ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {[...Array(6)].map((_, i) => (
              <Skeleton key={i} className="h-48" />
            ))}
          </div>
        ) : error ? (
          <div className="text-center py-10">
            <p className="text-red-600">Error loading organizations</p>
            <p className="text-sm text-muted-foreground">{error.message}</p>
          </div>
        ) : organizations.length === 0 ? (
          <div className="text-center py-10">
            <p className="text-xl">No organizations found</p>
            {user && (
              <Button className="mt-4" asChild>
                <Link to={APP_ROUTES.ORGANIZATION_CREATE}>Create your first organization</Link>
              </Button>
            )}
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filteredOrgs.map((organization) => (
              <OrganizationCard key={organization.id} organization={organization} />
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
};

export default Organizations;
