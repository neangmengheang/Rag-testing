import React, { useState, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { Upload, FileText, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface UploadDashboardProps {
  room_id: string;
  user_id: string;
}

export const UploadDashboard: React.FC<UploadDashboardProps> = ({ room_id, user_id }) => {
  const [file, setFile] = useState<File | null>(null);
  const [status, setStatus] = useState<'idle' | 'uploading' | 'processing' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      if (selectedFile.type !== 'application/pdf') {
        setStatus('error');
        setErrorMessage('Only PDF files are supported.');
        return;
      }
      setFile(selectedFile);
      setStatus('idle');
      setErrorMessage(null);
    }
  };

  const handleUpload = async () => {
    if (!file) return;

    try {
      console.log('🚀 Starting upload process for:', file.name);
      setStatus('uploading');
      setProgress(10);

      // 1. Upload to Supabase Storage
      const fileName = `${Date.now()}_${file.name.replace(/\s+/g, '_')}`;
      const filePath = `documentation/${room_id}/${fileName}`;
      
      console.log('📦 Uploading to bucket "documents" at path:', filePath);
      
      const { data: storageData, error: storageError } = await supabase.storage
        .from('documents')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (storageError) {
        console.error('❌ Storage Error:', storageError);
        throw new Error(`Storage Error: ${storageError.message}. Make sure the "documents" bucket exists and is public.`);
      }

      console.log('✅ Upload successful. Data:', storageData);
      setProgress(50);
      setStatus('processing');

      // 2. Trigger Edge Function
      console.log('🧠 Triggering Edge Function "process-doc"...');
      
      const { data: functionData, error: functionError } = await supabase.functions.invoke('process-doc', {
        body: {
          file_path: storageData.path,
          room_id,
          fed_by_user_id: user_id
        }
      });

      if (functionError) {
        console.error('❌ Function Error Detail:', functionError);
        
        // Handle the specific "Failed to send request" error with more context
        if (functionError.message?.includes('Failed to send a request')) {
          throw new Error(
            'Cannot reach the Edge Function. 1) Have you run "supabase functions deploy process-doc"? 2) Check if your Supabase URL is correct in your secrets.'
          );
        }
        
        throw new Error(`Edge Function Error: ${functionError.message}`);
      }

      console.log('✨ Processing complete!', functionData);
      setProgress(100);
      setStatus('success');
    } catch (err: any) {
      console.error('🚨 Process failed:', err);
      setStatus('error');
      setErrorMessage(err.message || 'An unexpected error occurred.');
    }
  };

  const reset = () => {
    setFile(null);
    setStatus('idle');
    setErrorMessage(null);
    setProgress(0);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="w-full">
      <motion.div 
        layout
        className="bg-neutral-900/40 rounded-xl border border-neutral-800/60 overflow-hidden shadow-2xl backdrop-blur-sm"
      >
        <div className="p-8">
          <AnimatePresence mode="wait">
            {status === 'idle' || status === 'error' ? (
              <motion.div
                key="dropzone"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className={cn(
                  "relative group cursor-pointer",
                  "border-2 border-dashed border-neutral-800 rounded-xl p-12 transition-all",
                  "hover:border-neutral-600 hover:bg-neutral-800/30",
                  status === 'error' && "border-red-900/50 bg-red-900/10"
                )}
                onClick={() => fileInputRef.current?.click()}
              >
                <input 
                  type="file" 
                  ref={fileInputRef}
                  className="hidden" 
                  accept=".pdf"
                  onChange={handleFileChange}
                />
                
                <div className="flex flex-col items-center text-center">
                  <div className="w-14 h-14 bg-neutral-800 rounded-full flex items-center justify-center mb-5 border border-neutral-700 group-hover:scale-105 transition-transform">
                    <Upload className="w-6 h-6 text-neutral-400 group-hover:text-emerald-400" />
                  </div>
                  <p className="text-white text-sm font-medium tracking-tight">
                    {file ? file.name : "Click to upload or drag and drop"}
                  </p>
                  <p className="text-neutral-500 text-[10px] mt-2 uppercase tracking-widest font-bold">
                    Maximum file size: 20MB (PDF)
                  </p>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="progress"
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                className="py-12 flex flex-col items-center justify-center text-center"
              >
                {status === 'success' ? (
                  <div className="flex flex-col items-center">
                    <div className="w-20 h-20 bg-emerald-500/10 rounded-full flex items-center justify-center mb-6 border border-emerald-500/20 shadow-[0_0_20px_rgba(16,185,129,0.1)]">
                      <CheckCircle className="w-10 h-10 text-emerald-500" />
                    </div>
                    <h3 className="text-xl font-serif text-white italic">Processing Complete</h3>
                    <p className="text-neutral-500 text-sm mt-2 max-w-xs mx-auto">
                      Vector embeddings have been generated and stored in room context.
                    </p>
                    <button 
                      onClick={reset}
                      className="mt-8 px-8 py-2.5 bg-neutral-800 hover:bg-neutral-700 text-white rounded-md text-sm font-medium transition-all border border-neutral-700 shadow-lg"
                    >
                      Upload Another
                    </button>
                  </div>
                ) : (
                  <div className="w-full max-w-xs">
                    <div className="relative w-16 h-16 mx-auto mb-8">
                      <Loader2 className="w-16 h-16 text-emerald-500/30 animate-spin absolute inset-0" />
                      <div className="w-16 h-16 rounded-full border border-emerald-500/10 flex items-center justify-center">
                        <FileText className="w-6 h-6 text-emerald-500 animate-pulse" />
                      </div>
                    </div>
                    
                    <h3 className="text-sm font-medium text-white mb-6 uppercase tracking-widest">
                      {status === 'uploading' ? 'Ingesting Assets' : 'Generating Vectors'}
                    </h3>
                    
                    <div className="relative h-1 w-full bg-neutral-800 rounded-full overflow-hidden">
                      <motion.div 
                        className="h-full bg-emerald-500 shadow-[0_0_8px_rgba(52,211,153,0.5)]"
                        initial={{ width: 0 }}
                        animate={{ width: `${progress}%` }}
                        transition={{ type: "spring", bounce: 0, duration: 0.5 }}
                      />
                    </div>
                    
                    <div className="flex justify-between mt-3 text-[10px] font-mono text-neutral-500 uppercase">
                      <span>Progress</span>
                      <span className="text-emerald-400">{Math.round(progress)}%</span>
                    </div>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          {status === 'error' && (
            <div className="mt-6 p-4 bg-red-950/20 border border-red-900/30 rounded-lg flex items-start gap-4">
              <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="text-red-400 text-xs font-bold uppercase tracking-widest leading-none">System Alert</p>
                <p className="text-red-200/70 text-xs leading-relaxed">{errorMessage}</p>
              </div>
            </div>
          )}

          {(status === 'idle' || status === 'error') && file && (
            <button
              onClick={handleUpload}
              className="w-full mt-8 bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-4 rounded-lg shadow-lg shadow-emerald-950/20 transition-all hover:scale-[1.01] active:scale-100 flex items-center justify-center gap-2 text-sm uppercase tracking-widest"
            >
              Initialize Processing
            </button>
          )}
        </div>
      </motion.div>
    </div>
  );
};
