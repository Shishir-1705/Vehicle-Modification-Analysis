"use client";

import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, X, ExternalLink, FileDown, ShieldCheck, ShieldAlert, Car, Calendar } from 'lucide-react';
import { getHistory, lookupVehicle, getExportCsvUrl, ScanResult } from '@/lib/api';

export const DetectionHistory: React.FC = () => {
  const [searchPlate, setSearchPlate] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'modified' | 'stock'>('all');
  const [results, setResults] = useState<ScanResult[]>([]);
  const [rcData, setRcData] = useState<any>(null);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  const doSearch = useCallback(async (p = 1) => {
    setLoading(true);
    setSearched(true);
    try {
      const params: any = { page: p, limit: 15 };
      if (searchPlate.trim()) params.plate = searchPlate.trim();
      if (filterStatus !== 'all') params.status = filterStatus;

      const data = await getHistory(params);
      setResults(data.results);
      setTotal(data.total);
      setPage(data.page);
      setPages(data.pages);

      // If plate searched, also look up RC data
      if (searchPlate.trim()) {
        try {
          const vehicle = await lookupVehicle(searchPlate.trim());
          setRcData(vehicle.rc_data);
        } catch { setRcData(null); }
      } else {
        setRcData(null);
      }
    } catch (e) {
      console.error('History search failed:', e);
    } finally {
      setLoading(false);
    }
  }, [searchPlate, filterStatus]);

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex justify-between items-center mb-10">
        <div>
          <h2 className="text-3xl font-black tracking-tight mb-2 uppercase">Detection History</h2>
          <p className="text-slate-500 text-sm">Search by plate number or browse all scan records.</p>
        </div>
        <a
          href={getExportCsvUrl(30)}
          download
          className="flex items-center space-x-2 px-5 py-2.5 bg-primary/10 border border-primary/30 text-primary rounded-xl hover:bg-primary/20 transition-all"
        >
          <FileDown className="w-4 h-4" />
          <span className="text-xs font-black uppercase tracking-widest">Export CSV (30d)</span>
        </a>
      </div>

      {/* Search Bar */}
      <div className="glass-card p-6 mb-8">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input
              value={searchPlate}
              onChange={e => setSearchPlate(e.target.value.toUpperCase())}
              onKeyDown={e => e.key === 'Enter' && doSearch(1)}
              placeholder="Search plate number (e.g. KA01HH1234)"
              className="w-full bg-black/40 border border-white/10 rounded-xl pl-11 pr-4 py-3 text-sm focus:border-primary/50 outline-none transition-all font-mono tracking-wider"
            />
            {searchPlate && (
              <button
                onClick={() => { setSearchPlate(''); setRcData(null); }}
                className="absolute right-3 top-1/2 -translate-y-1/2"
              >
                <X className="w-4 h-4 text-slate-500 hover:text-white" />
              </button>
            )}
          </div>

          {/* Status filter */}
          <div className="flex gap-2">
            {(['all', 'modified', 'stock'] as const).map(s => (
              <button
                key={s}
                onClick={() => setFilterStatus(s)}
                className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-widest transition-all border ${
                  filterStatus === s
                    ? 'bg-primary text-black border-primary'
                    : 'bg-white/5 text-slate-400 border-white/10 hover:bg-white/10'
                }`}
              >
                {s}
              </button>
            ))}
          </div>

          <button
            onClick={() => doSearch(1)}
            disabled={loading}
            className="px-6 py-3 bg-primary text-black font-black text-xs uppercase tracking-widest rounded-xl hover:bg-primary/90 disabled:opacity-50 transition-all"
          >
            {loading ? 'Searching...' : 'Search'}
          </button>
        </div>
      </div>

      {/* RC Data Card (shown when plate is matched) */}
      <AnimatePresence>
        {rcData && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="glass-card p-6 mb-8 border border-primary/20 bg-primary/5"
          >
            <h3 className="text-xs font-black uppercase tracking-[0.2em] text-primary mb-5">
              RC Information — {searchPlate}
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                ['Owner', rcData.owner_masked],
                ['Manufacturer', rcData.manufacturer],
                ['Model', rcData.vehicle_model],
                ['Fuel Type', rcData.fuel_type],
                ['Vehicle Class', rcData.vehicle_class],
                ['Reg. Date', rcData.registration_date],
                ['Insurance Valid Till', rcData.insurance_valid_till],
              ].map(([label, value]) => (
                <div key={label} className="bg-black/30 p-3 rounded-xl border border-white/5">
                  <p className="text-[9px] font-bold uppercase text-slate-500 mb-1">{label}</p>
                  <p className="text-sm font-bold text-white">{value || 'N/A'}</p>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Results */}
      {searched && (
        <div>
          <div className="flex justify-between items-center mb-4">
            <p className="text-xs text-slate-500 font-bold uppercase tracking-widest">
              {total} record{total !== 1 ? 's' : ''} found
            </p>
          </div>

          {results.length === 0 ? (
            <div className="glass-card p-12 text-center text-slate-500">
              <Search className="w-10 h-10 mx-auto mb-4 opacity-30" />
              <p className="text-sm font-bold">No records found</p>
            </div>
          ) : (
            <div className="space-y-3">
              {results.map(scan => (
                <motion.div
                  key={scan.id}
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="glass-card p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 group"
                >
                  <div className="flex items-center space-x-4">
                    <div className={`p-2.5 rounded-xl ${scan.status === 'modified' ? 'bg-red-500/10 text-red-400' : 'bg-green-500/10 text-green-400'}`}>
                      {scan.status === 'modified' ? <ShieldAlert className="w-5 h-5" /> : <ShieldCheck className="w-5 h-5" />}
                    </div>
                    <div>
                      <p className="font-mono font-black text-white tracking-widest text-sm">
                        {scan.plate_number || '—'}
                      </p>
                      <p className="text-[10px] text-slate-500">{scan.vehicle_model || 'Unknown vehicle'}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-6 text-xs text-slate-400">
                    <div className="flex items-center space-x-1.5">
                      <Car className="w-3.5 h-3.5" />
                      <span className={`font-bold uppercase ${scan.status === 'modified' ? 'text-red-400' : 'text-green-400'}`}>
                        {scan.status}
                      </span>
                    </div>
                    <div className="flex items-center space-x-1.5">
                      <span className="font-bold">{(scan.binary_confidence * 100).toFixed(1)}%</span>
                      <span className="text-slate-600">confidence</span>
                    </div>
                    <div className="flex items-center space-x-1.5">
                      <Calendar className="w-3.5 h-3.5" />
                      <span>{new Date(scan.scanned_at).toLocaleDateString('en-IN')}</span>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}

          {/* Pagination */}
          {pages > 1 && (
            <div className="flex justify-center gap-2 mt-8">
              <button
                disabled={page <= 1}
                onClick={() => doSearch(page - 1)}
                className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-xs font-bold disabled:opacity-30 hover:bg-white/10 transition-all"
              >
                ← Prev
              </button>
              <span className="px-4 py-2 text-xs text-slate-400">
                {page} / {pages}
              </span>
              <button
                disabled={page >= pages}
                onClick={() => doSearch(page + 1)}
                className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-xs font-bold disabled:opacity-30 hover:bg-white/10 transition-all"
              >
                Next →
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
