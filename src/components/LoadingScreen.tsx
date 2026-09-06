import { Loader2 } from 'lucide-react';

interface LoadingScreenProps {
  progress: number;
  text: string;
}

export function LoadingScreen({ progress, text }: LoadingScreenProps) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 px-4">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center space-y-4">
          <Loader2 className="w-12 h-12 animate-spin mx-auto text-emerald-500" />
          <h2 className="text-xl font-semibold text-white">{text}</h2>
        </div>
        
        <div className="w-full bg-slate-800 rounded-full h-3 overflow-hidden">
          <div 
            className="bg-gradient-to-r from-emerald-500 to-teal-500 h-full transition-all duration-500 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
        
        <p className="text-center text-slate-400 text-sm">
          {progress}% concluído
        </p>
      </div>
    </div>
  );
}