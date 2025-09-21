import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { tenderService } from '../services/tenderService';
import { Tender, SearchFilters } from '../types';
import { useNotification } from '../contexts/NotificationContext';

export const useTenders = (filters: SearchFilters = {}) => {
  return useQuery({
    queryKey: ['tenders', filters],
    queryFn: () => tenderService.getTenders(filters),
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });
};

export const useTender = (id: string) => {
  return useQuery({
    queryKey: ['tender', id],
    queryFn: () => tenderService.getTenderById(id),
    enabled: !!id,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
};

export const useMyTenders = (page: number = 1, limit: number = 10, status?: string) => {
  return useQuery({
    queryKey: ['my-tenders', page, limit, status],
    queryFn: () => tenderService.getMyTenders(page, limit, status),
    staleTime: 30 * 1000, // 30 seconds
  });
};

export const useTrendingTenders = (limit: number = 10) => {
  return useQuery({
    queryKey: ['trending-tenders', limit],
    queryFn: () => tenderService.getTrendingTenders(limit),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

export const useTenderAnalytics = (id: string) => {
  return useQuery({
    queryKey: ['tender-analytics', id],
    queryFn: () => tenderService.getTenderAnalytics(id),
    enabled: !!id,
    staleTime: 1 * 60 * 1000, // 1 minute
  });
};

export const useSearchTenders = () => {
  const { showNotification } = useNotification();
  
  return useMutation({
    mutationFn: ({ query, limit }: { query: string; limit?: number }) =>
      tenderService.searchTenders(query, limit),
    onError: (error: Error) => {
      showNotification('error', 'Search Failed', error.message);
    },
  });
};

export const useCreateTender = () => {
  const queryClient = useQueryClient();
  const { showNotification } = useNotification();

  return useMutation({
    mutationFn: (tenderData: Partial<Tender>) => 
      tenderService.createTender(tenderData),
    onSuccess: (tender) => {
      queryClient.invalidateQueries({ queryKey: ['tenders'] });
      queryClient.invalidateQueries({ queryKey: ['my-tenders'] });
      showNotification('success', 'Tender Created', 'Your tender has been created successfully.');
    },
    onError: (error: Error) => {
      showNotification('error', 'Creation Failed', error.message);
    },
  });
};

export const useUpdateTender = () => {
  const queryClient = useQueryClient();
  const { showNotification } = useNotification();

  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<Tender> }) =>
      tenderService.updateTender(id, updates),
    onSuccess: (tender) => {
      queryClient.invalidateQueries({ queryKey: ['tender', tender._id] });
      queryClient.invalidateQueries({ queryKey: ['tenders'] });
      queryClient.invalidateQueries({ queryKey: ['my-tenders'] });
      showNotification('success', 'Tender Updated', 'Your tender has been updated successfully.');
    },
    onError: (error: Error) => {
      showNotification('error', 'Update Failed', error.message);
    },
  });
};

export const useDeleteTender = () => {
  const queryClient = useQueryClient();
  const { showNotification } = useNotification();

  return useMutation({
    mutationFn: (id: string) => tenderService.deleteTender(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tenders'] });
      queryClient.invalidateQueries({ queryKey: ['my-tenders'] });
      showNotification('success', 'Tender Deleted', 'Your tender has been deleted successfully.');
    },
    onError: (error: Error) => {
      showNotification('error', 'Deletion Failed', error.message);
    },
  });
};

export const useCloseTender = () => {
  const queryClient = useQueryClient();
  const { showNotification } = useNotification();

  return useMutation({
    mutationFn: (id: string) => tenderService.closeTender(id),
    onSuccess: (tender) => {
      queryClient.invalidateQueries({ queryKey: ['tender', tender._id] });
      queryClient.invalidateQueries({ queryKey: ['tenders'] });
      queryClient.invalidateQueries({ queryKey: ['my-tenders'] });
      showNotification('success', 'Tender Closed', 'Your tender has been closed successfully.');
    },
    onError: (error: Error) => {
      showNotification('error', 'Failed to Close', error.message);
    },
  });
};

export const useTenderStats = () => {
  return useQuery({
    queryKey: ['tender-stats'],
    queryFn: () => tenderService.getTenderStats(),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

export const useTenderCategories = () => {
  return useQuery({
    queryKey: ['tender-categories'],
    queryFn: () => tenderService.getCategories(),
    staleTime: 30 * 60 * 1000, // 30 minutes
  });
};

export const useTenderIndustries = () => {
  return useQuery({
    queryKey: ['tender-industries'],
    queryFn: () => tenderService.getIndustries(),
    staleTime: 30 * 60 * 1000, // 30 minutes
  });
};
