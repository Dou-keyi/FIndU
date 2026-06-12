// PostDocumentCard.jsx — PDF/document preview card
import React from 'react';
import { FileText, ExternalLink } from 'lucide-react';

export default function PostDocumentCard({ url, filename, pageCount }) {
  return (
    <div className="flex items-center gap-3 p-3 rounded-xl border border-gray-100 bg-gray-50/50 mb-3 group hover:border-gray-200 transition-colors">
      <div className="w-10 h-10 rounded-lg bg-red-50 flex items-center justify-center flex-shrink-0">
        <FileText className="w-5 h-5 text-red-500" />
      </div>

      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-gray-800 truncate">
          {filename || 'Document'}
        </p>
        {pageCount && (
          <p className="text-xs text-gray-400">{pageCount} pages • PDF</p>
        )}
      </div>

      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        onClick={(e) => e.stopPropagation()}
        className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold text-violet-600 bg-violet-50 hover:bg-violet-100 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500"
      >
        <ExternalLink className="w-3 h-3" />
        View
      </a>
    </div>
  );
}
