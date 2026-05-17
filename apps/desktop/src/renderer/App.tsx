function App() {
  return (
    <div className="h-screen w-screen flex flex-col bg-zinc-950 text-zinc-100">
      <header className="h-8 flex items-center px-4 border-b border-zinc-800 bg-zinc-900">
        <span className="text-sm font-medium">ProCode</span>
      </header>
      <main className="flex-1 flex">
        <aside className="w-12 border-r border-zinc-800 bg-zinc-900" />
        <div className="flex-1 flex items-center justify-center">
          <p className="text-zinc-500">Open a folder to get started</p>
        </div>
      </main>
    </div>
  );
}

export default App;
