import { formatDistanceToNow } from "date-fns";
import { Check, X } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { RiskBadge } from "./RiskBadge";
import { CategoryBadge } from "./CategoryBadge";
import type { DetectionEvent } from "@/data/mockData";

interface LiveFeedTableProps {
  events: DetectionEvent[];
}

export function LiveFeedTable({ events }: LiveFeedTableProps) {
  return (
    <div className="rounded-lg border border-border bg-card">
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <TableHead className="text-xs font-medium uppercase text-muted-foreground">Time</TableHead>
            <TableHead className="text-xs font-medium uppercase text-muted-foreground">Tool</TableHead>
            <TableHead className="text-xs font-medium uppercase text-muted-foreground">Category</TableHead>
            <TableHead className="text-xs font-medium uppercase text-muted-foreground">Risk</TableHead>
            <TableHead className="text-xs font-medium uppercase text-muted-foreground">Process</TableHead>
            <TableHead className="text-xs font-medium uppercase text-muted-foreground">Domain</TableHead>
            <TableHead className="text-xs font-medium uppercase text-muted-foreground">User</TableHead>
            <TableHead className="text-xs font-medium uppercase text-muted-foreground">Approved</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {events.map((event) => (
            <TableRow key={event.event_id} className="group">
              <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                {formatDistanceToNow(new Date(event.timestamp), { addSuffix: true })}
              </TableCell>
              <TableCell>
                <div className="flex flex-col">
                  <span className="text-sm font-medium">{event.tool_name}</span>
                  <span className="text-xs text-muted-foreground">{event.vendor}</span>
                </div>
              </TableCell>
              <TableCell><CategoryBadge category={event.category} /></TableCell>
              <TableCell><RiskBadge level={event.risk_level} /></TableCell>
              <TableCell className="text-sm font-mono text-muted-foreground">{event.process_name}</TableCell>
              <TableCell className="text-xs text-muted-foreground max-w-[140px] truncate">{event.domain}</TableCell>
              <TableCell className="text-sm">{event.department || "General"}</TableCell>
              <TableCell>
                {event.is_approved ? (
                  <div className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500/15">
                    <Check className="h-3 w-3 text-emerald-500" />
                  </div>
                ) : (
                  <div className="flex h-5 w-5 items-center justify-center rounded-full bg-red-500/15">
                    <X className="h-3 w-3 text-red-500" />
                  </div>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
