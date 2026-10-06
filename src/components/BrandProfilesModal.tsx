import React from 'react';
import { X, HeartPulse, Sparkles, UserCheck, CheckCircle2, Shield, ArrowRight } from 'lucide-react';
import { BRANDS } from '../data/brands';

interface BrandProfilesModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const BrandProfilesModal: React.FC<BrandProfilesModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-4xl w-full shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-4 sm:p-6 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-800/80">
          <div>
            <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white flex items-center space-x-2">
              <Shield className="w-5 h-5 text-indigo-500" />
              <span>Three Medical Brands & In-House Experts</span>
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              PR & SEO Pitching Matrix under Single Healthcare CEO Portfolio
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Brand Cards */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* 1. Performance P-Wave */}
            <div className="p-4 rounded-xl border border-emerald-200 dark:border-emerald-800/80 bg-emerald-50/40 dark:bg-emerald-950/20 flex flex-col justify-between">
              <div>
                <div className="flex items-center space-x-2 mb-2">
                  <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center font-bold text-xs">
                    <HeartPulse className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-emerald-950 dark:text-emerald-300">
                      Performance P-Wave
                    </h3>
                    <p className="text-[11px] text-emerald-700 dark:text-emerald-400">
                      Men's Sexual Health & Performance
                    </p>
                  </div>
                </div>

                <div className="space-y-2.5 text-xs text-slate-700 dark:text-slate-300 mb-4">
                  <div className="bg-white/80 dark:bg-slate-900/80 p-2.5 rounded-lg border border-emerald-100 dark:border-emerald-900">
                    <span className="font-semibold text-slate-900 dark:text-white block text-[11px]">
                      In-House Expert:
                    </span>
                    <p className="font-medium text-emerald-800 dark:text-emerald-300">
                      Dr. Croley, Medical Director & Men's Sexual Health Specialist
                    </p>
                  </div>

                  <div>
                    <span className="font-semibold text-slate-900 dark:text-white block text-[11px] mb-1">
                      Target Query Topics (Step 2):
                    </span>
                    <ul className="space-y-1 text-[11px] text-slate-600 dark:text-slate-400">
                      <li>• Vasculogenic ED & acoustic wave shockwave therapy</li>
                      <li>• Peyronie's disease non-surgical treatments</li>
                      <li>• Testosterone & male vascular vitality</li>
                    </ul>
                  </div>
                </div>
              </div>

              <div className="pt-2 border-t border-emerald-200 dark:border-emerald-800 text-[10px] text-emerald-800 dark:text-emerald-300 font-medium">
                Route: Sexual health / ED / Men's performance queries
              </div>
            </div>

            {/* 2. Skin & Tonic */}
            <div className="p-4 rounded-xl border border-rose-200 dark:border-rose-800/80 bg-rose-50/40 dark:bg-rose-950/20 flex flex-col justify-between">
              <div>
                <div className="flex items-center space-x-2 mb-2">
                  <div className="w-8 h-8 rounded-lg bg-rose-600 text-white flex items-center justify-center font-bold text-xs">
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-rose-950 dark:text-rose-300">
                      Skin & Tonic
                    </h3>
                    <p className="text-[11px] text-rose-700 dark:text-rose-400">
                      Medical Spa & Aesthetic Medicine
                    </p>
                  </div>
                </div>

                <div className="space-y-2.5 text-xs text-slate-700 dark:text-slate-300 mb-4">
                  <div className="bg-white/80 dark:bg-slate-900/80 p-2.5 rounded-lg border border-rose-100 dark:border-rose-900">
                    <span className="font-semibold text-slate-900 dark:text-white block text-[11px]">
                      In-House Expert:
                    </span>
                    <p className="font-medium text-rose-800 dark:text-rose-300">
                      Rixie & Medical Aesthetics Team (Lead Aesthetic Practitioner)
                    </p>
                  </div>

                  <div>
                    <span className="font-semibold text-slate-900 dark:text-white block text-[11px] mb-1">
                      Target Query Topics (Step 2):
                    </span>
                    <ul className="space-y-1 text-[11px] text-slate-600 dark:text-slate-400">
                      <li>• Botox, neurotoxins & subtle preventative micro-dosing</li>
                      <li>• Dermal fillers & facial contouring</li>
                      <li>• Chemical peels, RF microneedling, skin barrier repair</li>
                    </ul>
                  </div>
                </div>
              </div>

              <div className="pt-2 border-t border-rose-200 dark:border-rose-800 text-[10px] text-rose-800 dark:text-rose-300 font-medium">
                Route: Skincare / Injectables / Aesthetics / Medspa queries
              </div>
            </div>

            {/* 3. Dr. Croley's */}
            <div className="p-4 rounded-xl border border-blue-200 dark:border-blue-800/80 bg-blue-50/40 dark:bg-blue-950/20 flex flex-col justify-between">
              <div>
                <div className="flex items-center space-x-2 mb-2">
                  <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center font-bold text-xs">
                    <UserCheck className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-blue-950 dark:text-blue-300">
                      Dr. Croley's
                    </h3>
                    <p className="text-[11px] text-blue-700 dark:text-blue-400">
                      Primary Care & Family Practice
                    </p>
                  </div>
                </div>

                <div className="space-y-2.5 text-xs text-slate-700 dark:text-slate-300 mb-4">
                  <div className="bg-white/80 dark:bg-slate-900/80 p-2.5 rounded-lg border border-blue-100 dark:border-blue-900">
                    <span className="font-semibold text-slate-900 dark:text-white block text-[11px]">
                      In-House Expert:
                    </span>
                    <p className="font-medium text-blue-800 dark:text-blue-300">
                      Dr. Croley, MD, Board-Certified Physician
                    </p>
                  </div>

                  <div>
                    <span className="font-semibold text-slate-900 dark:text-white block text-[11px] mb-1">
                      Target Query Topics (Step 2):
                    </span>
                    <ul className="space-y-1 text-[11px] text-slate-600 dark:text-slate-400">
                      <li>• Preventive medicine & comprehensive lab panels</li>
                      <li>• Cardiovascular, metabolic health, hypertension</li>
                      <li>• Longevity, lifestyle medicine & holistic wellness</li>
                    </ul>
                  </div>
                </div>
              </div>

              <div className="pt-2 border-t border-blue-200 dark:border-blue-800 text-[10px] text-blue-800 dark:text-blue-300 font-medium">
                Route: General health / Preventive / Family health queries
              </div>
            </div>
          </div>

          {/* Workflow Rules Reminder */}
          <div className="p-4 bg-slate-100 dark:bg-slate-800/60 rounded-xl text-xs text-slate-700 dark:text-slate-300 space-y-2">
            <h4 className="font-bold text-slate-900 dark:text-white flex items-center space-x-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              <span>Standard PR Governance Rules:</span>
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
              <div>
                <strong>Rejection Filter:</strong> Reject if query bans PR pitches, requires credentials none of the brands possess, or is completely off-topic.
              </div>
              <div>
                <strong>AI Restriction:</strong> If reporter specifies "No AI pitches considered", output "MANUAL PITCH REQUIRED" and skip drafting.
              </div>
              <div>
                <strong>Pitch Style:</strong> 1-2 sentence lead teaser insight, real expert title, deadline availability, human PR voice without buzzwords.
              </div>
              <div>
                <strong>Draft Safety:</strong> Always save as Gmail Drafts for human review. Never auto-send.
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-right">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-semibold"
          >
            Got it, Back to Pitching
          </button>
        </div>
      </div>
    </div>
  );
};
