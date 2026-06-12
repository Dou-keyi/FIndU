// PostLinkPreview.jsx — rich link preview card with thumbnail, title, description, domain
import React from 'react';
import { ExternalLink } from 'lucide-react';

export default function PostLinkPreview({ linkData }) {
  if (!linkData || !linkData.url) return null;

  const { url, title, description, image } = linkData;
  const domain = (() => {
    try { return new URL(url).hostname.replace('www.', ''); }
    catch { return url; }
  })();

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      onClick={(e) => e.stopPropagation()}
      className="flex overflow-hidden rounded-xl border border-gray-100 bg-white hover:border-gray-200 transition-colors mb-3 group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500"
    >
      {/* Thumbnail */}
      {image && (
        <div className="w-28 lg:w-36 flex-shrink-0 bg-gray-100">
          <img
            src={image}
            alt={title || 'Link preview'}
            className="w-full h-full object-cover"
            loading="lazy"
          />
        </div>
      )}

      {/* Text content */}
      <div className="flex-1 p-3 min-w-0">
        <p className="text-[10px] font-medium text-gray-400 uppercase tracking-wider mb-1 flex items-center gap-1">
          <ExternalLink className="w-3 h-3" />
          {domain}
        </p>
        {title && (
          <h4 className="text-sm font-semibold text-gray-900 leading-tight line-clamp-2 mb-1 group-hover:text-violet-700 transition-colors">
            {title}
          </h4>
        )}
        {description && (
          <p className="text-xs text-gray-500 line-clamp-2">{description}</p>
        )}
      </div>
    </a>
  );
}
