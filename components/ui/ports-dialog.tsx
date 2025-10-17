"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Search, MapPin, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react";

interface Port {
  id: string;
  name: string;
  country: string;
}

interface PortsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect: (port: Port) => void;
  title: string;
  description: string;
  initialNameFilter?: string;
  initialCountryFilter?: string;
}

export function PortsDialog({ open, onOpenChange, onSelect, title, description, initialNameFilter = "", initialCountryFilter = "" }: PortsDialogProps) {
  const [ports, setPorts] = useState<Port[]>([]);
  const [loading, setLoading] = useState(false);
  const [nameFilter, setNameFilter] = useState(initialNameFilter);
  const [countryFilter, setCountryFilter] = useState(initialCountryFilter);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  
  const ROWS_PER_PAGE = 100;

  // Fetch ports data with pagination and filtering
  const fetchPorts = async (page: number = 1, nameSearch: string = "", countrySearch: string = "") => {
    setLoading(true);
    try {
      const supabase = createClient();
      
      // Calculate offset for pagination
      const from = (page - 1) * ROWS_PER_PAGE;
      const to = from + ROWS_PER_PAGE - 1;

      // Build the query with filters
      let query = supabase
        .from('ports')
        .select('id, name, country', { count: 'exact' })
        .range(from, to)
        .order('name');

      // Apply filters if provided
      if (nameSearch.trim()) {
        query = query.ilike('name', `%${nameSearch.trim()}%`);
      }
      if (countrySearch.trim()) {
        query = query.ilike('country', `%${countrySearch.trim()}%`);
      }

      const { data, error, count } = await query;
      
      if (error) throw error;
      
      setPorts(data || []);
      setTotalCount(count || 0);
      setTotalPages(Math.ceil((count || 0) / ROWS_PER_PAGE));
    } catch (error) {
      console.error('Error fetching ports:', error);
      setPorts([]);
      setTotalCount(0);
      setTotalPages(0);
    } finally {
      setLoading(false);
    }
  };

  // Load ports when dialog opens
  useEffect(() => {
    if (open) {
      setCurrentPage(1);
      // Use initial filters if provided, otherwise use current filter values
      const nameToUse = initialNameFilter || nameFilter;
      const countryToUse = initialCountryFilter || countryFilter;
      fetchPorts(1, nameToUse, countryToUse);
    }
  }, [open]);

  // Reset filters when dialog closes
  useEffect(() => {
    if (!open) {
      setNameFilter(initialNameFilter);
      setCountryFilter(initialCountryFilter);
      setCurrentPage(1);
    }
  }, [open, initialNameFilter, initialCountryFilter]);

  // Handle filter submission
  const handleFilterSubmit = () => {
    setCurrentPage(1);
    fetchPorts(1, nameFilter, countryFilter);
  };

  // Handle Enter key press in filter inputs
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleFilterSubmit();
    }
  };

  // Handle page changes
  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
      fetchPorts(page, nameFilter, countryFilter);
    }
  };

  const handleSelect = (port: Port) => {
    onSelect(port);
    onOpenChange(false);
    // Reset filters and pagination
    setNameFilter("");
    setCountryFilter("");
    setCurrentPage(1);
  };

  // Pagination controls
  const PaginationControls = () => {
    const getVisiblePages = () => {
      const delta = 2;
      const range = [];
      const rangeWithDots = [];

      for (let i = Math.max(2, currentPage - delta); i <= Math.min(totalPages - 1, currentPage + delta); i++) {
        range.push(i);
      }

      if (currentPage - delta > 2) {
        rangeWithDots.push(1, '...');
      } else {
        rangeWithDots.push(1);
      }

      rangeWithDots.push(...range);

      if (currentPage + delta < totalPages - 1) {
        rangeWithDots.push('...', totalPages);
      } else if (totalPages > 1) {
        rangeWithDots.push(totalPages);
      }

      return rangeWithDots;
    };

    if (totalPages <= 1) return null;

    return (
      <div className="flex items-center justify-between px-4 py-3 border-t bg-gray-50">
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handlePageChange(1)}
            disabled={currentPage === 1}
            className="h-8 w-8 p-0"
          >
            <ChevronsLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
            className="h-8 w-8 p-0"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
        </div>

        <div className="flex items-center space-x-1">
          {getVisiblePages().map((page, index) => (
            <Button
              key={index}
              variant={page === currentPage ? "default" : "outline"}
              size="sm"
              onClick={() => typeof page === 'number' && handlePageChange(page)}
              disabled={page === '...'}
              className="h-8 w-8 p-0"
            >
              {page}
            </Button>
          ))}
        </div>

        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            className="h-8 w-8 p-0"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handlePageChange(totalPages)}
            disabled={currentPage === totalPages}
            className="h-8 w-8 p-0"
          >
            <ChevronsRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl h-[70vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <MapPin className="h-5 w-5 mr-2" />
            {title}
          </DialogTitle>
          <DialogDescription>
            {description}
          </DialogDescription>
        </DialogHeader>

        {/* Filters */}
        <div className="flex space-x-4 py-4 border-b">
          <div className="flex-1">
            <Label htmlFor="name-filter" className="text-sm font-medium">
              Filter by Name
            </Label>
            <div className="relative mt-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                id="name-filter"
                value={nameFilter}
                onChange={(e) => setNameFilter(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Search by port name..."
                className="pl-10"
              />
            </div>
          </div>
          <div className="flex-1">
            <Label htmlFor="country-filter" className="text-sm font-medium">
              Filter by Country
            </Label>
            <div className="relative mt-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                id="country-filter"
                value={countryFilter}
                onChange={(e) => setCountryFilter(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Search by country..."
                className="pl-10"
              />
            </div>
          </div>
          <div className="flex items-end">
            <Button onClick={handleFilterSubmit} className="h-10">
              Search
            </Button>
          </div>
        </div>

        {/* Results */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="text-muted-foreground">Loading ports...</div>
            </div>
          ) : ports.length > 0 ? (
            <div className="space-y-1">
              {ports.map((port) => (
                <div
                  key={port.id}
                  className="flex items-center justify-between p-3 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-b-0"
                  onClick={() => handleSelect(port)}
                >
                  <div className="flex-1">
                    <div className="font-medium text-sm">{port.name}</div>
                    <div className="text-xs text-muted-foreground">{port.country}</div>
                  </div>   
                </div>
              ))}
            </div>
          ) : (
            <div className="flex items-center justify-center py-8">
              <div className="text-muted-foreground">No ports found</div>
            </div>
          )}
        </div>

        {/* Pagination Controls */}
        <PaginationControls />

        {/* Footer */}
        <div className="flex justify-between items-center pt-4 border-t">
          <div className="text-sm text-muted-foreground">
            Showing {ports.length} of {totalCount.toLocaleString()} ports
            {totalPages > 1 && (
              <span className="ml-2">
                (Page {currentPage} of {totalPages})
              </span>
            )}
          </div>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
