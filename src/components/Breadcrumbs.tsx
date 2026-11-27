import React from 'react';
import { ChevronRight, Home } from 'lucide-react';
import { Link } from './Link';

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface BreadcrumbsProps {
  items: BreadcrumbItem[];
}

export const Breadcrumbs: React.FC<BreadcrumbsProps> = ({ items }) => {
  return (
    <nav aria-label="Breadcrumb" className="py-3 text-xs text-[#64748B]">
      <ol className="flex items-center flex-wrap gap-1.5">
        <li className="flex items-center">
          <Link
            to="/"
            className="hover:text-[#102A56] transition-colors flex items-center gap-1 font-medium"
            title="Go to PDFQuick Home"
          >
            <Home className="w-3.5 h-3.5 text-[#2563EB]" />
            <span>Home</span>
          </Link>
        </li>
        {items.map((item, index) => {
          const isLast = index === items.length - 1;
          return (
            <li key={index} className="flex items-center gap-1.5">
              <ChevronRight className="w-3.5 h-3.5 text-[#94A3B8] shrink-0" />
              {isLast || !item.href ? (
                <span className="text-[#17243A] font-semibold truncate max-w-xs" aria-current="page">
                  {item.label}
                </span>
              ) : (
                <Link
                  to={item.href}
                  className="hover:text-[#102A56] transition-colors truncate max-w-xs font-medium"
                >
                  {item.label}
                </Link>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
};
