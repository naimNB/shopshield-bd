import React from 'react';
import { XCircle, CheckCircle2, ShieldAlert, Sparkles } from 'lucide-react';

export const ProblemSolution: React.FC = () => {
  return (
    <section id="problem-solution" className="py-20 border-t border-slate-800/80 bg-slate-950/40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <h2 className="text-xs font-bold uppercase tracking-widest text-emerald-400 mb-2">
            The Reality of Social Commerce in Bangladesh
          </h2>
          <p className="text-3xl font-extrabold text-white tracking-tight sm:text-4xl">
            Why Everyday Shoppers Lose Money Online
          </p>
          <p className="mt-3 text-slate-400 text-sm">
            Over 60% of social media e-commerce transactions in Bangladesh take place over unstructured chats
            with zero formal contracts. Here is how ShopShield BD bridges the trust gap.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-stretch">
          {/* The Vulnerability (Without ShopShield) */}
          <div className="p-8 rounded-2xl bg-rose-950/10 border border-rose-900/30 flex flex-col justify-between">
            <div>
              <div className="flex items-center space-x-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-rose-500/20 text-rose-400 flex items-center justify-center">
                  <ShieldAlert className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white">The Unprotected Buyer</h3>
                  <p className="text-xs text-rose-400/80 font-mono">Current F-Commerce Vulnerabilities</p>
                </div>
              </div>

              <ul className="space-y-4 text-sm text-slate-300">
                <li className="flex items-start space-x-3">
                  <XCircle className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />
                  <span>
                    <strong className="text-rose-200">Full Advance bKash/Nagad Demand:</strong> Seller insists on 50%–100% advance to a personal number, then blocks the buyer immediately.
                  </span>
                </li>
                <li className="flex items-start space-x-3">
                  <XCircle className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />
                  <span>
                    <strong className="text-rose-200">Ghost Warranties & Broken Promises:</strong> Seller claims "1 Year Official Warranty" in chat, but later denies responsibility when the product fails.
                  </span>
                </li>
                <li className="flex items-start space-x-3">
                  <XCircle className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />
                  <span>
                    <strong className="text-rose-200">Counterfeit & Condition Mismatch:</strong> Counterfeit replica delivered inside a sealed courier parcel without unboxing inspection permission.
                  </span>
                </li>
                <li className="flex items-start space-x-3">
                  <XCircle className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />
                  <span>
                    <strong className="text-rose-200">Fake Courier Consignment Notes:</strong> Scammers send photoshopped Steadfast or Pathao receipts to extract remaining balance before shipment.
                  </span>
                </li>
              </ul>
            </div>

            <div className="mt-8 pt-6 border-t border-rose-900/20 text-xs text-rose-300/70 font-mono">
              ⚠️ Result: Millions in unrecoverable losses and eroded consumer confidence.
            </div>
          </div>

          {/* The Protection (With ShopShield BD) */}
          <div className="p-8 rounded-2xl bg-emerald-950/20 border border-emerald-800/40 flex flex-col justify-between">
            <div>
              <div className="flex items-center space-x-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white">The ShopShield BD Shield</h3>
                  <p className="text-xs text-emerald-400/80 font-mono">AI-Verified Purchase Promises</p>
                </div>
              </div>

              <ul className="space-y-4 text-sm text-slate-200">
                <li className="flex items-start space-x-3">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                  <span>
                    <strong className="text-emerald-300">Payment Risk Assessment:</strong> Distinguishes personal P2P numbers from registered merchant wallets and enforces safe delivery-fee-only rules.
                  </span>
                </li>
                <li className="flex items-start space-x-3">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                  <span>
                    <strong className="text-emerald-300">Structured Promise Certificate:</strong> Extracts chat messages into an immutable agreement listing return policy, warranty, and condition.
                  </span>
                </li>
                <li className="flex items-start space-x-3">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                  <span>
                    <strong className="text-emerald-300">Inspection & Condition Protocols:</strong> Generates pre-delivery unboxing guidelines and courier dispute checklists for the buyer.
                  </span>
                </li>
                <li className="flex items-start space-x-3">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                  <span>
                    <strong className="text-emerald-300">Real-Time Courier Parity:</strong> Verifies live tracking IDs against courier APIs to confirm genuine package dispatch.
                  </span>
                </li>
              </ul>
            </div>

            <div className="mt-8 pt-6 border-t border-emerald-800/30 text-xs text-emerald-400 font-mono">
              🛡️ Result: Every commitment codified, transparent payments, zero surprises.
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
