import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { proposalService } from '../services/proposalService';
import { Proposal } from '../types';
import { useNotification } from '../contexts/NotificationContext';

export const useProposals = (
  page: number = 1,
  limit: number = 10,
  status?: string,
  tenderId?: string
) => {
  return useQuery({
    queryKey: ['proposals', page, limit, status, tenderId],
    queryFn: () => proposalService.getProposals(page, limit, status, tenderId),
    staleTime: 30 * 1000, // 30 seconds
  });
};

export const useProposal = (id: string) => {
  return useQuery({
    queryKey: ['proposal', id],
    queryFn: () => proposalService.getProposalById(id),
    enabled: !!id,
    staleTime: 1 * 60 * 1000, // 1 minute
  });
};

export const useProposalAnalytics = () => {
  return useQuery({
    queryKey: ['proposal-analytics'],
    queryFn: () => proposalService.getProposalAnalytics(),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

export const useGenerateProposal = () => {
  const queryClient = useQueryClient();
  const { showNotification } = useNotification();

  return useMutation({
    mutationFn: ({
      tenderId,
      userRequirements,
      customSections,
    }: {
      tenderId: string;
      userRequirements?: any;
      customSections?: any[];
    }) => proposalService.generateProposal(tenderId, userRequirements, customSections),
    onSuccess: (proposal) => {
      queryClient.invalidateQueries({ queryKey: ['proposals'] });
      showNotification(
        'success',
        'Proposal Generated',
        'Your AI proposal has been generated successfully.'
      );
    },
    onError: (error: Error) => {
      showNotification('error', 'Generation Failed', error.message);
    },
  });
};

export const useGenerateWatermarkedDemo = () => {
  const { showNotification } = useNotification();

  return useMutation({
    mutationFn: (tenderId: string) => proposalService.generateWatermarkedDemo(tenderId),
    onError: (error: Error) => {
      showNotification('error', 'Demo Generation Failed', error.message);
    },
  });
};

export const useUpdateProposal = () => {
  const queryClient = useQueryClient();
  const { showNotification } = useNotification();

  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<Proposal> }) =>
      proposalService.updateProposal(id, updates),
    onSuccess: (proposal) => {
      queryClient.invalidateQueries({ queryKey: ['proposal', proposal._id] });
      queryClient.invalidateQueries({ queryKey: ['proposals'] });
      showNotification('success', 'Proposal Updated', 'Your proposal has been updated successfully.');
    },
    onError: (error: Error) => {
      showNotification('error', 'Update Failed', error.message);
    },
  });
};

export const useSubmitProposal = () => {
  const queryClient = useQueryClient();
  const { showNotification } = useNotification();

  return useMutation({
    mutationFn: (id: string) => proposalService.submitProposal(id),
    onSuccess: (proposal) => {
      queryClient.invalidateQueries({ queryKey: ['proposal', proposal._id] });
      queryClient.invalidateQueries({ queryKey: ['proposals'] });
      showNotification('success', 'Proposal Submitted', 'Your proposal has been submitted successfully.');
    },
    onError: (error: Error) => {
      showNotification('error', 'Submission Failed', error.message);
    },
  });
};

export const useWithdrawProposal = () => {
  const queryClient = useQueryClient();
  const { showNotification } = useNotification();

  return useMutation({
    mutationFn: (id: string) => proposalService.withdrawProposal(id),
    onSuccess: (proposal) => {
      queryClient.invalidateQueries({ queryKey: ['proposal', proposal._id] });
      queryClient.invalidateQueries({ queryKey: ['proposals'] });
      showNotification('success', 'Proposal Withdrawn', 'Your proposal has been withdrawn successfully.');
    },
    onError: (error: Error) => {
      showNotification('error', 'Withdrawal Failed', error.message);
    },
  });
};

export const useDeleteProposal = () => {
  const queryClient = useQueryClient();
  const { showNotification } = useNotification();

  return useMutation({
    mutationFn: (id: string) => proposalService.deleteProposal(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['proposals'] });
      showNotification('success', 'Proposal Deleted', 'Your proposal has been deleted successfully.');
    },
    onError: (error: Error) => {
      showNotification('error', 'Deletion Failed', error.message);
    },
  });
};

export const useDownloadProposal = () => {
  const { showNotification } = useNotification();

  return useMutation({
    mutationFn: ({ id, format }: { id: string; format?: 'pdf' | 'docx' }) =>
      proposalService.downloadProposal(id, format),
    onSuccess: () => {
      showNotification('success', 'Download Started', 'Your proposal download has started.');
    },
    onError: (error: Error) => {
      showNotification('error', 'Download Failed', error.message);
    },
  });
};

export const useProposalTemplates = () => {
  return useQuery({
    queryKey: ['proposal-templates'],
    queryFn: () => proposalService.getTemplates(),
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
};

export const useSaveAsTemplate = () => {
  const queryClient = useQueryClient();
  const { showNotification } = useNotification();

  return useMutation({
    mutationFn: ({ proposalId, templateName }: { proposalId: string; templateName: string }) =>
      proposalService.saveAsTemplate(proposalId, templateName),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['proposal-templates'] });
      showNotification('success', 'Template Saved', 'Your proposal has been saved as a template.');
    },
    onError: (error: Error) => {
      showNotification('error', 'Save Failed', error.message);
    },
  });
};

export const useProposalFeedback = (id: string) => {
  return useQuery({
    queryKey: ['proposal-feedback', id],
    queryFn: () => proposalService.getProposalFeedback(id),
    enabled: !!id,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
};

export const useProposalComparison = (proposalId: string) => {
  return useQuery({
    queryKey: ['proposal-comparison', proposalId],
    queryFn: () => proposalService.getProposalComparison(proposalId),
    enabled: !!proposalId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

export const useContentSuggestions = () => {
  const { showNotification } = useNotification();

  return useMutation({
    mutationFn: ({
      tenderId,
      section,
      currentContent,
      context,
    }: {
      tenderId: string;
      section: string;
      currentContent?: string;
      context?: any;
    }) => proposalService.getContentSuggestions(tenderId, section, currentContent, context),
    onError: (error: Error) => {
      showNotification('error', 'Suggestions Failed', error.message);
    },
  });
};

export const useOptimizeContent = () => {
  const { showNotification } = useNotification();

  return useMutation({
    mutationFn: ({
      proposalId,
      section,
      content,
    }: {
      proposalId: string;
      section: string;
      content: string;
    }) => proposalService.optimizeContent(proposalId, section, content),
    onError: (error: Error) => {
      showNotification('error', 'Optimization Failed', error.message);
    },
  });
};
