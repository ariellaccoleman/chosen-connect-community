
import React from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { APP_ROUTES } from "@/config/routes";
import { PlusCircle } from "lucide-react";

const EventSection: React.FC = () => {
  return (
    <div className="rounded-lg border bg-card p-6 shadow">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold">Events</h2>
        <Button
          asChild
          size="sm"
          className="bg-chosen-blue hover:bg-chosen-navy"
        >
          <Link to={APP_ROUTES.CREATE_EVENT} className="flex items-center gap-1">
            <PlusCircle size={16} />
            <span>Create Event</span>
          </Link>
        </Button>
      </div>
      <p className="text-muted-foreground mb-4">
        Host a virtual or in-person event for the community.
      </p>
    </div>
  );
};

export default EventSection;
