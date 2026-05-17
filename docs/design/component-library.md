# Component Library

## Overview

ProCode's UI components are built with React 18, styled with Tailwind CSS, and follow a consistent design system. All components are accessible (WCAG 2.1 AA) and keyboard-navigable.

## Component Categories

### Layout Components

#### ActivityBar
```tsx
<ActivityBar>
  <ActivityBarItem icon="explorer" label="Explorer" active />
  <ActivityBarItem icon="search" label="Search" />
  <ActivityBarItem icon="git" label="Source Control" badge={3} />
  <ActivityBarItem icon="debug" label="Run & Debug" />
  <ActivityBarItem icon="extensions" label="Extensions" />
  <ActivityBarItem icon="ai" label="AI Chat" accent />
  <ActivityBarItem icon="graph" label="Knowledge Graph" />
</ActivityBar>
```

#### Sidebar
```tsx
<Sidebar width={260} resizable min={180} max={500}>
  <SidebarHeader>Explorer</SidebarHeader>
  <SidebarContent>
    <FileTree workspace={workspace} />
  </SidebarContent>
</Sidebar>
```

#### Panel
```tsx
<Panel height={200} resizable position="bottom">
  <PanelTabs>
    <PanelTab id="terminal" label="Terminal" />
    <PanelTab id="problems" label="Problems" badge={5} />
    <PanelTab id="output" label="Output" />
    <PanelTab id="debug" label="Debug Console" />
  </PanelTabs>
  <PanelContent>
    <Terminal />
  </PanelContent>
</Panel>
```

#### StatusBar
```tsx
<StatusBar>
  <StatusBarSection position="left">
    <StatusItem label="TypeScript" />
    <StatusItem label="UTF-8" />
    <StatusItem label="LF" />
    <StatusItem label="Ln 4, Col 12" />
  </StatusBarSection>
  <StatusBarSection position="right">
    <StatusItem label="main" icon="git-branch" />
    <StatusItem label="✓ LSP" status="success" />
    <StatusItem label="● Agent" status="active" />
  </StatusBarSection>
</StatusBar>
```

### Editor Components

#### EditorTabs
```tsx
<EditorTabs>
  <EditorTab
    file="src/index.ts"
    dirty={false}
    pinned={false}
    preview={false}
    active
  />
  <EditorTab
    file="utils/helpers.ts"
    dirty={true}
    pinned={true}
    preview={false}
  />
</EditorTabs>
```

#### Breadcrumbs
```tsx
<Breadcrumbs>
  <BreadcrumbItem>src</BreadcrumbItem>
  <BreadcrumbItem>components</BreadcrumbItem>
  <BreadcrumbItem>App.tsx</BreadcrumbItem>
  <BreadcrumbItem>App</BreadcrumbItem>
</Breadcrumbs>
```

#### MonacoEditor (wrapper)
```tsx
<MonacoEditor
  uri="file:///workspace/src/index.ts"
  language="typescript"
  value={content}
  onChange={handleChange}
  options={{
    minimap: { enabled: true },
    fontSize: 14,
    fontFamily: 'JetBrains Mono',
    wordWrap: 'off',
  }}
/>
```

### AI Components

#### AIChat
```tsx
<AIChat>
  <ChatMessages>
    <ChatMessage role="user" content="Add rate limiting" />
    <ChatMessage role="assistant" content="..." streaming />
  </ChatMessages>
  <ChatInput
    placeholder="Ask about your codebase..."
    onSend={handleSend}
    mentions={['@file', '@symbol', '@git-commit']}
  />
</AIChat>
```

#### CodeBlock
```tsx
<CodeBlock
  language="typescript"
  code={generatedCode}
  onAccept={handleAccept}
  onReject={handleReject}
/>
```

#### AgentTaskCard
```tsx
<AgentTaskCard
  task={task}
  status="running"
  steps={[
    { description: 'Read existing auth files', status: 'done' },
    { description: 'Query graph for patterns', status: 'done' },
    { description: 'Generating middleware.ts', status: 'running' },
    { description: 'Write file', status: 'pending' },
  ]}
/>
```

### Git Components

#### SourceControlPanel
```tsx
<SourceControlPanel>
  <ChangeList title="Changes" changes={unstaged} />
  <ChangeList title="Staged Changes" changes={staged} />
  <CommitInput
    message={commitMessage}
    onChange={setMessage}
    onCommit={handleCommit}
  />
</SourceControlPanel>
```

#### DiffEditor
```tsx
<DiffEditor
  original={originalContent}
  modified={modifiedContent}
  language="typescript"
  mode="side-by-side"  // or "inline"
/>
```

### Shared Components

#### CommandPalette
```tsx
<CommandPalette
  open={isOpen}
  onClose={handleClose}
  commands={commands}
  files={files}
  symbols={symbols}
/>
```

#### NotificationToast
```tsx
<NotificationToast
  type="success"  // | "error" | "warning" | "info"
  message="File saved successfully"
  duration={3000}
  action={{ label: 'Undo', onClick: handleUndo }}
/>
```

#### TreeView
```tsx
<TreeView>
  <TreeNode label="src" expanded icon="folder">
    <TreeNode label="index.ts" icon="typescript" />
    <TreeNode label="components" icon="folder">
      <TreeNode label="App.tsx" icon="typescript" />
    </TreeNode>
  </TreeNode>
</TreeView>
```

## Component Guidelines

### Props Pattern
- Use `className` for custom styling (Tailwind classes)
- Use `data-testid` for testing selectors
- Forward refs for DOM access
- Spread rest props to root element

### Accessibility
- All interactive elements have `aria-label` or visible text
- Focus management for modals, panels, dialogs
- Keyboard navigation with visible focus indicators
- Screen reader announcements for dynamic content

### Performance
- Memoize expensive components with `React.memo`
- Virtualize long lists (file trees, chat messages)
- Lazy load non-critical components
- Debounce user input handlers
