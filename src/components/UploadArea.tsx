
import React, { useCallback, useState, useRef, useEffect } from 'react';
import { Upload, Loader2, ScanBarcode, UtensilsCrossed, Type, Search, Camera, Mic, MicOff, X, RefreshCcw, Image, AlertCircle } from 'lucide-react';
import { ScanMode, Language } from '../types';
import { t } from '../translations';
import { motion, AnimatePresence } from 'framer-motion';

interface UploadAreaProps {
  onImageSelected: (base64: string, mimeType: string, mode: ScanMode) => void;
  language?: Language;
  onTextAnalyze?: (text: string) => void;
  isAnalyzing?: boolean;
}

const UploadArea: React.FC<UploadAreaProps> = ({ onImageSelected, language = 'uz' as Language, onTextAnalyze, isAnalyzing = false }) => {
  const [activeTab, setActiveTab] = useState<'camera' | 'text'>('camera');
  const [scanMode, setScanMode] = useState<ScanMode>(ScanMode.MEAL);
  const [showCamera, setShowCamera] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('environment');
  const [cameraLoading, setCameraLoading] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const [capturedData, setCapturedData] = useState<string | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [textInput, setTextInput] = useState('');
  const [isListening, setIsListening] = useState(false);

  // Camera start logic ... (simplified for parity but keeping core)
  const startCamera = useCallback(async () => {
    setCameraError(null);
    setCameraLoading(true);
    setShowCamera(true);

    if (!navigator.mediaDevices?.getUserMedia) {
      setCameraError(t('scan.camera_unsupported', language));
      setCameraLoading(false);
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode, width: { ideal: 1920 }, height: { ideal: 1080 } },
        audio: false
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.onloadedmetadata = () => {
          videoRef.current?.play();
          setCameraLoading(false);
        };
      }
    } catch (e: any) {
      console.error('Camera error:', e);
      setCameraLoading(false);
      setCameraError(t('scan.camera_failed', language));
    }
  }, [facingMode, language]);

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setShowCamera(false);
  };

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        if (facingMode === 'user') {
          ctx.translate(canvas.width, 0);
          ctx.scale(-1, 1);
        }
        ctx.drawImage(video, 0, 0);
        const data = canvas.toDataURL('image/jpeg', 0.9);
        setCapturedData(data);
        setPreview(data);
        stopCamera();
      }
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        const res = ev.target?.result as string;
        setPreview(res);
        setCapturedData(res);
      };
      reader.readAsDataURL(file);
    }
  };

  const confirmCapture = () => {
    if (capturedData) {
      onImageSelected(capturedData, 'image/jpeg', scanMode);
    }
  };

  useEffect(() => {
    return () => stopCamera();
  }, []);

  return (
    <div className="w-full max-w-xl mx-auto flex flex-col items-center">

      {/* Tabs */}
      <div className="flex p-1 bg-slate-200/50 rounded-2xl mb-6 w-full shadow-inner ring-1 ring-black/5">
        {[
          { id: 'camera', icon: Camera, label: t('scan.camera_tab', language) },
          { id: 'text', icon: Type, label: t('scan.text_tab', language) }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`relative flex-1 py-3 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all ${activeTab === tab.id ? 'text-brand-700' : 'text-slate-500 hover:text-slate-700'}`}
          >
            {activeTab === tab.id && (
              <motion.div layoutId="tab-bg" className="absolute inset-0 bg-white shadow-sm rounded-xl" />
            )}
            <span className="relative z-10 flex items-center gap-2">
              <tab.icon size={18} /> {tab.label}
            </span>
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {activeTab === 'camera' ? (
          <motion.div
            key="camera"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="w-full flex flex-col gap-4"
          >
            {/* Mode Selection */}
            <div className="flex gap-3 w-full">
              {[
                { mode: ScanMode.MEAL, label: t('scan.meal_mode', language), icon: UtensilsCrossed },
                { mode: ScanMode.LABEL, label: t('scan.label_mode', language), icon: ScanBarcode },
              ].map(m => (
                <button
                  key={m.mode}
                  onClick={() => setScanMode(m.mode)}
                  className={`flex-1 py-3 px-4 rounded-xl border flex items-center justify-center gap-2 text-xs font-bold transition-all ${scanMode === m.mode ? 'border-brand-500 bg-brand-50 text-brand-700' : 'border-slate-200 bg-white text-slate-500'}`}
                >
                  <m.icon size={16} /> {m.label}
                </button>
              ))}
            </div>

            {/* Camera Area */}
            <div className="relative w-full aspect-[3/4] rounded-3xl overflow-hidden bg-slate-900 shadow-2xl ring-1 ring-black/10 group">
              {showCamera ? (
                <>
                  <video ref={videoRef} autoPlay playsInline muted className={`w-full h-full object-cover ${facingMode === 'user' ? 'scale-x-[-1]' : ''}`} />
                  <canvas ref={canvasRef} className="hidden" />

                  {/* Overlay Controls */}
                  <div className="absolute inset-0 z-20 flex flex-col justify-between p-6">
                    <div className="flex justify-between items-start">
                      <button onClick={stopCamera} className="p-3 bg-black/40 backdrop-blur text-white rounded-full"><X size={24} /></button>
                      <button onClick={() => setFacingMode(m => m === 'user' ? 'environment' : 'user')} className="p-3 bg-black/40 backdrop-blur text-white rounded-full"><RefreshCcw size={24} /></button>
                    </div>
                    <div className="flex justify-center pb-4">
                      <button onClick={capturePhoto} className="h-20 w-20 rounded-full border-4 border-white flex items-center justify-center bg-white/20 backdrop-blur active:scale-95 transition-all">
                        <div className="h-16 w-16 bg-white rounded-full" />
                      </button>
                    </div>
                  </div>
                </>
              ) : preview ? (
                <div className="relative w-full h-full">
                  <img src={preview} alt="Preview" className="w-full h-full object-cover" />
                  {isAnalyzing && (
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex flex-col items-center justify-center text-white">
                      <Loader2 className="animate-spin mb-4" size={48} />
                      <p className="font-bold animate-pulse">{t('scan.analyzing', language)}</p>
                    </div>
                  )}
                  <div className="absolute bottom-6 left-6 right-6 flex gap-4">
                    <button onClick={() => { setPreview(null); setCapturedData(null); }} className="flex-1 bg-white/20 backdrop-blur text-white font-bold py-4 rounded-xl">{t('scan.retake', language)}</button>
                    <button onClick={confirmCapture} disabled={isAnalyzing} className="flex-1 bg-brand-600 text-white font-bold py-4 rounded-xl shadow-lg">{t('scan.confirm', language)}</button>
                  </div>
                </div>
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center bg-slate-50 border-2 border-dashed border-slate-300 rounded-3xl p-6">
                  <div className="w-24 h-24 bg-brand-100 rounded-full flex items-center justify-center mb-6 text-brand-600 animate-pulse-slow">
                    <Camera size={40} />
                  </div>
                  <h3 className="text-xl font-bold text-slate-800 mb-2">{scanMode === ScanMode.MEAL ? 'Scan Meal' : 'Scan Label'}</h3>
                  <p className="text-slate-400 text-center text-sm mb-8 px-8">Take a photo of your food to instantly get calorie counts and macros.</p>

                  <button onClick={startCamera} className="w-full bg-slate-900 text-white py-4 rounded-xl font-bold shadow-lg flex items-center justify-center gap-2 hover:bg-slate-800 transition-all">
                    <Camera size={20} /> Start Camera
                  </button>
                  <div className="relative w-full mt-3">
                    <input type="file" className="absolute inset-0 opacity-0 cursor-pointer" onChange={handleFileChange} accept="image/*" />
                    <button className="w-full bg-white border border-slate-200 text-slate-700 py-4 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-slate-50 transition-all">
                      <Image size={20} /> Upload from Gallery
                    </button>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="text"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="w-full"
          >
            <div className="glass-card p-6 min-h-[300px] flex flex-col">
              <label className="text-sm font-bold text-slate-700 mb-3 block">{t('scan.text_placeholder', language)}</label>
              <textarea
                value={textInput}
                onChange={(e) => setTextInput(e.target.value)}
                placeholder="e.g., 2 eggs, 1 slice of toast, and a coffee..."
                className="w-full flex-1 bg-slate-50 border border-slate-200 rounded-xl p-4 text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-brand-500 outline-none resize-none"
              />
              <div className="flex justify-end gap-2 mt-4">
                <button className="p-3 rounded-full bg-slate-100 text-slate-600 hover:bg-slate-200"><Mic size={20} /></button>
                <button
                  disabled={!textInput.trim() || isAnalyzing}
                  onClick={() => onTextAnalyze?.(textInput)}
                  className="flex-1 bg-brand-600 text-white font-bold py-3 px-6 rounded-xl hover:bg-brand-700 disabled:opacity-50 transition-all"
                >
                  {isAnalyzing ? <Loader2 className="animate-spin mx-auto" /> : t('scan.analyze_text', language)}
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {cameraError && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="p-4 bg-red-50 text-red-600 rounded-xl flex items-center gap-3 mt-4 w-full">
          <AlertCircle size={20} />
          <p className="text-sm font-medium">{cameraError}</p>
        </motion.div>
      )}
    </div>
  );
};

export default UploadArea;
