import { ExternalLink } from "lucide-react";
import { GroundingSource } from "@shared/api";

interface GroundingSourcesProps {
  sources: GroundingSource[];
  language: string;
}

export function GroundingSources({ sources, language }: GroundingSourcesProps) {
  if (!sources || sources.length === 0) {
    return null;
  }

  return (
    <div className="bg-blue-50 rounded-xl p-4 border border-blue-100">
      <p className="text-xs font-bold text-blue-700 uppercase tracking-wider mb-3">
        {language === 'bn' ? 'আরও জানুন' : 'Learn More'}
      </p>
      <div className="space-y-2">
        {sources.map((source, idx) => (
          <a
            key={idx}
            href={source.url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-start gap-2 p-2 bg-white rounded-lg hover:bg-blue-50 transition-colors group"
          >
            <ExternalLink className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0 group-hover:text-blue-700" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-blue-900 group-hover:text-blue-700 line-clamp-2">
                {source.title}
              </p>
              {source.snippet && (
                <p className="text-xs text-blue-600 mt-1 line-clamp-2">
                  {source.snippet}
                </p>
              )}
            </div>
          </a>
        ))}
      </div>
    </div>
  );
}
