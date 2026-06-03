import React from 'react';

export function AppLoader() {
  const [progress, setProgress] = React.useState(0);

  React.useEffect(() => {
    const timer = setInterval(() => {
      setProgress(prev => {
        if (prev >= 85) { clearInterval(timer); return 85; }
        return prev + Math.random() * 12;
      });
    }, 300);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="fixed inset-0 bg-slate-950 flex items-center justify-center overflow-hidden">

      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl animate-pulse" />
      <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-teal-400/5 rounded-full blur-2xl" />

      <div className="relative z-10 flex flex-col items-center gap-8 px-12 py-10 rounded-3xl bg-white/[0.04] border border-white/10 backdrop-blur-2xl shadow-2xl shadow-black/40 min-w-[320px]">
        <div className="relative w-20 h-20">
          <div className="absolute inset-0 rounded-full border-4 border-slate-700/60" />
          <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-teal-400 animate-spin" style={{ animationDuration: '0.9s' }} />
          <div className="absolute inset-2 rounded-full border-2 border-transparent border-t-indigo-400/60 animate-spin" style={{ animationDuration: '1.5s', animationDirection: 'reverse' }} />

          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-3 h-3 rounded-full bg-teal-400 shadow-lg shadow-teal-400/60 animate-pulse" />
          </div>
        </div>

        <div className="text-center">
          <h1 className="text-3xl font-black tracking-tight bg-gradient-to-r from-teal-300 via-teal-400 to-indigo-400 bg-clip-text text-transparent">
            TechnoRUCS
          </h1>
          <p className="text-slate-500 text-sm font-medium mt-1.5 tracking-wide">Project Management System</p>
        </div>

        <div className="w-full space-y-2">
          <div className="relative h-1 w-full rounded-full bg-slate-800 overflow-hidden">
            <div
              className="absolute top-0 left-0 h-full rounded-full bg-gradient-to-r from-teal-500 to-indigo-500 transition-all duration-500 ease-out shadow-sm shadow-teal-500/50"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="text-center text-xs text-slate-600 font-medium tracking-wider uppercase">
            Authenticating…
          </p>
        </div>
      </div>
    </div>
  );
}
