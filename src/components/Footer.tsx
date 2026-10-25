import React from 'react';
import { Palette, Heart } from 'lucide-react';

interface FooterProps {
  onNavigate: (page: string) => void;
}

export const Footer: React.FC<FooterProps> = ({ onNavigate }) => {
  return (
    <footer className="bg-stone-900 text-stone-300 border-t border-stone-800 pt-12 pb-8 mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          {/* Brand info */}
          <div className="md:col-span-2 space-y-3">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 rounded bg-[#C85A32] flex items-center justify-center text-white">
                <Palette className="w-4 h-4 text-amber-100" />
              </div>
              <span className="font-serif text-xl font-bold text-white tracking-tight">
                Art<span className="text-[#C85A32]">Loop</span>
              </span>
            </div>
            <p className="text-stone-400 text-sm max-w-md leading-relaxed">
              A community marketplace for art students, hobbyists, and artists to exchange,
              buy, and sell second-hand materials. Reducing studio waste while keeping creative
              tools affordable for everyone.
            </p>
            <div className="text-xs text-stone-400 pt-1">
              Developed as part of the Unified Mentor Full-Stack Internship Program.
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-white text-xs font-semibold uppercase tracking-wider mb-3">Marketplace</h4>
            <ul className="space-y-2 text-sm text-stone-400">
              <li>
                <button onClick={() => onNavigate('marketplace')} className="hover:text-amber-200">
                  Browse All Supplies
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('sell')} className="hover:text-amber-200">
                  List Your Supplies
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('swaps')} className="hover:text-amber-200">
                  Swap Proposals
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('dashboard')} className="hover:text-amber-200">
                  Artist Dashboard
                </button>
              </li>
            </ul>
          </div>

            {/* Safety & Local Community */}
            <div>
              <h4 className="text-white text-xs font-semibold uppercase tracking-wider mb-3">Community Hub</h4>
              <p className="text-xs text-stone-400 leading-relaxed mb-3">
                Direct peer-to-peer exchanges in Bengaluru, Yelahanka, Rajanukunte, and college campuses.
                Inspired by the creative learning ethos of institutions like the National Institute of Design, Lalit Kala Akademi, and the International Society of Education Through Art.
              </p>
              <div className="inline-flex items-center text-xs text-amber-200/90 font-medium bg-stone-800 px-2.5 py-1.5 rounded border border-stone-700">
                <span>Zero Platform Commission • Sustainable Reuse</span>
              </div>
            </div>
        </div>

        <div className="border-t border-stone-800 pt-6 flex flex-col sm:flex-row items-center justify-between text-xs text-stone-400">
          <p>© {new Date().getFullYear()} ArtLoop Marketplace • Academic & Portfolio Project</p>
          <p className="flex items-center space-x-1 mt-2 sm:mt-0">
            <span>Built with care for art students</span>
            <Heart className="w-3.5 h-3.5 text-[#C85A32] fill-current" />
          </p>
        </div>
      </div>
    </footer>
  );
};
