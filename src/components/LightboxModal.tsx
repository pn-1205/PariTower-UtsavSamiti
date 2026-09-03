'use client';

import React, { useState } from 'react';
import { useAuth } from './AuthContext';
import { X, ZoomIn, ZoomOut, Download } from 'lucide-react';

export default function LightboxModal() {
  const { lightboxAttachment, setLightboxAttachment } = useAuth();
  const [zoom, setZoom] = useState(1);

  if (!lightboxAttachment) return null;

  const isPdf = lightboxAttachment.fileType?.includes('pdf') || lightboxAttachment.filePath.endsWith('.pdf');

  return (
    <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-sm flex flex-col animate-in fade-in-0 duration-200">
      {/* Top bar */}
      <div className="flex items-center justify-between px-4 py-3 bg-black/40 text-white border-b border-white/10">
        <div className="truncate max-w-xs sm:max-w-md">
          <p className="text-sm font-medium truncate">{lightboxAttachment.fileName}</p>
          <p className="text-xs text-gray-400">
            {Math.round(lightboxAttachment.fileSize / 1024)} KB • {lightboxAttachment.fileType}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {!isPdf && (
            <>
              <button
                onClick={() => setZoom((z) => Math.max(0.5, z - 0.25))}
                className="p-2 text-gray-300 hover:text-white rounded-lg hover:bg-white/10"
                title="Zoom Out"
              >
                <ZoomOut className="w-5 h-5" />
              </button>
              <span className="text-xs text-gray-400 min-w-[3rem] text-center">{Math.round(zoom * 100)}%</span>
              <button
                onClick={() => setZoom((z) => Math.min(3, z + 0.25))}
                className="p-2 text-gray-300 hover:text-white rounded-lg hover:bg-white/10"
                title="Zoom In"
              >
                <ZoomIn className="w-5 h-5" />
              </button>
            </>
          )}
          <a
            href={lightboxAttachment.filePath}
            download={lightboxAttachment.fileName}
            className="p-2 text-gray-300 hover:text-white rounded-lg hover:bg-white/10"
            title="Download"
          >
            <Download className="w-5 h-5" />
          </a>
          <button
            onClick={() => {
              setLightboxAttachment(null);
              setZoom(1);
            }}
            className="p-2 text-gray-300 hover:text-white rounded-lg hover:bg-white/10 ml-2"
            title="Close"
          >
            <X className="w-6 h-6" />
          </button>
        </div>
      </div>

      {/* Main Preview */}
      <div className="flex-1 flex items-center justify-center p-4 overflow-auto">
        {isPdf ? (
          <div className="w-full h-full max-w-4xl bg-white rounded-xl overflow-hidden flex flex-col">
            <iframe src={lightboxAttachment.filePath} className="w-full h-full border-none" title="PDF Attachment" />
          </div>
        ) : (
          <div className="max-w-4xl max-h-[85vh] transition-transform duration-150 flex items-center justify-center">
            <img
              src={lightboxAttachment.filePath}
              alt={lightboxAttachment.fileName}
              style={{ transform: `scale(${zoom})` }}
              className="max-h-[80vh] max-w-full object-contain rounded shadow-2xl transition-transform"
            />
          </div>
        )}
      </div>
    </div>
  );
}