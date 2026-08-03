import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, User, Phone, Tag, AlignLeft } from 'lucide-react';
import { Player } from '../types';
import { App as CapacitorApp } from "@capacitor/app";

interface AddEditPlayerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (playerData: Omit<Player, 'id'>, editId?: string) => void;
  editPlayer?: Player;
  existingPlayerIds: string[];
  agencies: string[];
}

export default function AddEditPlayerModal({
  isOpen,
  onClose,
  onSave,
  editPlayer,
  existingPlayerIds,
  agencies,
}: AddEditPlayerModalProps) {
  const [playerId, setPlayerId] = useState('');
  const [nickName, setNickName] = useState('');
  const [agency, setAgency] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [remark, setRemark] = useState('');
  const [error, setError] = useState('');

  const availableAgencies = useMemo(() => {
    const unique = new Set<string>(agencies.filter(Boolean));
    if (editPlayer?.agency) unique.add(editPlayer.agency);
    return Array.from(unique);
  }, [agencies, editPlayer]);

  useEffect(() => {
  if (!isOpen) return;

  const listener = CapacitorApp.addListener("backButton", () => {
    onClose();
  });

  return () => {
    listener.then(l => l.remove());
  };
}, [isOpen, onClose]);

  useEffect(() => {
    if (editPlayer) {
      setPlayerId(editPlayer.playerId);
      setNickName(editPlayer.nickName);
      setAgency(editPlayer.agency);
      setPhoneNumber(editPlayer.phoneNumber);
      setRemark(editPlayer.remark);
    } else if (availableAgencies.length === 1) {
      setPlayerId('');
      setNickName('');
      setAgency(availableAgencies[0]);
      setPhoneNumber('');
      setRemark('');
    } else {
      setPlayerId('');
      setNickName('');
      setAgency('');
      setPhoneNumber('');
      setRemark('');
    }
    setError('');
  }, [editPlayer, isOpen, availableAgencies]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!playerId.trim()) {
      setError('Player ID is required');
      return;
    }
    if (!nickName.trim()) {
      setError('Nick name is required');
      return;
    }
    if (!agency.trim()) {
      setError('Agency is required');
      return;
    }

    // Check uniqueness of playerId if creating or changing playerId
    const isDuplicate = existingPlayerIds.some(
      (id) => id.toLowerCase() === playerId.trim().toLowerCase() && (!editPlayer || editPlayer.playerId.toLowerCase() !== id.toLowerCase())
    );

    if (isDuplicate) {
      setError('This Player ID already exists');
      return;
    }

    onSave(
      {
        playerId: playerId.trim(),
        nickName: nickName.trim(),
        agency: agency.trim(),
        phoneNumber: phoneNumber.trim(),
        remark: remark.trim(),
      },
      editPlayer?.id
    );
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
          />

          {/* Modal Container */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 15 }}
            className="relative w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-xl border border-slate-100"
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50 px-6 py-4">
              <h3 className="text-lg font-semibold text-slate-800 font-display">
                {editPlayer ? 'Edit Player' : 'Add New Player'}
              </h3>
              <button
                type="button"
                onClick={onClose}
                className="rounded-full p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {error && (
                <div className="rounded-lg bg-red-50 p-3 text-xs font-medium text-red-600 border border-red-100">
                  {error}
                </div>
              )}

              {/* Player ID */}
              <div>
                <label className="block text-xs font-medium text-slate-500 uppercase tracking-wider mb-1.5">
                  Player ID *
                </label>
                <div className="relative rounded-lg shadow-xs">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <User className="h-4 w-4 text-slate-400" />
                  </div>
                  <input
                    type="text"
                    value={playerId}
                    onChange={(e) => setPlayerId(e.target.value)}
                    placeholder="e.g. Hein40"
                    disabled={!!editPlayer}
                    className="block w-full pl-10 pr-3 py-2.5 bg-slate-50 text-slate-800 placeholder-slate-400 text-sm rounded-lg border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:bg-white disabled:bg-slate-100 disabled:text-slate-400 transition-all"
                  />
                </div>
              </div>

              {/* Nick Name */}
              <div>
                <label className="block text-xs font-medium text-slate-500 uppercase tracking-wider mb-1.5">
                  Nick Name *
                </label>
                <div className="relative rounded-lg shadow-xs">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Tag className="h-4 w-4 text-slate-400" />
                  </div>
                  <input
                    type="text"
                    value={nickName}
                    onChange={(e) => setNickName(e.target.value)}
                    placeholder="e.g. Hein40"
                    className="block w-full pl-10 pr-3 py-2.5 bg-slate-50 text-slate-800 placeholder-slate-400 text-sm rounded-lg border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:bg-white transition-all"
                  />
                </div>
              </div>

              {/* Agency */}
              <div>
                <label className="block text-xs font-medium text-slate-500 uppercase tracking-wider mb-1.5">
                  Agency *
                </label>
                <div className="relative rounded-lg shadow-xs">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <AlignLeft className="h-4 w-4 text-slate-400" />
                  </div>
                  <select
                    value={agency}
                    onChange={(e) => setAgency(e.target.value)}
                    className="block w-full pl-10 pr-3 py-2.5 bg-slate-50 text-slate-800 text-sm rounded-lg border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:bg-white transition-all"
                  >
                    <option value="" disabled>
                      {availableAgencies.length === 0 ? 'No agencies available' : 'Select an agency'}
                    </option>
                    {availableAgencies.map((name) => (
                      <option key={name} value={name}>
                        {name}
                      </option>
                    ))}
                  </select>
                </div>
                {availableAgencies.length === 0 && (
                  <p className="mt-2 text-[11px] text-slate-500">No agencies available. Add a player with an agency from existing data first.</p>
                )}
              </div>

              {/* Phone Number */}
              <div>
                <label className="block text-xs font-medium text-slate-500 uppercase tracking-wider mb-1.5">
                  Phone Number
                </label>
                <div className="relative rounded-lg shadow-xs">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Phone className="h-4 w-4 text-slate-400" />
                  </div>
                  <input
                    type="text"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    placeholder="e.g. 09-xxxxxxxxx"
                    className="block w-full pl-10 pr-3 py-2.5 bg-slate-50 text-slate-800 placeholder-slate-400 text-sm rounded-lg border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:bg-white transition-all"
                  />
                </div>
              </div>

              {/* Remark */}
              <div>
                <label className="block text-xs font-medium text-slate-500 uppercase tracking-wider mb-1.5">
                  Remark
                </label>
                <textarea
                  value={remark}
                  onChange={(e) => setRemark(e.target.value)}
                  placeholder="Add player notes here..."
                  rows={3}
                  className="block w-full p-3 bg-slate-50 text-slate-800 placeholder-slate-400 text-sm rounded-lg border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:bg-white transition-all resize-none"
                />
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end space-x-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 rounded-lg transition-colors border border-slate-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm transition-colors cursor-pointer"
                >
                  Save Player
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
