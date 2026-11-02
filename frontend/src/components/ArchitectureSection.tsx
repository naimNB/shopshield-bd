import { Server, Layout, Cpu, CheckCircle2, Code2 } from 'lucide-react';

export const ArchitectureSection: React.FC = () => {
  return (
    <section id="architecture" className="py-20 border-t border-slate-800/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <h2 className="text-xs font-bold uppercase tracking-widest text-emerald-400 mb-2">
            System Design & Monorepo
          </h2>
          <p className="text-3xl font-extrabold text-white tracking-tight sm:text-4xl">
            Modern, Scalable Architecture
          </p>
          <p className="mt-3 text-slate-400 text-sm">
            ShopShield BD is designed as a unified monorepo separating high-performance Python services from a lightweight, responsive React interface.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Frontend Stack */}
          <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 flex flex-col justify-between">
            <div>
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-teal-500/20 text-teal-400 flex items-center justify-center">
                  <Layout className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">Frontend Workspace</h3>
                  <span className="text-xs text-slate-400 font-mono">frontend/</span>
                </div>
              </div>
              <ul className="space-y-2 text-xs text-slate-300 font-mono">
                <li className="flex items-center space-x-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>React 19 & TypeScript 5</span>
                </li>
                <li className="flex items-center space-x-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>Vite 6 Fast Bundler</span>
                </li>
                <li className="flex items-center space-x-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>Tailwind CSS Utility Styling</span>
                </li>
                <li className="flex items-center space-x-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>Lucide React Iconography</span>
                </li>
              </ul>
            </div>
            <div className="mt-6 pt-4 border-t border-slate-800 text-[11px] text-slate-400">
              Build & lint verified via TypeScript & Vite build pipelines.
            </div>
          </div>

          {/* Backend Stack */}
          <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 flex flex-col justify-between">
            <div>
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                  <Server className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">Backend Workspace</h3>
                  <span className="text-xs text-slate-400 font-mono">backend/</span>
                </div>
              </div>
              <ul className="space-y-2 text-xs text-slate-300 font-mono">
                <li className="flex items-center space-x-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>Python 3.12+ & FastAPI</span>
                </li>
                <li className="flex items-center space-x-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>Pydantic v2 Serialization</span>
                </li>
                <li className="flex items-center space-x-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>Uvicorn High-Performance Server</span>
                </li>
                <li className="flex items-center space-x-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>OpenAPI /docs & /redoc</span>
                </li>
              </ul>
            </div>
            <div className="mt-6 pt-4 border-t border-slate-800 text-[11px] text-slate-400">
              Health check, CORS middleware, and API v1 router fully active.
            </div>
          </div>

          {/* AI & Verification Pipeline */}
          <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 flex flex-col justify-between">
            <div>
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center">
                  <Cpu className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">AI Engine & Testing</h3>
                  <span className="text-xs text-slate-400 font-mono">tests/ & docs/</span>
                </div>
              </div>
              <ul className="space-y-2 text-xs text-slate-300 font-mono">
                <li className="flex items-center space-x-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>Pytest & Starlette TestClient</span>
                </li>
                <li className="flex items-center space-x-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>Gemini Multimodal LLM (Planned)</span>
                </li>
                <li className="flex items-center space-x-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>OCR & Document Tokenizer</span>
                </li>
                <li className="flex items-center space-x-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>Comprehensive API Specs in docs/</span>
                </li>
              </ul>
            </div>
            <div className="mt-6 pt-4 border-t border-slate-800 text-[11px] text-slate-400">
              100% backend smoke tests passing with automated test runner.
            </div>
          </div>
        </div>

        {/* Monorepo directory map */}
        <div className="mt-10 p-6 rounded-2xl bg-slate-950 border border-slate-800 font-mono text-xs text-slate-300 overflow-x-auto">
          <div className="flex items-center space-x-2 text-emerald-400 mb-3 font-semibold">
            <Code2 className="w-4 h-4" />
            <span>Monorepo Structure (Task 01 Foundation)</span>
          </div>
          <pre className="text-slate-400 leading-relaxed">
{`shopshield-bd/
├── backend/          # FastAPI REST application, Pydantic schemas, settings
│   ├── app/          # main.py, config.py, routes, health schemas
│   └── requirements.txt
├── frontend/         # React 19, Vite, Tailwind CSS landing & UI platform
│   ├── src/          # Navbar, Hero, Features, VerificationPreview
│   └── package.json
├── docs/             # Technical architecture, API specifications, Hackathon context
│   ├── architecture.md
│   ├── api-specification.md
│   └── hackathon-vision.md
├── tests/            # Pytest test suite for health, API status, and OpenAPI specs
├── .env.example      # Safe environment variable configuration template
└── .gitignore        # Complete ignore rules (secrets, venvs, node_modules)`}
          </pre>
        </div>
      </div>
    </section>
  );
};
