import { Claim } from '../lib/api';
import { Box, Link as LinkIcon, Hash, CheckCircle, XCircle, Clock } from 'lucide-react';
import { format, parseISO } from 'date-fns';

interface LedgerBlockProps {
  claim: Claim;
  isFirst: boolean;
}

export default function LedgerBlock({ claim, isFirst }: LedgerBlockProps) {
  const truncate = (hash: string) => hash ? `${hash.substring(0, 12)}...` : 'N/A';
  
  return (
    <div className="relative">
      {!isFirst && (
        <div className="absolute top-0 left-8 -mt-8 h-8 w-0.5 bg-dark-600 flex items-center justify-center">
          <LinkIcon className="w-4 h-4 text-dark-500 bg-dark-900 rounded-full" />
        </div>
      )}
      
      <div className="bg-dark-800 border border-dark-700 rounded-xl p-5 shadow-lg hover:border-primary-600/50 transition-colors">
        <div className="flex justify-between items-start mb-4">
          <div className="flex items-center gap-3">
            <div className="bg-dark-900 border border-dark-600 rounded-lg w-16 h-16 flex flex-col items-center justify-center">
              <Box className="w-5 h-5 text-slate-400 mb-1" />
              <span className="text-xs font-mono text-slate-300">#{claim.block_index}</span>
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">{claim.claim_id}</h3>
              <div className="flex items-center gap-2 text-sm text-slate-400 mt-1">
                <Clock className="w-3 h-3" />
                {format(parseISO(claim.created_at), 'MMM dd, yyyy HH:mm:ss')}
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            {claim.eligible && (
              <span className="px-3 py-1 rounded-full text-xs font-mono font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                ₹{(claim.payout_amount || 120700).toLocaleString('en-IN')}
              </span>
            )}
            <div className={`px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1 ${claim.eligible ? 'bg-success/20 text-success border border-success/30' : 'bg-danger/20 text-danger border border-danger/30'}`}>
              {claim.eligible ? <CheckCircle className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
              {claim.eligible ? 'ELIGIBLE' : 'REJECTED'}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-dark-900/50 p-4 rounded-lg font-mono text-xs">
          <div>
            <div className="text-slate-500 mb-1 flex items-center gap-1"><Hash className="w-3 h-3"/> Block Hash</div>
            <div className="text-primary-400 font-semibold">{truncate(claim.block_hash)}</div>
          </div>
          <div>
            <div className="text-slate-500 mb-1 flex items-center gap-1"><Hash className="w-3 h-3"/> Claim Payout</div>
            <div className="text-emerald-400 font-semibold">
              {claim.eligible ? `₹${(claim.payout_amount || 120700).toLocaleString('en-IN')}` : '₹0 (Below Threshold)'}
            </div>
          </div>
          <div>
            <div className="text-slate-500 mb-1 flex items-center gap-1"><Hash className="w-3 h-3"/> Previous Hash</div>
            <div className="text-slate-300">{truncate(claim.previous_block_hash)}</div>
          </div>
          <div>
            <div className="text-slate-500 mb-1 flex items-center gap-1"><Hash className="w-3 h-3"/> ZK Proof Hash</div>
            <div className="text-slate-300">{truncate(claim.zk_proof_hash)}</div>
          </div>
          <div>
            <div className="text-slate-500 mb-1 flex items-center gap-1"><Hash className="w-3 h-3"/> Evidence Hash</div>
            <div className="text-slate-300">{truncate(claim.satellite_evidence_hash)}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
