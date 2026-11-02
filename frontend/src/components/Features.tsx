import React from 'react';
import { Camera, CreditCard, ShieldCheck, Truck, Scale, Users } from 'lucide-react';

export const Features: React.FC = () => {
  const features = [
    {
      icon: <Camera className="w-6 h-6 text-emerald-400" />,
      title: "Multimodal Chat & Invoice Auditing",
      description:
        "Upload screenshots of Facebook Messenger, WhatsApp discussions, or handwritten memo receipts. The multimodal pipeline extracts exact product specs, warranty claims, and return policies.",
      badge: "Core AI Engine",
    },
    {
      icon: <CreditCard className="w-6 h-6 text-amber-400" />,
      title: "bKash & Nagad Payment Risk Radar",
      description:
        "Detects whether payment requests target personal 'Send Money' numbers or authorized merchant gateways. Guides buyers to avoid full advance transfers.",
      badge: "Payment Safety",
    },
    {
      icon: <ShieldCheck className="w-6 h-6 text-teal-400" />,
      title: "Verifiable Promise Pass",
      description:
        "Transforms ambiguous chat conversations into a clear, tamper-evident digital certificate that both parties can reference during delivery or warranty claims.",
      badge: "Dispute Defense",
    },
    {
      icon: <Truck className="w-6 h-6 text-cyan-400" />,
      title: "Courier Parity Verification",
      description:
        "Cross-references tracking numbers against Steadfast, Pathao, and RedX consignment schemas to detect spoofed receipts and ensure the parcel is actually in transit.",
      badge: "Logistics Check",
    },
    {
      icon: <Scale className="w-6 h-6 text-indigo-400" />,
      title: "DNCRP Consumer Rights Alignment",
      description:
        "Structures purchase evidence in accordance with the Directorate of National Consumer Rights Protection (DNCRP) standards for faster formal resolution if fraud occurs.",
      badge: "Legal Readiness",
    },
    {
      icon: <Users className="w-6 h-6 text-rose-400" />,
      title: "Community Fraud Signal Database",
      description:
        "Aggregates crowdsourced scam reports on suspicious Facebook pages, fraudulent phone numbers, and repeat offenders across Bangladesh's e-commerce landscape.",
      badge: "Crowd Defense",
    },
  ];

  return (
    <section id="features" className="py-20 border-t border-slate-800/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <h2 className="text-xs font-bold uppercase tracking-widest text-emerald-400 mb-2">
            Engineered for Bangladesh Commerce
          </h2>
          <p className="text-3xl font-extrabold text-white tracking-tight sm:text-4xl">
            A Complete Safety Net for Online Purchases
          </p>
          <p className="mt-3 text-slate-400 text-sm">
            ShopShield BD combines multimodal intelligence with real-world Bangladesh commerce protocols to keep your transactions secure.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, idx) => (
            <div
              key={idx}
              className="p-6 rounded-2xl bg-slate-900/50 border border-slate-800/80 hover:border-slate-700 hover:bg-slate-900/80 transition-all duration-200 group flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 rounded-xl bg-slate-800 flex items-center justify-center group-hover:scale-105 transition-transform">
                    {feature.icon}
                  </div>
                  <span className="text-[11px] font-mono font-medium px-2.5 py-1 rounded-full bg-slate-800/80 text-slate-300 border border-slate-700/50">
                    {feature.badge}
                  </span>
                </div>
                <h3 className="text-lg font-semibold text-white mb-2 group-hover:text-emerald-300 transition-colors">
                  {feature.title}
                </h3>
                <p className="text-sm text-slate-400 leading-relaxed">
                  {feature.description}
                </p>
              </div>

              <div className="mt-6 pt-4 border-t border-slate-800/50 flex items-center text-xs text-slate-500 font-mono">
                <span>Phase: Architecture Ready</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
