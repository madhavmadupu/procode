import { useState } from "react";
import { useFirstRunStore, type WizardStep } from "../../stores/first-run";
import { useWorkspaceStore } from "../../stores/workspace";
import { trpc } from "../../lib/trpc";
import { FolderIcon, ChevronRightIcon, CheckCircleIcon } from "./icons";

interface StepProps {
  onNext: () => void;
  onBack: () => void;
}

function WelcomeStep({ onNext }: StepProps) {
  return (
    <div className="flex flex-col items-center justify-center h-full text-center px-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-zinc-100 mb-2">Welcome to ProCode</h1>
        <p className="text-zinc-400 text-lg">An AI-first code editor built for developers</p>
      </div>

      <div className="space-y-4 mb-8 max-w-md">
        <div className="flex items-start space-x-3 text-left">
          <CheckCircleIcon className="w-5 h-5 text-green-400 mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-zinc-200 font-medium">Lightning-fast editor</p>
            <p className="text-zinc-500 text-sm">Monaco Editor with JetBrains Mono, syntax highlighting, and intelligent code completion</p>
          </div>
        </div>
        <div className="flex items-start space-x-3 text-left">
          <CheckCircleIcon className="w-5 h-5 text-green-400 mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-zinc-200 font-medium">AI-powered assistance</p>
            <p className="text-zinc-500 text-sm">Local or cloud LLMs for code generation, refactoring, and intelligent chat</p>
          </div>
        </div>
        <div className="flex items-start space-x-3 text-left">
          <CheckCircleIcon className="w-5 h-5 text-green-400 mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-zinc-200 font-medium">Git integration</p>
            <p className="text-zinc-500 text-sm">Built-in git workflow with blame, diff, and commit history</p>
          </div>
        </div>
      </div>

      <button
        onClick={onNext}
        className="px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-lg text-sm font-medium transition-colors flex items-center space-x-2"
      >
        <span>Get Started</span>
        <ChevronRightIcon className="w-4 h-4" />
      </button>
    </div>
  );
}

function WorkspaceStep({ onNext, onBack }: StepProps) {
  const { workspacePath, setWorkspacePath } = useFirstRunStore();
  const [error, setError] = useState<string | null>(null);
  const [isValidating, setIsValidating] = useState(false);

  const handleSelectFolder = async () => {
    try {
      const path = await window.procode.ipc.invoke("open-folder-dialog", {});
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
      <h2 className="text-2xl font-bold text-zinc-100 mb-2">Select Your Workspace</h2>
      <p className="text-zinc-400 mb-8">Choose a folder to start coding</p>

      <div className="w-full max-w-md mb-6">
        <div
          className="border-2 border-dashed border-zinc-700 rounded-lg p-8 cursor-pointer hover:border-blue-500 transition-colors"
          onClick={handleSelectFolder}
        >
          <FolderIcon className="w-12 h-12 text-zinc-500 mx-auto mb-4" />
          <p className="text-zinc-300 font-medium mb-1">
            {workspacePath ? "Change Folder" : "Select Folder"}
          </p>
          {workspacePath && (
            <p className="text-zinc-500 text-sm truncate">{workspacePath}</p>
          )}
        </div>

        {error && (
          <p className="text-red-400 text-sm mt-3">{error}</p>
        )}
      </div>

      <div className="flex items-center space-x-4">
        <button
          onClick={onBack}
          className="px-6 py-3 bg-zinc-800 hover:bg-zinc-700 rounded-lg text-sm font-medium transition-colors"
        >
          Back
        </button>
        <button
          onClick={handleContinue}
          disabled={isValidating}
          className="px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-zinc-700 disabled:text-zinc-500 rounded-lg text-sm font-medium transition-colors flex items-center space-x-2"
        >
          <span>{isValidating ? "Validating..." : "Continue"}</span>
          {!isValidating && <ChevronRightIcon className="w-4 h-4" />}
        </button>
      </div>
    </div>
  );
}

function AiSetupStep({ onNext, onBack }: StepProps) {
  const { aiProvider, aiApiKey, aiModel, setAiProvider, setAiApiKey, setAiModel } = useFirstRunStore();
  const [skipAi, setSkipAi] = useState(false);

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
      <h2 className="text-2xl font-bold text-zinc-100 mb-2 text-center">Configure AI Assistant</h2>
      <p className="text-zinc-400 mb-6 text-center">Choose your preferred AI provider</p>

      <div className="w-full max-w-lg mx-auto space-y-3 mb-6">
        {providers.map((provider) => (
          <button
            key={provider.id}
            onClick={() => setAiProvider(provider.id)}
            className={`w-full text-left p-4 rounded-lg border transition-colors ${
              aiProvider === provider.id
                ? "border-blue-500 bg-blue-500/10"
                : "border-zinc-700 hover:border-zinc-600"
            }`}
          >
            <p className="text-zinc-200 font-medium">{provider.name}</p>
            <p className="text-zinc-500 text-sm">{provider.description}</p>
          </button>
        ))}
      </div>

      {aiProvider !== "none" && (
        <div className="w-full max-w-lg mx-auto space-y-4 mb-6">
          {aiProvider !== "ollama" && (
            <div>
              <label className="block text-zinc-300 text-sm font-medium mb-2">API Key</label>
              <input
                type="password"
                value={aiApiKey}
                onChange={(e) => setAiApiKey(e.target.value)}
                placeholder="Enter your API key"
                className="w-full px-4 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-zinc-100 text-sm outline-none focus:border-blue-500 placeholder:text-zinc-600"
              />
            </div>
          )}

          <div>
            <label className="block text-zinc-300 text-sm font-medium mb-2">Model</label>
            <select
              value={aiModel}
              onChange={(e) => setAiModel(e.target.value)}
              className="w-full px-4 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-zinc-100 text-sm outline-none focus:border-blue-500"
            >
              {models[aiProvider]?.map((model) => (
                <option key={model} value={model}>{model}</option>
              ))}
            </select>
          </div>
        </div>
      )}

      <div className="flex items-center justify-center space-x-4 mt-auto">
        <button
          onClick={onBack}
          className="px-6 py-3 bg-zinc-800 hover:bg-zinc-700 rounded-lg text-sm font-medium transition-colors"
        >
          Back
        </button>
        <button
          onClick={handleContinue}
          className="px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-lg text-sm font-medium transition-colors flex items-center space-x-2"
        >
          <span>Continue</span>
          <ChevronRightIcon className="w-4 h-4" />
        </button>
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
      <h2 className="text-3xl font-bold text-zinc-100 mb-2">You're All Set!</h2>
      <p className="text-zinc-400 mb-8 max-w-md">
        ProCode is ready to use. Start coding with AI-powered assistance at your fingertips.
      </p>

      <div className="space-y-2 mb-8 text-sm text-zinc-500">
        <p><kbd className="px-2 py-1 bg-zinc-800 rounded text-zinc-300">Ctrl+P</kbd> Fuzzy file search</p>
        <p><kbd className="px-2 py-1 bg-zinc-800 rounded text-zinc-300">Ctrl+`</kbd> Toggle terminal</p>
        <p><kbd className="px-2 py-1 bg-zinc-800 rounded text-zinc-300">Ctrl+B</kbd> Toggle sidebar</p>
      </div>

      <button
        onClick={handleFinish}
        className="px-8 py-3 bg-blue-600 hover:bg-blue-700 rounded-lg text-sm font-medium transition-colors"
      >
        Start Coding
      </button>
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

  const handleNext = () => {
    if (currentIndex < steps.length - 1) {
      setStep(steps[currentIndex + 1]);
    }
  };

  const handleBack = () => {
    if (currentIndex > 0) {
      setStep(steps[currentIndex - 1]);
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
    <div className="fixed inset-0 z-50 bg-zinc-950">
      <div className="h-full flex flex-col">
        <div className="flex items-center justify-center py-4 border-b border-zinc-800">
          <div className="flex items-center space-x-2">
            {steps.map((step, index) => (
              <div key={step} className="flex items-center">
                <div
                  className={`w-2 h-2 rounded-full ${
                    index <= currentIndex ? "bg-blue-500" : "bg-zinc-700"
                  }`}
                />
                {index < steps.length - 1 && (
                  <div
                    className={`w-8 h-0.5 mx-2 ${
                      index < currentIndex ? "bg-blue-500" : "bg-zinc-700"
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="flex-1">
          {renderStep()}
        </div>
      </div>
    </div>
  );
}
