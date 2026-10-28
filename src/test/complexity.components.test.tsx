import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ComplexityPanel } from '../features/complexity/components/ComplexityPanel';
import { ComplexityBadge } from '../features/complexity/components/ComplexityBadge';
import { ComparisonBanner } from '../features/complexity/components/ComparisonBanner';
import { complexityClient } from '../features/complexity/service/complexity.client';

describe('Complexity Feature UI Components', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  describe('ComplexityBadge', () => {
    it('renders label, Big-O value, and classification', () => {
      render(
        <ComplexityBadge
          label="Time Complexity"
          value="O(n)"
          classification="linear"
          confidence="high"
          subtitle="Worst case: O(n)"
        />
      );

      expect(screen.getByText('Time Complexity')).toBeInTheDocument();
      expect(screen.getByText('O(n)')).toBeInTheDocument();
      expect(screen.getByText('(linear)')).toBeInTheDocument();
      expect(screen.getByText('high conf')).toBeInTheDocument();
      expect(screen.getByText('Worst case: O(n)')).toBeInTheDocument();
    });
  });

  describe('ComparisonBanner', () => {
    it('renders consistent status correctly', () => {
      render(
        <ComparisonBanner
          comparison={{
            status: 'consistent',
            explanation: 'Both AI and static AST analyzer identify linear traversal.',
            staticEstimate: { time: 'O(n)', space: 'O(1)' },
            aiEstimate: { time: 'O(n)', space: 'O(1)' },
          }}
        />
      );

      expect(screen.getByText(/Hybrid Consensus: AI & Static Analyzer Agree/i)).toBeInTheDocument();
      expect(screen.getByText(/Both AI and static AST analyzer identify linear traversal/i)).toBeInTheDocument();
    });

    it('renders disagreement status and compares estimates', () => {
      render(
        <ComparisonBanner
          comparison={{
            status: 'disagreement',
            explanation: 'AI detected logarithmic step while AST defaulted to linear.',
            staticEstimate: { time: 'O(n)', space: 'O(1)' },
            aiEstimate: { time: 'O(log n)', space: 'O(1)' },
          }}
        />
      );

      expect(screen.getByText(/Analyzer Disagreement Identified/i)).toBeInTheDocument();
      expect(screen.getByText('O(log n)')).toBeInTheDocument();
    });
  });

  describe('ComplexityPanel', () => {
    it('renders idle state with prompt to analyze', () => {
      render(<ComplexityPanel code="const x = 1;" />);
      expect(screen.getByText(/No Complexity Analysis Yet/i)).toBeInTheDocument();
      expect(screen.getByText(/Analyze Current Code/i)).toBeInTheDocument();
    });

    it('successfully triggers analysis and displays results', async () => {
      const mockResult = {
        success: true,
        analysisId: 'test-123',
        timeComplexity: {
          value: 'O(n)',
          classification: 'linear' as const,
          confidence: 'high' as const,
          explanation: 'Traverses array once.',
        },
        spaceComplexity: {
          value: 'O(1)',
          classification: 'constant' as const,
          confidence: 'high' as const,
          explanation: 'No extra memory.',
        },
        outputSpaceComplexity: null,
        bestCase: null,
        worstCase: { value: 'O(n)', explanation: 'Linear scan' },
        confidence: 'high' as const,
        summary: 'Algorithm runs in O(n) time and O(1) space.',
        detectedPatterns: ['single_loop'],
        reasoning: ['Iterates elements 0 to n-1', 'Accumulator holds scalar value'],
        bottlenecks: [
          {
            title: 'Linear search',
            description: 'Can be replaced with set lookup',
            impact: 'medium' as const,
          },
        ],
        optimizations: [
          {
            title: 'Use Set',
            description: 'Reduces lookup to O(1)',
            currentComplexity: 'O(n)',
            optimizedComplexity: 'O(1)',
            tradeOffs: 'Higher auxiliary space',
          },
        ],
        assumptions: ['n is array length'],
        warnings: [],
        staticAnalysisComparison: {
          status: 'consistent' as const,
          explanation: 'Static analyzer also sees single loop.',
          staticEstimate: { time: 'O(n)', space: 'O(1)' },
          aiEstimate: { time: 'O(n)', space: 'O(1)' },
        },
        modelMetadata: {
          model: 'meta-llama/llama-3.3-70b-instruct:free',
          provider: 'OpenRouter',
          cached: false,
          durationMs: 450,
        },
      };

      vi.spyOn(complexityClient, 'analyze').mockResolvedValueOnce(mockResult);

      const { rerender } = render(<ComplexityPanel code="for(let i=0; i<n; i++) {}" />);

      const analyzeBtn = screen.getByRole('button', { name: /Analyze Current Code/i });
      fireEvent.click(analyzeBtn);

      await waitFor(() => {
        expect(screen.getByText('Algorithm runs in O(n) time and O(1) space.')).toBeInTheDocument();
      });

      expect(screen.getByText('Iterates elements 0 to n-1')).toBeInTheDocument();
      expect(screen.getByText('Linear search')).toBeInTheDocument();
      expect(screen.getByText('Use Set')).toBeInTheDocument();

      // Test staleness: rerender with changed code
      rerender(<ComplexityPanel code="for(let i=0; i<n; i++) { for(let j=0; j<n; j++) {} }" />);

      expect(screen.getByText(/Code has been modified. Results may be outdated./i)).toBeInTheDocument();
    });

    it('displays error message when analysis fails', async () => {
      vi.spyOn(complexityClient, 'analyze').mockRejectedValueOnce(
        new Error('Network connection lost')
      );

      render(<ComplexityPanel code="const a = 1;" />);

      const analyzeBtn = screen.getByRole('button', { name: /Analyze Current Code/i });
      fireEvent.click(analyzeBtn);

      await waitFor(() => {
        expect(screen.getByText(/Network connection lost/i)).toBeInTheDocument();
      });

      expect(screen.getByRole('button', { name: /Retry Analysis/i })).toBeInTheDocument();
    });
  });
});
