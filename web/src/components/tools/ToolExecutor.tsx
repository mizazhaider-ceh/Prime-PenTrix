'use client';

import { useState, useEffect } from 'react';
import { Tool, ToolOutput } from '@/types/tools';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { X, Play, Copy, MessageSquare, Check, AlertCircle, Loader2, Lightbulb } from 'lucide-react';
import { useChatStore } from '@/store/chatStore';
import { toast } from 'sonner';

interface ToolExecutorProps {
  tool: Tool;
  onClose: () => void;
}

export default function ToolExecutor({ tool, onClose }: ToolExecutorProps) {
  const [inputs, setInputs] = useState<Record<string, any>>(tool.exampleInputs || {});
  const [isExecuting, setIsExecuting] = useState(false);
  const [result, setResult] = useState<ToolOutput | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const { addMessage, currentConversation } = useChatStore();

  // Reset inputs when tool changes
  useEffect(() => {
    setInputs(tool.exampleInputs || {});
    setResult(null);
  }, [tool.id]);

  // Handle input change
  const handleInputChange = (name: string, value: any) => {
    setInputs((prev) => ({ ...prev, [name]: value }));
  };

  // Load example inputs
  const loadExample = () => {
    if (tool.exampleInputs) {
      setInputs(tool.exampleInputs);
      toast.success('Example inputs loaded');
    }
  };

  // Execute tool
  const executeTool = async () => {
    setIsExecuting(true);
    setResult(null);

    try {
      const response = await fetch('/api/tools/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ toolId: tool.id, inputs }),
      });

      const data = await response.json();
      setResult(data);

      if (data.success) {
        toast.success('Tool executed successfully');
      } else {
        toast.error(data.error || 'Tool execution failed');
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to execute tool');
      setResult({
        success: false,
        error: error.message || 'Network error',
      });
    } finally {
      setIsExecuting(false);
    }
  };

  // Copy to clipboard
  const copyToClipboard = (text: string, field: string = 'result') => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    toast.success('Copied to clipboard');
    setTimeout(() => setCopiedField(null), 2000);
  };

  // Insert result to chat
  const insertToChat = () => {
    if (!result?.formatted || !currentConversation) {
      toast.error('No active conversation');
      return;
    }

    const message = `Used tool: **${tool.name}**\n\nResult:\n\`\`\`\n${result.formatted}\n\`\`\``;

    // Temporarily disable insert to chat - will be handled by chat interface
    toast.info('Copy result and paste into chat instead');
  };

  // Render input field
  const renderInputField = (inputDef: typeof tool.inputs[0]) => {
    const value = inputs[inputDef.name] ?? inputDef.defaultValue ?? '';

    switch (inputDef.type) {
      case 'textarea':
        return (
          <Textarea
            value={value}
            onChange={(e) => handleInputChange(inputDef.name, e.target.value)}
            placeholder={inputDef.placeholder}
            className="min-h-[100px] font-mono text-sm"
            required={inputDef.required}
          />
        );

      case 'number':
        return (
          <Input
            type="number"
            value={value}
            onChange={(e) => handleInputChange(inputDef.name, parseInt(e.target.value) || 0)}
            placeholder={inputDef.placeholder}
            min={inputDef.min}
            max={inputDef.max}
            required={inputDef.required}
          />
        );

      case 'select':
        return (
          <Select value={value.toString()} onValueChange={(v) => handleInputChange(inputDef.name, v)}>
            <SelectTrigger>
              <SelectValue placeholder={inputDef.placeholder || 'Select option'} />
            </SelectTrigger>
            <SelectContent>
              {inputDef.options?.map((opt) => (
                <SelectItem key={opt.value} value={opt.value.toString()}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        );

      case 'checkbox':
        return (
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={!!value}
              onChange={(e) => handleInputChange(inputDef.name, e.target.checked)}
              className="h-4 w-4 rounded border-input"
            />
            <span className="text-sm text-muted-foreground">{inputDef.label}</span>
          </div>
        );

      default:
        return (
          <Input
            type="text"
            value={value}
            onChange={(e) => handleInputChange(inputDef.name, e.target.value)}
            placeholder={inputDef.placeholder}
            required={inputDef.required}
          />
        );
    }
  };

  return (
    <div className="flex h-full flex-col min-h-0">
      {/* Header */}
      <div className="flex-shrink-0 border-b border-border/20 p-4">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <h2 className="font-outfit text-xl font-bold">{tool.name}</h2>
              <Badge variant="outline" className="text-[10px]">
                {tool.category}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground">{tool.description}</p>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose} aria-label="Close tool">
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar">
        <div className="p-6 space-y-6">
          {/* Input Form */}
          <Card className="p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold">Input</h3>
              {tool.exampleInputs && (
                <Button variant="outline" size="sm" onClick={loadExample} className="gap-1.5 h-8 text-xs">
                  <Lightbulb className="h-3 w-3" />
                  Load Example
                </Button>
              )}
            </div>

            <div className="space-y-4">
              {tool.inputs.map((inputDef) => (
                <div key={inputDef.name} className="space-y-2">
                  <Label>
                    {inputDef.label}
                    {inputDef.required && <span className="text-destructive ml-1">*</span>}
                  </Label>
                  {renderInputField(inputDef)}
                  {inputDef.helperText && <p className="text-xs text-muted-foreground">{inputDef.helperText}</p>}
                </div>
              ))}
            </div>

            <Separator className="my-4" />

            <Button onClick={executeTool} disabled={isExecuting} className="w-full gap-2">
              {isExecuting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Executing...
                </>
              ) : (
                <>
                  <Play className="h-4 w-4" />
                  Run Tool
                </>
              )}
            </Button>
          </Card>

          {/* Result Display */}
          {result && (
            <Card className="p-5">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold">Result</h3>
                  {result.success ? (
                    <Badge variant="default" className="gap-1 text-xs">
                      <Check className="h-3 w-3" />
                      Success
                    </Badge>
                  ) : (
                    <Badge variant="destructive" className="gap-1 text-xs">
                      <AlertCircle className="h-3 w-3" />
                      Error
                    </Badge>
                  )}
                </div>
                {result.success && (
                  <div className="flex gap-1">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => copyToClipboard(result.formatted || JSON.stringify(result.result, null, 2))}
                      className="gap-1.5 h-8"
                    >
                      {copiedField === 'result' ? (
                        <>
                          <Check className="h-3 w-3" />
                          Copied
                        </>
                      ) : (
                        <>
                          <Copy className="h-3 w-3" />
                          Copy
                        </>
                      )}
                    </Button>
                    <Button variant="outline" size="sm" onClick={insertToChat} className="gap-1.5 h-8">
                      <MessageSquare className="h-3 w-3" />
                      Insert to Chat
                    </Button>
                  </div>
                )}
              </div>

              {result.success ? (
                <div className="space-y-3">
                  {result.formatted ? (
                    <pre className="rounded-lg bg-muted p-4 text-sm overflow-auto max-h-[32rem] whitespace-pre-wrap font-mono custom-scrollbar">
                      {result.formatted}
                    </pre>
                  ) : (
                    <pre className="rounded-lg bg-muted p-4 text-sm overflow-auto max-h-[32rem] font-mono custom-scrollbar">
                      {JSON.stringify(result.result, null, 2)}
                    </pre>
                  )}
                  {result.metadata && (
                    <div className="flex flex-wrap gap-2">
                      {Object.entries(result.metadata).map(([key, value]) => (
                        <Badge key={key} variant="secondary" className="text-xs">
                          {key}: {String(value)}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <div className="rounded-lg bg-destructive/10 border border-destructive/20 p-4">
                  <p className="text-sm text-destructive">{result.error}</p>
                </div>
              )}
            </Card>
          )}

          {/* Tool Info */}
          <Card className="p-5 bg-muted/30">
            <h3 className="font-semibold mb-3 text-sm">About this tool</h3>
            <div className="space-y-2 text-xs text-muted-foreground">
              <div className="flex items-center justify-between">
                <span>Category:</span>
                <Badge variant="outline" className="text-xs">
                  {tool.category}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span>Recommended for:</span>
                <div className="flex flex-wrap gap-1">
                  {tool.subjects.slice(0, 2).map((subj) => (
                    <Badge key={subj} variant="secondary" className="text-[10px] h-4">
                      {subj}
                    </Badge>
                  ))}
                  {tool.subjects.length > 2 && (
                    <Badge variant="secondary" className="text-[10px] h-4">
                      +{tool.subjects.length - 2}
                    </Badge>
                  )}
                </div>
              </div>
              <div className="flex flex-wrap gap-1 pt-2">
                {tool.tags.map((tag) => (
                  <span key={tag} className="text-[10px] text-muted-foreground">
                    #{tag}
                  </span>
                ))}
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
