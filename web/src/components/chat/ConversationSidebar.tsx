'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import { useChatStore } from '@/store/chatStore';
import { useChatActions } from '@/hooks/useChatActions';
import { Plus, Search, Filter, MessageSquare, Trash2, Edit2, Check, X, Download, MoreVertical, AlertCircle, Loader2 } from 'lucide-react';
import { ConversationExporter } from '@/lib/export';

interface ConversationSidebarProps {
  subjectId?: string;
}

export default function ConversationSidebar({ subjectId }: ConversationSidebarProps = {}) {
  const {
    conversations,
    currentConversation,
    isLoadingConversations,
    filterSubjectId,
    filterMode,
    searchQuery,
    timeFilter,
    setFilterSubjectId,
    setFilterMode,
    setSearchQuery,
    setTimeFilter,
  } = useChatStore();

  const {
    fetchConversations,
    fetchConversation,
    createConversation,
    updateConversationTitle,
    removeConversation,
  } = useChatActions();

  const [isFiltersOpen, setIsFiltersOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [subjects, setSubjects] = useState<any[]>([]);
  const [exportMenuOpen, setExportMenuOpen] = useState<string | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isCreatingConversation, setIsCreatingConversation] = useState(false);

  // Memoize subject filter value
  const effectiveSubjectId = useMemo(
    () => filterSubjectId || subjectId,
    [filterSubjectId, subjectId]
  );

  // Fetch subjects for filter with error handling
  useEffect(() => {
    let mounted = true;
    const fetchSubjects = async () => {
      try {
        const response = await fetch('/api/subjects');
        if (response.ok && mounted) {
          const data = await response.json();
          setSubjects(Array.isArray(data) ? data : data.subjects || []);
          setLoadError(null);
        }
      } catch (error) {
        console.error('Error fetching subjects:', error);
        if (mounted) {
          setLoadError('Failed to load subjects');
        }
      }
    };
    fetchSubjects();
    return () => { mounted = false; };
  }, []);

  // Auto-set subject filter when embedded in workspace
  useEffect(() => {
    if (subjectId && !filterSubjectId) {
      setFilterSubjectId(subjectId);
    }
  }, [subjectId]);

  // Fetch conversations on mount and filter changes with debounce for search
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      fetchConversations({
        subjectId: effectiveSubjectId || undefined,
        mode: filterMode || undefined,
        search: searchQuery || undefined,
        timeFilter: timeFilter,
      });
    }, searchQuery ? 300 : 0); // Debounce search by 300ms

    return () => clearTimeout(timeoutId);
  }, [effectiveSubjectId, filterMode, searchQuery, timeFilter, fetchConversations]);

  const handleCreateConversation = useCallback(async () => {
    const targetSubjectId = subjectId || (subjects.length ? subjects[0].id : null);
    if (!targetSubjectId) {
      setLoadError('No subject available');
      return;
    }
    
    if (isCreatingConversation) return; // Prevent spam clicking
    
    try {
      setIsCreatingConversation(true);
      setLoadError(null);
      const newConv = await createConversation({
        title: 'New Conversation',
        subjectId: targetSubjectId,
        mode: 'chat',
      });
      
      await fetchConversation(newConv.id);
    } catch (error) {
      console.error('Error creating conversation:', error);
      setLoadError('Failed to create conversation');
    } finally {
      setIsCreatingConversation(false);
    }
  }, [subjectId, subjects, createConversation, fetchConversation, isCreatingConversation]);

  const handleSelectConversation = useCallback(async (id: string) => {
    if (!id || id === currentConversation?.id) return;
    
    try {
      setLoadError(null);
      await fetchConversation(id);
    } catch (error) {
      console.error('Error selecting conversation:', error);
      setLoadError('Failed to load conversation');
    }
  }, [currentConversation?.id, fetchConversation]);

  const handleDeleteConversation = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    
    if (!confirm('Delete this conversation?')) return;
    
    try {
      await removeConversation(id);
    } catch (error) {
      console.error('Error deleting conversation:', error);
    }
  };

  const startEditing = (id: string, title: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingId(id);
    setEditTitle(title);
  };

  const saveEdit = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    
    if (!editTitle.trim()) {
      setEditingId(null);
      return;
    }
    
    try {
      await updateConversationTitle(id, editTitle.trim());
      setEditingId(null);
    } catch (error) {
      console.error('Error updating conversation:', error);
    }
  };

  const cancelEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingId(null);
    setEditTitle('');
  };

  const handleExport = async (id: string, format: 'json' | 'markdown' | 'html', e: React.MouseEvent) => {
    e.stopPropagation();
    setExportMenuOpen(null);
    
    try {
      await ConversationExporter.exportConversation(id, format);
    } catch (error) {
      console.error('Error exporting conversation:', error);
      alert('Failed to export conversation');
    }
  };

  const formatDate = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - new Date(date).getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    
    if (days === 0) return 'Today';
    if (days === 1) return 'Yesterday';
    if (days < 7) return `${days}d ago`;
    if (days < 30) return `${Math.floor(days / 7)}w ago`;
    return `${Math.floor(days / 30)}mo ago`;
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex-shrink-0 max-h-[45%] overflow-y-auto custom-scrollbar p-4 border-b border-border/20">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-outfit text-sm font-bold tracking-tight text-foreground">
            Conversations
          </h2>
          <button
            onClick={handleCreateConversation}
            disabled={isCreatingConversation}
            className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary hover:bg-primary/20 transition-all duration-200 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
            title="New Conversation"
          >
            {isCreatingConversation ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <Plus size={16} />
            )}
          </button>
        </div>

        {/* Error Display */}
        {loadError && (
          <div className="mb-2 p-2 rounded-lg bg-destructive/10 border border-destructive/20 animate-fade-in-down">
            <div className="flex items-center gap-2 text-xs text-destructive">
              <AlertCircle size={14} />
              <span>{loadError}</span>
              <button
                onClick={() => setLoadError(null)}
                className="ml-auto hover:opacity-70 transition-opacity"
                aria-label="Dismiss error"
              >
                <X size={14} />
              </button>
            </div>
          </div>
        )}

        {/* Search */}
        <div className="relative mb-2">
          <Search
            size={14}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
          />
          <input
            type="text"
            placeholder="Search..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 rounded-lg border border-border/30 bg-card/50 text-foreground text-xs placeholder:text-muted-foreground/60 focus:outline-none focus:ring-1 focus:ring-primary/50 focus:border-primary/30 transition-all"
          />
        </div>

        {/* Filter Toggle */}
        <button
          onClick={() => setIsFiltersOpen(!isFiltersOpen)}
          className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          <Filter size={12} />
          <span>Filters</span>
          {(filterSubjectId || filterMode || timeFilter !== 'all') && (
            <span className="px-1.5 py-0.5 rounded-full bg-primary/15 text-primary text-[10px] font-medium">
              Active
            </span>
          )}
        </button>

        {/* Filters Panel */}
        {isFiltersOpen && (
          <div className="mt-2 space-y-2 p-3 rounded-lg border border-border/20 bg-card/30 animate-fade-in-scale">
            {/* Subject Filter */}
            <div>
              <label className="block text-[10px] font-medium uppercase tracking-wider text-muted-foreground mb-1">
                Subject
              </label>
              <select
                value={filterSubjectId || ''}
                onChange={(e) => setFilterSubjectId(e.target.value || null)}
                className="w-full px-2.5 py-1.5 rounded-lg border border-border/30 bg-card/50 text-foreground text-xs focus:outline-none focus:ring-1 focus:ring-primary/50"
              >
                <option value="">All</option>
                {subjects.map((subject) => (
                  <option key={subject.id} value={subject.id}>
                    {subject.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Mode Filter */}
            <div>
              <label className="block text-[10px] font-medium uppercase tracking-wider text-muted-foreground mb-1">
                Mode
              </label>
              <select
                value={filterMode || ''}
                onChange={(e) => setFilterMode(e.target.value || null)}
                className="w-full px-2.5 py-1.5 rounded-lg border border-border/30 bg-card/50 text-foreground text-xs focus:outline-none focus:ring-1 focus:ring-primary/50"
              >
                <option value="">All</option>
                <option value="learn">Learn</option>
                <option value="chat">Chat</option>
                <option value="quiz">Quiz</option>
                <option value="explain">Explain</option>
              </select>
            </div>

            {/* Time Filter */}
            <div>
              <label className="block text-[10px] font-medium uppercase tracking-wider text-muted-foreground mb-1">
                Time
              </label>
              <select
                value={timeFilter}
                onChange={(e) => setTimeFilter(e.target.value as 'all' | 'today' | 'week' | 'month')}
                className="w-full px-2.5 py-1.5 rounded-lg border border-border/30 bg-card/50 text-foreground text-xs focus:outline-none focus:ring-1 focus:ring-primary/50"
              >
                <option value="all">All Time</option>
                <option value="today">Today</option>
                <option value="week">This Week</option>
                <option value="month">This Month</option>
              </select>
            </div>

            {/* Clear Filters */}
            {(filterSubjectId || filterMode || timeFilter !== 'all') && (
              <button
                onClick={() => {
                  setFilterSubjectId(null);
                  setFilterMode(null);
                  setTimeFilter('all');
                }}
                className="w-full px-2.5 py-1.5 rounded-lg border border-border/30 text-xs text-muted-foreground hover:text-foreground hover:bg-card/50 transition-colors"
              >
                Clear Filters
              </button>
            )}
          </div>
        )}
      </div>

      {/* Conversations List */}
      <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar">
        {isLoadingConversations ? (
          <div className="flex items-center justify-center h-32">
            <div className="typing-indicator">
              <span></span><span></span><span></span>
            </div>
          </div>
        ) : conversations.filter(c => c.mode !== 'doc-chat').length === 0 ? (
          <div className="flex flex-col items-center justify-center h-32 text-muted-foreground">
            <MessageSquare size={24} className="mb-2 opacity-30" />
            <p className="text-xs">No conversations yet</p>
            <p className="text-[10px] mt-1 opacity-60">Create one to get started</p>
          </div>
        ) : (
          <div className="p-2 space-y-0.5">
            {conversations.filter(c => c.mode !== 'doc-chat').map((conv) => (
              <div
                key={conv.id}
                onClick={() => handleSelectConversation(conv.id)}
                className={`group relative rounded-xl px-3 py-2.5 cursor-pointer transition-all duration-200 ${
                  currentConversation?.id === conv.id
                    ? 'bg-primary/10 border border-primary/20'
                    : 'hover:bg-card/50 border border-transparent'
                }`}
              >
                <div className="flex items-start justify-between gap-2 mb-1">
                  {editingId === conv.id ? (
                    <div className="flex items-center gap-1.5 flex-1">
                      <input
                        type="text"
                        value={editTitle}
                        onChange={(e) => setEditTitle(e.target.value)}
                        onClick={(e) => e.stopPropagation()}
                        className="flex-1 px-2 py-1 text-xs rounded-lg border border-primary/30 bg-card/50 text-foreground focus:outline-none focus:ring-1 focus:ring-primary/50"
                        autoFocus
                      />
                      <button
                        onClick={(e) => saveEdit(conv.id, e)}
                        className="p-1 rounded-md text-primary hover:bg-primary/10"
                      >
                        <Check size={12} />
                      </button>
                      <button
                        onClick={cancelEdit}
                        className="p-1 rounded-md text-destructive hover:bg-destructive/10"
                      >
                        <X size={12} />
                      </button>
                    </div>
                  ) : (
                    <>
                      <h3 className={`flex-1 text-xs font-medium line-clamp-1 transition-colors ${
                        currentConversation?.id === conv.id ? 'text-primary' : 'text-foreground'
                      }`}>
                        {conv.title}
                      </h3>
                      <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={(e) => startEditing(conv.id, conv.title, e)}
                          className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-card/80 transition-colors"
                          title="Rename"
                        >
                          <Edit2 size={11} />
                        </button>
                        
                        {/* Export Menu */}
                        <div className="relative">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setExportMenuOpen(exportMenuOpen === conv.id ? null : conv.id);
                            }}
                            className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-card/80 transition-colors"
                            title="Export"
                          >
                            <Download size={11} />
                          </button>
                          
                          {exportMenuOpen === conv.id && (
                            <div className="absolute right-0 mt-1 w-32 glass rounded-lg shadow-xl border border-border/30 z-10 animate-fade-in-scale">
                              {['json', 'markdown', 'html'].map((fmt) => (
                                <button
                                  key={fmt}
                                  onClick={(e) => handleExport(conv.id, fmt as any, e)}
                                  className="w-full px-3 py-1.5 text-left text-xs text-muted-foreground hover:text-foreground hover:bg-primary/5 first:rounded-t-lg last:rounded-b-lg transition-colors"
                                >
                                  {fmt.toUpperCase()}
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                        
                        <button
                          onClick={(e) => handleDeleteConversation(conv.id, e)}
                          className="p-1 rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                          title="Delete"
                        >
                          <Trash2 size={11} />
                        </button>
                      </div>
                    </>
                  )}
                </div>

                <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground/70">
                  <span className="capitalize">{conv.mode}</span>
                  <span className="opacity-40">•</span>
                  <span className="truncate">{conv.subject.name}</span>
                  <span className="ml-auto opacity-60">{formatDate(conv.updatedAt)}</span>
                </div>

                {conv._count?.messages > 0 && (
                  <div className="mt-0.5 text-[10px] text-muted-foreground/50">
                    {conv._count.messages} msg{conv._count.messages !== 1 ? 's' : ''}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
