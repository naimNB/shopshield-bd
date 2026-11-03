import React, { useState } from 'react';
import { FileText, ShieldAlert, CheckCircle2, Info, Eye, Lock, ArrowRight } from 'lucide-react';
import { API_BASE_URL } from '../config';

export const VerificationPreview: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'promise' | 'payment' | 'courier'>('promise');

  return (
    <section id="preview" className="py-20 border-t border-slate-800/80 bg-slate-950/60">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-slate-900 border border-slate-700 text-xs text-slate-300 font-mono mb-3">
            <Info className="w-3.5 h-3.5 text-cyan-400" />
            <span>Task 01 Foundation • Architectural Preview</span>
          </div>
          <h2 className="text-3xl font-extrabold text-white tracking-tight sm:text-4xl">
            Interactive Platform Preview
          </h2>
          <p className="mt-3 text-slate-400 text-sm">
            Experience the intended workflow of ShopShield BD. In accordance with project safety guidelines,
            actual AI analysis and model inference will be integrated in upcoming tasks without generating
            misleading or fabricated scores.
          </p>
        </div>

        {/* Tab Navigation */}
        <div className="flex justify-center mb-8">
          <div className="inline-flex p-1 rounded-xl bg-slate-900 border border-slate-800">
            <button
              onClick={() => setActiveTab('promise')}
              className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all flex items-center space-x-2 ${
                activeTab === 'promise'
                  ? 'bg-emerald-500 text-white shadow-md shadow-emerald-500/20'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <FileText className="w-4 h-4" />
              <span>Purchase Promise Pass</span>
            </button>

            <button
              onClick={() => setActiveTab('payment')}
              className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all flex items-center space-x-2 ${
                activeTab === 'payment'
                  ? 'bg-emerald-500 text-white shadow-md shadow-emerald-500/20'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Lock className="w-4 h-4" />
              <span>Payment Safety Rules</span>
            </button>

            <button
              onClick={() => setActiveTab('courier')}
              className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all flex items-center space-x-2 ${
                activeTab === 'courier'
                  ? 'bg-emerald-500 text-white shadow-md shadow-emerald-500/20'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Eye className="w-4 h-4" />
              <span>Courier Parity Check</span>
            </button>
          </div>
        </div>

        {/* Tab Content */}
        <div className="max-w-4xl mx-auto rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl overflow-hidden">
          {/* Header Bar */}
          <div className="px-6 py-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <span className="w-3 h-3 rounded-full bg-rose-500/80 inline-block" />
              <span className="w-3 h-3 rounded-full bg-amber-500/80 inline-block" />
              <span className="w-3 h-3 rounded-full bg-emerald-500/80 inline-block" />
              <span className="text-xs font-mono text-slate-400 ml-2">shopshield://preview-module</span>
            </div>
            <div className="text-xs font-mono text-slate-400">
              State: <span className="text-emerald-400">Verified Architecture</span>
            </div>
          </div>

          <div className="p-6 md:p-8">
            {activeTab === 'promise' && (
              <div className="space-y-6">
                <div className="flex items-start justify-between border-b border-slate-800 pb-4">
                  <div>
                    <h3 className="text-lg font-bold text-white">Purchase Promise Certificate</h3>
                    <p className="text-xs text-slate-400">Codifying verbal chat agreements into structured terms</p>
                  </div>
                  <span className="px-2.5 py-1 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-xs font-mono">
                    Token: SSP-2026-DH-0842
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono">
                  <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                    <span className="text-slate-500 uppercase tracking-wider text-[10px]">Product & Seller</span>
                    <div className="text-slate-200 font-semibold text-sm">Mechanical Gaming Keyboard (RGB)</div>
                    <div className="text-slate-400">Seller: Dhaka Tech Gadget Hub (F-Commerce)</div>
                    <div className="text-slate-400">Listed Price: ৳ 3,850 BDT</div>
                  </div>

                  <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                    <span className="text-slate-500 uppercase tracking-wider text-[10px]">Warranty & Return Terms</span>
                    <div className="flex items-center space-x-1 text-emerald-400 font-medium">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>1-Year Official Replacement Warranty</span>
                    </div>
                    <div className="text-slate-400">Return Window: 7 Days for Factory Defects</div>
                    <div className="text-slate-400">Unboxing Inspection: Allowed before courier release</div>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800">
                  <div className="flex items-center space-x-2 text-slate-300 font-medium text-xs mb-2">
                    <Info className="w-4 h-4 text-emerald-400" />
                    <span>How this protects the buyer:</span>
                  </div>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Once codified, this token serves as irrefutable written proof of the seller's chat promises.
                    If the seller attempts to deliver a modified or unbranded substitute, the buyer has immediate
                    grounds to reject the consignment without forfeiture of delivery deposit.
                  </p>
                </div>
              </div>
            )}

            {activeTab === 'payment' && (
              <div className="space-y-6">
                <div className="flex items-start justify-between border-b border-slate-800 pb-4">
                  <div>
                    <h3 className="text-lg font-bold text-white">Payment Safety Advisory Rules</h3>
                    <p className="text-xs text-slate-400">Enforcing the Golden Rules of Bangladesh Online Commerce</p>
                  </div>
                  <span className="px-2.5 py-1 rounded bg-amber-500/10 text-amber-400 border border-amber-500/30 text-xs font-mono">
                    Standard Rulebook v1.0
                  </span>
                </div>

                <div className="space-y-3">
                  <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 flex items-start space-x-3">
                    <ShieldAlert className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                    <div className="text-xs">
                      <strong className="text-white block font-medium mb-0.5">
                        Rule 1: The ৳150 Delivery-Fee Advance Cap
                      </strong>
                      <span className="text-slate-400">
                        Never transfer more than standard courier charges (৳130–৳150 inside Dhaka, ৳180–৳200 outside Dhaka)
                        as an advance to a personal bKash/Nagad number. If a seller demands 50% or 100% advance for common goods,
                        flag as high risk.
                      </span>
                    </div>
                  </div>

                  <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 flex items-start space-x-3">
                    <ShieldAlert className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                    <div className="text-xs">
                      <strong className="text-white block font-medium mb-0.5">
                        Rule 2: Merchant Payment Gateway vs Personal 'Send Money'
                      </strong>
                      <span className="text-slate-400">
                        Authorized businesses provide bKash 'Payment' (01XXXXXXXXX) merchant accounts or payment links. Personal
                        'Send Money' transactions carry no dispute reversibility through standard consumer banking channels.
                      </span>
                    </div>
                  </div>

                  <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 flex items-start space-x-3">
                    <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                    <div className="text-xs">
                      <strong className="text-white block font-medium mb-0.5">
                        Rule 3: Cash on Delivery (COD) with Open Box Inspection
                      </strong>
                      <span className="text-slate-400">
                        Instruct the courier delivery partner that the parcel includes an open-box inspection condition.
                        Always record an uninterrupted video while unpacking the package.
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'courier' && (
              <div className="space-y-6">
                <div className="flex items-start justify-between border-b border-slate-800 pb-4">
                  <div>
                    <h3 className="text-lg font-bold text-white">Courier Parity Checklist</h3>
                    <p className="text-xs text-slate-400">Cross-checking consignment claims against real logistics networks</p>
                  </div>
                  <span className="px-2.5 py-1 rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 text-xs font-mono">
                    Integrated Logistics
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs font-mono">
                  <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800">
                    <div className="text-cyan-400 font-bold mb-1">Steadfast Courier</div>
                    <div className="text-slate-400">Consignment ID format validation</div>
                    <div className="text-slate-500 text-[10px] mt-2">API Integration: Scheduled</div>
                  </div>

                  <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800">
                    <div className="text-rose-400 font-bold mb-1">Pathao Courier</div>
                    <div className="text-slate-400">Parcel weight & recipient match</div>
                    <div className="text-slate-500 text-[10px] mt-2">API Integration: Scheduled</div>
                  </div>

                  <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800">
                    <div className="text-amber-400 font-bold mb-1">RedX Logistics</div>
                    <div className="text-slate-400">Real-time status milestone audit</div>
                    <div className="text-slate-500 text-[10px] mt-2">API Integration: Scheduled</div>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-400">
                  <strong className="text-white block mb-1">Anti-Spoofing Verification:</strong>
                  Scammers frequently share forged screenshots of courier slips created via graphic editors. ShopShield BD's
                  logistics verification engine pings the official courier tracking gateway to confirm actual parcel custody.
                </div>
              </div>
            )}
          </div>

          {/* Footer banner inside card */}
          <div className="px-6 py-4 bg-slate-950/90 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-400 gap-2">
            <span className="font-mono">
              Next Step: Multimodal AI Parser (Task 02)
            </span>
            <a
              href={`${API_BASE_URL}/docs`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-emerald-400 hover:text-emerald-300 font-semibold flex items-center space-x-1"
            >
              <span>Explore Backend Endpoints</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>
      </div>
    </section>
  );
};
