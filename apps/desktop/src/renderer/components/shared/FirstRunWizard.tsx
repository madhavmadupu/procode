import { useState } from "react";
import { useFirstRunStore, type WizardStep } from "../../stores/first-run";
import { useWorkspaceStore } from "../../stores/workspace";
import { trpc } from "../../lib/trpc";
import { FolderIcon, ChevronRightIcon, CheckCircleIcon } from "./icons";
import { Button, Input, Label, Progress, Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "../ui";
import { cn } from "../../lib/utils";

interface StepProps {
  onNext: () => void;
  onBack: () => void;
}

function WelcomeStep({ onNext }: StepProps) {
  return (
    <div className="flex flex-col items-center justify-center h-full text-center px-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-foreground mb-2">Welcome to ProCode</h1>
        <p className="text-muted-foreground text-lg">An AI-first code editor built for developers</p>
      </div>

      <div className="space-y-4 mb-8 max-w-md">
        <div className="flex items-start space-x-3 text-left">
          <CheckCircleIcon className="w-5 h-5 text-green-400 mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-foreground font-medium">Lightning-fast editor</p>
            <p className="text-muted-foreground text-sm">Monaco Editor with JetBrains Mono, syntax highlighting, and intelligent code completion</p>
          </div>
        </div>
        <div className="flex items-start space-x-3 text-left">
          <CheckCircleIcon className="w-5 h-5 text-green-400 mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-foreground font-medium">AI-powered assistance</p>
            <p className="text-muted-foreground text-sm">Local or cloud LLMs for code generation, refactoring, and intelligent chat</p>
          </div>
        </div>
        <div className="flex items-start space-x-3 text-left">
          <CheckCircleIcon className="w-5 h-5 text-green-400 mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-foreground font-medium">Git integration</p>
            <p className="text-muted-foreground text-sm">Built-in git workflow with blame, diff, and commit history</p>
          </div>
        </div>
      </div>

      <Button onClick={onNext} size="lg">
        <span>Get Started</span>
        <ChevronRightIcon className="w-4 h-4 ml-2" />
      </Button>
    </div>
  );
}

function WorkspaceStep({ onNext, onBack }: StepProps) {
  const { workspacePath, setWorkspacePath } = useFirstRunStore();
  const [error, setError] = useState<string | null>(null);
  const [isValidating, setIsValidating] = useState(false);

  const handleSelectFolder = async () => {
    try {
      const path = (await window.procode.ipc.invoke("open-folder-dialog", {})) as string;
      if (path) {
        setWorkspacePath(path);
        setError(null);
      }
    } catch (err) {
      console.error("Failed to open folder dialog:", err);
    }
  };

  const handleContinue = async () => {
    if (!workspacePath) {
      setError("Please select a workspace folder");
      return;
    }

    setIsValidating(true);
    setError(null);

    try {
      const response = await trpc.fileSystem.openFolder(workspacePath);
      if (response.success) {
        useWorkspaceStore.getState().setWorkspace(workspacePath);
        onNext();
      } else {
        setError(response.error || "Failed to open workspace");
      }
    } catch (err) {
      setError("Failed to validate workspace path");
    } finally {
      setIsValidating(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center h-full text-center px-8">
      <h2 className="text-2xl font-bold text-foreground mb-2">Select Your Workspace</h2>
      <p className="text-muted-foreground mb-8">Choose a folder to start coding</p>

      <div className="w-full max-w-md mb-6">
        <Card
          className="border-2 border-dashed border-border cursor-pointer hover:border-blue-500 transition-colors"
          onClick={handleSelectFolder}
        >
          <CardContent className="p-8 flex flex-col items-center">
            <FolderIcon className="w-12 h-12 text-muted-foreground mb-4" />
            <p className="text-foreground font-medium mb-1">
              {workspacePath ? "Change Folder" : "Select Folder"}
            </p>
            {workspacePath && (
              <p className="text-muted-foreground text-sm truncate">{workspacePath}</p>
            )}
          </CardContent>
        </Card>

        {error && (
          <p className="text-red-400 text-sm mt-3">{error}</p>
        )}
      </div>

      <div className="flex items-center space-x-4">
        <Button variant="outline" onClick={onBack}>
          Back
        </Button>
        <Button onClick={handleContinue} disabled={isValidating}>
          <span>{isValidating ? "Validating..." : "Continue"}</span>
          {!isValidating && <ChevronRightIcon className="w-4 h-4 ml-2" />}
        </Button>
      </div>
    </div>
  );
}

function AiSetupStep({ onNext, onBack }: StepProps) {
  const { aiProvider, aiApiKey, aiModel, setAiProvider, setAiApiKey, setAiModel } = useFirstRunStore();

  const providers = [
    { id: "ollama" as const, name: "Ollama (Local)", description: "Run models locally, no API key needed" },
    { id: "openai" as const, name: "OpenAI", description: "GPT-4, GPT-3.5, and more" },
    { id: "anthropic" as const, name: "Anthropic", description: "Claude 3 Opus, Sonnet, Haiku" },
    { id: "none" as const, name: "Skip for now", description: "You can configure AI later in settings" },
  ];

  const models: Record<string, string[]> = {
    ollama: ["qwen2.5-coder:7b", "qwen2.5-coder:1.5b", "codellama:7b", "starcoder2:3b"],
    openai: ["gpt-4o", "gpt-4-turbo", "gpt-3.5-turbo"],
    anthropic: ["claude-3-opus-20240229", "claude-3-sonnet-20240229", "claude-3-haiku-20240307"],
    none: [],
  };

  const handleContinue = () => {
    onNext();
  };

  return (
    <div className="flex flex-col h-full px-8 py-6 overflow-y-auto">
      <h2 className="text-2xl font-bold text-foreground mb-2 text-center">Configure AI Assistant</h2>
      <p className="text-muted-foreground mb-6 text-center">Choose your preferred AI provider</p>

      <div className="w-full max-w-lg mx-auto space-y-3 mb-6">
        {providers.map((provider) => (
          <Card
            key={provider.id}
            className={cn(
              "cursor-pointer transition-colors",
              aiProvider === provider.id
                ? "border-blue-500 bg-blue-500/10"
                : "border-border hover:border-muted-foreground"
            )}
            onClick={() => setAiProvider(provider.id)}
          >
            <CardContent className="p-4">
              <p className="text-foreground font-medium">{provider.name}</p>
              <p className="text-muted-foreground text-sm">{provider.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {aiProvider !== "none" && (
        <div className="w-full max-w-lg mx-auto space-y-4 mb-6">
          {aiProvider !== "ollama" && (
            <div>
              <Label htmlFor="api-key" className="text-foreground mb-2 block">API Key</Label>
              <Input
                id="api-key"
                type="password"
                value={aiApiKey}
                onChange={(e) => setAiApiKey(e.target.value)}
                placeholder="Enter your API key"
                className="bg-sidebar-accent/50 border-border"
              />
            </div>
          )}

          <div>
            <Label htmlFor="model" className="text-foreground mb-2 block">Model</Label>
            <select
              id="model"
              value={aiModel}
              onChange={(e) => setAiModel(e.target.value)}
              className="w-full px-4 py-2 bg-sidebar-accent/50 border border-border rounded-md text-foreground text-sm outline-none focus:border-blue-500"
            >
              {models[aiProvider]?.map((model) => (
                <option key={model} value={model}>{model}</option>
              ))}
            </select>
          </div>
        </div>
      )}

      <div className="flex items-center justify-center space-x-4 mt-auto">
        <Button variant="outline" onClick={onBack}>
          Back
        </Button>
        <Button onClick={handleContinue}>
          <span>Continue</span>
          <ChevronRightIcon className="w-4 h-4 ml-2" />
        </Button>
      </div>
    </div>
  );
}

function DoneStep({ onNext }: StepProps) {
  const { setCompleted } = useFirstRunStore();

  const handleFinish = () => {
    setCompleted(true);
    onNext();
  };

  return (
    <div className="flex flex-col items-center justify-center h-full text-center px-8">
      <CheckCircleIcon className="w-16 h-16 text-green-400 mb-6" />
      <h2 className="text-3xl font-bold text-foreground mb-2">You're All Set!</h2>
      <p className="text-muted-foreground mb-8 max-w-md">
        ProCode is ready to use. Start coding with AI-powered assistance at your fingertips.
      </p>

      <div className="space-y-2 mb-8 text-sm text-muted-foreground">
        <p><kbd className="px-2 py-1 bg-sidebar-accent rounded text-foreground">Ctrl+P</kbd> Fuzzy file search</p>
        <p><kbd className="px-2 py-1 bg-sidebar-accent rounded text-foreground">Ctrl+`</kbd> Toggle terminal</p>
        <p><kbd className="px-2 py-1 bg-sidebar-accent rounded text-foreground">Ctrl+B</kbd> Toggle sidebar</p>
      </div>

      <Button onClick={handleFinish} size="lg">
        Start Coding
      </Button>
    </div>
  );
}

export function FirstRunWizard() {
  const { currentStep, setStep, hasCompletedOnboarding } = useFirstRunStore();

  if (hasCompletedOnboarding) {
    return null;
  }

  const steps: WizardStep[] = ["welcome", "workspace", "ai-setup", "done"];
  const currentIndex = steps.indexOf(currentStep);
  const progress = ((currentIndex + 1) / steps.length) * 100;

  const handleNext = () => {
    if (currentIndex < steps.length - 1) {
      setStep(steps[currentIndex + 1]!);
    }
  };

  const handleBack = () => {
    if (currentIndex > 0) {
      setStep(steps[currentIndex - 1]!);
    }
  };

  const renderStep = () => {
    switch (currentStep) {
      case "welcome":
        return <WelcomeStep onNext={handleNext} onBack={handleBack} />;
      case "workspace":
        return <WorkspaceStep onNext={handleNext} onBack={handleBack} />;
      case "ai-setup":
        return <AiSetupStep onNext={handleNext} onBack={handleBack} />;
      case "done":
        return <DoneStep onNext={handleNext} onBack={handleBack} />;
      default:
        return null;
    }
  };

  return (
    <div className="fixed inset-0 z-modal bg-background">
      <div className="h-full flex flex-col">
        <div className="flex items-center justify-center py-4 border-b border-border">
          <div className="w-full max-w-md">
            <Progress value={progress} className="h-1" />
          </div>
        </div>

        <div className="flex-1">
          {renderStep()}
        </div>
      </div>
    </div>
  );
}
