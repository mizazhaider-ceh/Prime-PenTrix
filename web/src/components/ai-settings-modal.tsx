'use client';

import { useState, useEffect } from 'react';
import { Settings, Sparkles, Cpu, Brain, Zap } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';

// ═══════════════════════════════════════════════════════════════
// AI MODEL CONFIGURATIONS
// ═══════════════════════════════════════════════════════════════

interface ModelConfig {
  id: string;
  name: string;
  description: string;
  badge?: string;
  badgeVariant?: 'default' | 'secondary' | 'destructive' | 'outline';
}

interface ProviderConfig {
  id: string;
  name: string;
  icon: typeof Cpu;
  models: ModelConfig[];
  color: string;
}

const AI_PROVIDERS: ProviderConfig[] = [
  {
    id: 'cerebras',
    name: 'Cerebras',
    icon: Zap,
    color: '#10b981',
    models: [
      {
        id: 'llama-3.3-70b',
        name: 'Llama 3.3 70B',
        description: 'Fast, free inference',
        badge: 'FREE',
        badgeVariant: 'default',
      },
      {
        id: 'llama3.1-8b',
        name: 'Llama 3.1 8B',
        description: 'Lightweight, ultra-fast',
        badge: 'FAST',
        badgeVariant: 'secondary',
      },
    ],
  },
  {
    id: 'gemini',
    name: 'Google Gemini',
    icon: Brain,
    color: '#8b5cf6',
    models: [
      {
        id: 'gemini-1.5-flash',
        name: 'Gemini 1.5 Flash',
        description: 'Fast, multimodal capabilities',
        badge: 'MULTIMODAL',
        badgeVariant: 'outline',
      },
      {
        id: 'gemini-1.5-pro',
        name: 'Gemini 1.5 Pro',
        description: 'Most capable Google model',
        badge: 'PRO',
        badgeVariant: 'secondary',
      },
    ],
  },
  {
    id: 'openai',
    name: 'OpenAI',
    icon: Sparkles,
    color: '#f59e0b',
    models: [
      {
        id: 'gpt-5.2',
        name: 'GPT-5.2',
        description: 'Best for coding & agentic tasks',
        badge: 'FLAGSHIP',
        badgeVariant: 'default',
      },
      {
        id: 'gpt-5-mini',
        name: 'GPT-5 Mini',
        description: 'Faster, cost-efficient version',
        badge: 'FAST',
        badgeVariant: 'secondary',
      },
      {
        id: 'gpt-4.1',
        name: 'GPT-4.1',
        description: 'Smartest non-reasoning model',
        badge: 'SMART',
        badgeVariant: 'outline',
      },
      {
        id: 'gpt-4o',
        name: 'GPT-4o',
        description: 'Fast, intelligent, flexible',
        badge: 'BALANCED',
        badgeVariant: 'outline',
      },
      {
        id: 'gpt-4o-mini',
        name: 'GPT-4o Mini',
        description: 'Fast, affordable for focused tasks',
        badge: 'AFFORDABLE',
        badgeVariant: 'secondary',
      },
    ],
  },
];

// ═══════════════════════════════════════════════════════════════
// STORAGE KEYS
// ═══════════════════════════════════════════════════════════════

const STORAGE_KEY_PROVIDER = 'ai-settings-provider';
const STORAGE_KEY_MODEL = 'ai-settings-model';

// ═══════════════════════════════════════════════════════════════
// COMPONENT
// ═══════════════════════════════════════════════════════════════

export function AISettingsModal() {
  const [open, setOpen] = useState(false);
  const [selectedProvider, setSelectedProvider] = useState<string>('cerebras');
  const [selectedModel, setSelectedModel] = useState<string>('llama-3.3-70b');
  const [mounted, setMounted] = useState(false);
  const [providerStatus, setProviderStatus] = useState<Record<string, boolean>>({});

  // Load preferences from localStorage on mount
  useEffect(() => {
    setMounted(true);
    const savedProvider = localStorage.getItem(STORAGE_KEY_PROVIDER);
    const savedModel = localStorage.getItem(STORAGE_KEY_MODEL);
    
    if (savedProvider) setSelectedProvider(savedProvider);
    if (savedModel) setSelectedModel(savedModel);

    // Fetch which providers actually have valid API keys
    fetch('/api/ai-providers')
      .then((res) => res.json())
      .then((data) => setProviderStatus(data.providers || {}))
      .catch(() => {}); // silently fail
  }, []);

  // Save preferences whenever they change
  useEffect(() => {
    if (!mounted) return;
    
    localStorage.setItem(STORAGE_KEY_PROVIDER, selectedProvider);
    localStorage.setItem(STORAGE_KEY_MODEL, selectedModel);

    // Dispatch custom event so chat components can react
    window.dispatchEvent(new CustomEvent('ai-settings-changed', {
      detail: { provider: selectedProvider, model: selectedModel },
    }));
  }, [selectedProvider, selectedModel, mounted]);

  const currentProvider = AI_PROVIDERS.find(p => p.id === selectedProvider);
  const currentModels = currentProvider?.models || [];
  const ProviderIcon = currentProvider?.icon || Cpu;

  // Reset model when provider changes — auto-redirect to available provider if selected one has no key
  const handleProviderChange = (providerId: string) => {
    // If the selected provider has no valid key, redirect to first available
    if (Object.keys(providerStatus).length > 0 && providerStatus[providerId] === false) {
      const firstAvailable = AI_PROVIDERS.find(p => providerStatus[p.id] !== false);
      if (firstAvailable) {
        setSelectedProvider(firstAvailable.id);
        setSelectedModel(firstAvailable.models[0].id);
        return;
      }
    }
    setSelectedProvider(providerId);
    const provider = AI_PROVIDERS.find(p => p.id === providerId);
    if (provider && provider.models.length > 0) {
      setSelectedModel(provider.models[0].id);
    }
  };

  if (!mounted) {
    return (
      <Button variant="ghost" size="icon" className="h-9 w-9 rounded-lg">
        <Settings className="h-4 w-4" />
      </Button>
    );
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button 
          variant="ghost" 
          size="icon" 
          className="h-9 w-9 rounded-lg hover:bg-primary/10 transition-all duration-200"
          title="AI Model Settings"
        >
          <Settings className="h-4 w-4 transition-transform duration-200 hover:rotate-90" />
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            AI Model Settings
          </DialogTitle>
          <DialogDescription>
            Choose your preferred AI provider and model for chat responses.
            Settings are saved locally in your browser.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Provider Selection */}
          <div className="space-y-3">
            <Label htmlFor="provider" className="text-sm font-medium">
              AI Provider
            </Label>
            <Select value={selectedProvider} onValueChange={handleProviderChange}>
              <SelectTrigger id="provider" className="h-11">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {AI_PROVIDERS.map((provider) => {
                  const Icon = provider.icon;
                  const isAvailable = providerStatus[provider.id] !== false;
                  return (
                    <SelectItem key={provider.id} value={provider.id} disabled={!isAvailable && Object.keys(providerStatus).length > 0}>
                      <div className="flex items-center gap-2">
                        <Icon className="h-4 w-4" style={{ color: isAvailable ? provider.color : '#6b7280' }} />
                        <span className={`font-medium ${!isAvailable ? 'text-muted-foreground line-through' : ''}`}>{provider.name}</span>
                        {isAvailable && (
                          <span className="ml-1 rounded bg-green-500/10 px-1.5 py-0.5 text-[9px] font-bold text-green-500">READY</span>
                        )}
                        {!isAvailable && Object.keys(providerStatus).length > 0 && (
                          <span className="ml-1 rounded bg-destructive/10 px-1.5 py-0.5 text-[9px] font-bold text-destructive">NO KEY</span>
                        )}
                      </div>
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          </div>

          {/* Model Selection */}
          <div className="space-y-3">
            <Label htmlFor="model" className="text-sm font-medium">
              Model
            </Label>
            <Select value={selectedModel} onValueChange={setSelectedModel}>
              <SelectTrigger id="model" className="h-11">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {currentModels.map((model) => (
                  <SelectItem key={model.id} value={model.id}>
                    <div className="flex items-center justify-between gap-3 pr-2">
                      <div className="flex flex-col gap-0.5">
                        <span className="font-medium">{model.name}</span>
                        <span className="text-xs text-muted-foreground">
                          {model.description}
                        </span>
                      </div>
                      {model.badge && (
                        <Badge variant={model.badgeVariant} className="text-[10px] px-1.5 py-0">
                          {model.badge}
                        </Badge>
                      )}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Current Selection Display */}
          <div className="rounded-lg border border-border/50 bg-muted/30 p-4">
            <div className="flex items-start gap-3">
              <div 
                className="flex h-10 w-10 items-center justify-center rounded-lg" 
                style={{ backgroundColor: `${currentProvider?.color}20` }}
              >
                <ProviderIcon 
                  className="h-5 w-5" 
                  style={{ color: currentProvider?.color }}
                />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-semibold">
                    {currentModels.find(m => m.id === selectedModel)?.name || 'Selected Model'}
                  </p>
                  {currentModels.find(m => m.id === selectedModel)?.badge && (
                    <Badge 
                      variant={currentModels.find(m => m.id === selectedModel)?.badgeVariant}
                      className="text-[10px] px-1.5 py-0"
                    >
                      {currentModels.find(m => m.id === selectedModel)?.badge}
                    </Badge>
                  )}
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {currentProvider?.name} • {currentModels.find(m => m.id === selectedModel)?.description}
                </p>
              </div>
            </div>
          </div>

          {/* Info Note */}
          {Object.keys(providerStatus).length > 0 && providerStatus[selectedProvider] === false ? (
            <div className="rounded-lg bg-destructive/5 border border-destructive/20 p-3">
              <p className="text-xs text-destructive">
                ⚠️ <strong>{currentProvider?.name}</strong> does not have a valid API key configured.
                Requests will automatically fall back to an available provider.
                Add a real API key in your <code className="rounded bg-destructive/10 px-1">.env.local</code> file.
              </p>
            </div>
          ) : (
            <div className="rounded-lg bg-primary/5 border border-primary/10 p-3">
              <p className="text-xs text-muted-foreground">
                💡 <strong>Note:</strong> Your API keys are configured in environment variables. 
                Make sure you have valid credentials for the selected provider.
              </p>
            </div>
          )}
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <Button variant="outline" onClick={() => setOpen(false)}>
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
