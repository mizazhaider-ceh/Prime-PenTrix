'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { Tool, ToolCategory, TOOL_CATEGORIES } from '@/types/tools';
import { TOOLS, getToolsByCategory, getToolsBySubject, searchTools } from '@/lib/tools/registry';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Search, Grid3x3, Star, Clock, Sparkles, ArrowLeft } from 'lucide-react';
import ToolExecutor from './ToolExecutor';

interface ToolsTabProps {
  subjectCode: string;
  subjectId: string;
}

export default function ToolsTab({ subjectCode, subjectId }: ToolsTabProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<ToolCategory | 'all' | 'recommended'>('recommended');
  const [selectedTool, setSelectedTool] = useState<Tool | null>(null);
  const [recentTools, setRecentTools] = useState<string[]>(() => {
    if (typeof window === 'undefined') return [];
    try {
      const recent = localStorage.getItem('recentTools');
      return recent ? JSON.parse(recent) : [];
    } catch {
      return [];
    }
  });
  const [favoriteTools, setFavoriteTools] = useState<string[]>(() => {
    if (typeof window === 'undefined') return [];
    try {
      const favorites = localStorage.getItem('favoriteTools');
      return favorites ? JSON.parse(favorites) : [];
    } catch {
      return [];
    }
  });

  // Memoize filtered tools
  const filteredTools = useMemo((): Tool[] => {
    let tools: Tool[] = [];
    if (searchQuery) {
      tools = searchTools(searchQuery);
    } else if (selectedCategory === 'recommended') {
      tools = getToolsBySubject(subjectCode);
    } else if (selectedCategory === 'all') {
      tools = TOOLS;
    } else {
      tools = getToolsByCategory(selectedCategory);
    }
    return [...tools].sort((a, b) => a.priority - b.priority);
  }, [searchQuery, selectedCategory, subjectCode]);

  const handleSelectTool = useCallback((tool: Tool) => {
    setSelectedTool(tool);
    setRecentTools(prev => {
      const updated = [tool.id, ...prev.filter((id) => id !== tool.id)].slice(0, 5);
      localStorage.setItem('recentTools', JSON.stringify(updated));
      return updated;
    });
  }, []);

  const toggleFavorite = useCallback((toolId: string) => {
    setFavoriteTools(prev => {
      const updated = prev.includes(toolId)
        ? prev.filter((id) => id !== toolId)
        : [...prev, toolId];
      localStorage.setItem('favoriteTools', JSON.stringify(updated));
      return updated;
    });
  }, []);

  const getPriorityBadge = (priority: number) => {
    const badges: Record<number, { label: string; variant: 'default' | 'secondary' | 'outline' }> = {
      1: { label: 'Essential', variant: 'default' },
      2: { label: 'Important', variant: 'secondary' },
      3: { label: 'Utility', variant: 'outline' },
    };
    return badges[priority] || badges[3];
  };

  const getCategoryColor = (category: ToolCategory) => {
    return TOOL_CATEGORIES[category]?.color || '#666';
  };

  const handleCategoryChange = useCallback((v: string) => {
    setSelectedCategory(v as ToolCategory | 'all' | 'recommended');
  }, []);

  return (
    <div className="flex h-full overflow-hidden">
      {/* Left Sidebar — full width on mobile, fixed on desktop */}
      <div className={`${selectedTool ? 'hidden md:flex' : 'flex'} w-full md:w-80 lg:w-96 flex-shrink-0 min-h-0 border-r border-border/20 flex-col`}>
        {/* Search */}
        <div className="flex-shrink-0 p-3 sm:p-4 border-b border-border/20">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search tools..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
              aria-label="Search tools"
            />
          </div>
        </div>

        {/* Category Tabs — horizontally scrollable */}
        <div className="flex-shrink-0 border-b border-border/20 overflow-x-auto scrollbar-none">
          <Tabs value={selectedCategory} onValueChange={handleCategoryChange} className="w-full">
            <TabsList className="w-max justify-start gap-1 rounded-none border-0 bg-transparent p-2">
              <TabsTrigger value="recommended" className="gap-1.5 text-xs whitespace-nowrap">
                <Sparkles className="h-3 w-3" />
                For You
              </TabsTrigger>
              <TabsTrigger value="all" className="text-xs whitespace-nowrap">
                All
              </TabsTrigger>
              {Object.entries(TOOL_CATEGORIES).map(([key, { name }]) => (
                <TabsTrigger key={key} value={key} className="text-xs whitespace-nowrap">
                  {name}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
        </div>

        {/* Quick Access */}
        {!searchQuery && selectedCategory === 'recommended' && recentTools.length > 0 && (
          <div className="flex-shrink-0 border-b border-border/20 p-3">
            <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
              <Clock className="h-3 w-3" />
              Recent
            </div>
            <div className="flex flex-wrap gap-1">
              {recentTools.slice(0, 3).map((toolId) => {
                const tool = TOOLS.find((t) => t.id === toolId);
                if (!tool) return null;
                return (
                  <Button key={toolId} variant="outline" size="sm" className="h-7 text-xs" onClick={() => handleSelectTool(tool)}>
                    {tool.name}
                  </Button>
                );
              })}
            </div>
          </div>
        )}

        {/* Tool List — native overflow scroll for reliable mobile support */}
        <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar">
          <div className="p-2 space-y-1">
            {filteredTools.length === 0 ? (
              <div className="p-8 text-center text-sm text-muted-foreground">
                {searchQuery ? `No tools found matching "${searchQuery}"` : 'No tools available for this category'}
              </div>
            ) : (
              filteredTools.map((tool) => {
                const isFavorite = favoriteTools.includes(tool.id);
                const isSelected = selectedTool?.id === tool.id;
                const priority = getPriorityBadge(tool.priority);
                return (
                  <Card
                    key={tool.id}
                    className={`p-3 cursor-pointer transition-all hover:bg-accent ${isSelected ? 'bg-accent border-primary' : ''}`}
                    onClick={() => handleSelectTool(tool)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handleSelectTool(tool); } }}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-medium text-sm truncate">{tool.name}</h4>
                          <Badge variant={priority.variant} className="text-[10px] h-4 px-1.5 flex-shrink-0">
                            {priority.label}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground line-clamp-2">{tool.description}</p>
                        <div className="flex items-center gap-2 mt-2">
                          <Badge
                            variant="outline"
                            className="text-[10px] h-4 px-1.5"
                            style={{ borderColor: getCategoryColor(tool.category), color: getCategoryColor(tool.category) }}
                          >
                            {TOOL_CATEGORIES[tool.category].name}
                          </Badge>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        className={`h-7 w-7 p-0 flex-shrink-0 ${isFavorite ? 'text-yellow-500' : 'text-muted-foreground'}`}
                        onClick={(e) => { e.stopPropagation(); toggleFavorite(tool.id); }}
                        aria-label={isFavorite ? `Remove ${tool.name} from favorites` : `Add ${tool.name} to favorites`}
                      >
                        <Star className={`h-3.5 w-3.5 ${isFavorite ? 'fill-current' : ''}`} />
                      </Button>
                    </div>
                  </Card>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Right Content: Tool Executor or empty state */}
      <div className={`${selectedTool ? 'flex' : 'hidden md:flex'} flex-1 flex-col min-w-0 min-h-0 overflow-hidden`}>
        {selectedTool ? (
          <div className="flex h-full flex-col">
            {/* Mobile back button */}
            <div className="md:hidden flex-shrink-0 border-b border-border/20 p-2">
              <Button variant="ghost" size="sm" onClick={() => setSelectedTool(null)} className="gap-2 text-muted-foreground">
                <ArrowLeft className="h-4 w-4" />
                Back to Tools
              </Button>
            </div>
            <div className="flex-1 min-h-0 overflow-hidden">
              <ToolExecutor tool={selectedTool} subjectId={subjectId} onClose={() => setSelectedTool(null)} />
            </div>
          </div>
        ) : (
          <div className="flex h-full items-center justify-center p-4">
            <div className="text-center">
              <div className="mx-auto mb-5 flex h-16 w-16 sm:h-20 sm:w-20 items-center justify-center rounded-2xl bg-primary/5">
                <Grid3x3 className="h-8 w-8 sm:h-10 sm:w-10 text-muted-foreground/50" />
              </div>
              <h3 className="mb-2 font-outfit text-lg sm:text-xl font-bold">Select a Tool</h3>
              <p className="text-sm text-muted-foreground mb-4">
                {filteredTools.length} tools available
              </p>
              <Badge variant="outline" className="text-xs">
                {getToolsBySubject(subjectCode).length} recommended for this subject
              </Badge>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
