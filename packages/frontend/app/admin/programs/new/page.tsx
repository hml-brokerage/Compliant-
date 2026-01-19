'use client';

import { useAuth } from '../../../../lib/auth/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import apiClient from '../../../../lib/api/client';
import { CONSTRUCTION_TRADES_ARRAY } from '@compliant/shared';

export default function NewProgramPage() {
  const { user, loading, isAuthenticated } = useAuth();
  const router = useRouter();

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isTemplate, setIsTemplate] = useState(true);
  const [requiresHoldHarmless, setRequiresHoldHarmless] = useState(false);
  const [requiresAdditionalInsured, setRequiresAdditionalInsured] = useState(true);
  const [requiresWaiverSubrogation, setRequiresWaiverSubrogation] = useState(true);
  const [glPerOccurrence, setGlPerOccurrence] = useState<string>('');
  const [glAggregate, setGlAggregate] = useState<string>('');
  const [wcMinimum, setWcMinimum] = useState<string>('');
  const [autoMinimum, setAutoMinimum] = useState<string>('');
  const [holdHarmlessTemplateUrl, setHoldHarmlessTemplateUrl] = useState('');
  const [holdHarmlessFile, setHoldHarmlessFile] = useState<File | null>(null);
  const [programPdfFile, setProgramPdfFile] = useState<File | null>(null);
  const [extractingPdf, setExtractingPdf] = useState(false);
  const [uploadingFile, setUploadingFile] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [tiers, setTiers] = useState<Array<{ name: string; glPerOccurrence: string; glAggregate: string; umbrellaMinimum: string; isRest: boolean; trades: string[] }>>([]);
  const [showTierForm, setShowTierForm] = useState(false);
  const [expandedTierIndex, setExpandedTierIndex] = useState<number | null>(null);
  const [newTierName, setNewTierName] = useState('');
  const [newTierGl, setNewTierGl] = useState('');
  const [newTierUmbrella, setNewTierUmbrella] = useState('');
  const [newTierUmbrellaMin, setNewTierUmbrellaMin] = useState('');

  // Get trades already assigned to earlier tiers
  const getAssignedTrades = (currentTierIndex: number): Set<string> => {
    const assigned = new Set<string>();
    for (let i = 0; i < currentTierIndex; i++) {
      tiers[i].trades.forEach(trade => assigned.add(trade));
    }
    return assigned;
  };

  // Get available trades for a tier (excluding those in earlier tiers)
  const getAvailableTrades = (tierIndex: number): string[] => {
    const assigned = getAssignedTrades(tierIndex);
    return CONSTRUCTION_TRADES_ARRAY.filter(trade => !assigned.has(trade));
  };

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.push('/login');
    }
  }, [loading, isAuthenticated, router]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return null;
  }

  const handleProgramPdfUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type !== 'application/pdf') {
      setError('Please upload a PDF file');
      return;
    }

    setProgramPdfFile(file);
    setExtractingPdf(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await apiClient.post('/programs/extract/from-pdf', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      const extracted = response.data;
      
      // Auto-populate form fields
      if (extracted.name) setName(extracted.name);
      if (extracted.description) setDescription(extracted.description);
      if (extracted.wcMinimum) setWcMinimum(extracted.wcMinimum.toString());
      if (extracted.autoMinimum) setAutoMinimum(extracted.autoMinimum.toString());
      
      if (extracted.requiresHoldHarmless !== undefined) setRequiresHoldHarmless(extracted.requiresHoldHarmless);
      if (extracted.requiresAdditionalInsured !== undefined) setRequiresAdditionalInsured(extracted.requiresAdditionalInsured);
      if (extracted.requiresWaiverSubrogation !== undefined) setRequiresWaiverSubrogation(extracted.requiresWaiverSubrogation);

      const message = `PDF extracted successfully! Confidence: ${(extracted.confidence * 100).toFixed(0)}%. Please review all fields before submitting.`;
      setSuccessMessage(message);
    } catch (err: any) {
      const errorMsg = err?.response?.data?.message || err?.message || 'Failed to extract PDF. Please fill in the fields manually.';
      setError(errorMsg);
      console.error('PDF extraction error:', err?.response?.data || err);
    } finally {
      setExtractingPdf(false);
    }
  };

  const handleHoldHarmlessFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setHoldHarmlessFile(file);
    setUploadingFile(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await apiClient.post('/programs/upload/hold-harmless', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      const uploadedUrl = response.data?.url;
      if (uploadedUrl) {
        setHoldHarmlessTemplateUrl(uploadedUrl);
        setSuccessMessage('Hold harmless template uploaded and linked to this program');
      } else {
        setError('Upload succeeded but no URL returned');
      }
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Failed to upload file');
    } finally {
      setUploadingFile(false);
    }
  };

  const addTier = () => {
    // Validate that at least one GL or Umbrella field is filled
    if (!newTierGl && !newTierUmbrella && !newTierUmbrellaMin) {
      setError('Please enter at least one of: GL Per Occurrence, GL Aggregate, or Umbrella Minimum');
      return;
    }

    const baseName = newTierName.trim() || `Tier ${tiers.length + 1}`;
    let uniqueName = baseName;
    let suffix = 2;
    while (tiers.some(t => t.name.trim().toLowerCase() === uniqueName.trim().toLowerCase())) {
      uniqueName = `${baseName} (${suffix})`;
      suffix += 1;
    }

    const newTier = {
      name: uniqueName,
      glPerOccurrence: newTierGl,
      glAggregate: newTierUmbrella,
      umbrellaMinimum: newTierUmbrellaMin,
      isRest: false,
      trades: [],
    };
    setTiers([...tiers, newTier]);
    setNewTierName('');
    setNewTierGl('');
    setNewTierUmbrella('');
    setNewTierUmbrellaMin('');
    setShowTierForm(false);
    setError(null);
  };

  const removeTier = (index: number) => {
    setTiers(tiers.filter((_, i) => i !== index));
  };

  const toggleTierIsRest = (index: number) => {
    // Only allow tier 2+ to be marked as rest
    if (index === 0) {
      setError('Only Tier 2 or higher can be "All Other Trades"');
      return;
    }
    const updatedTiers = [...tiers];
    // If turning on isRest, turn it off for all other tiers
    if (!updatedTiers[index].isRest) {
      updatedTiers.forEach((tier, i) => {
        tier.isRest = i === index;
      });
      // Clear trades when marking as "rest"
      updatedTiers[index].trades = [];
    } else {
      updatedTiers[index].isRest = false;
    }
    setTiers(updatedTiers);
    setError(null);
  };

  const toggleTradeSelection = (tierIndex: number, trade: string) => {
    const updatedTiers = [...tiers];
    const tierTrades = updatedTiers[tierIndex].trades;
    const tradeIndex = tierTrades.indexOf(trade);
    
    if (tradeIndex > -1) {
      tierTrades.splice(tradeIndex, 1);
    } else {
      tierTrades.push(trade);
    }
    tierTrades.sort();
    setTiers(updatedTiers);
  };

  const selectAllTrades = (tierIndex: number) => {
    const updatedTiers = [...tiers];
    updatedTiers[tierIndex].trades = getAvailableTrades(tierIndex);
    setTiers(updatedTiers);
  };

  const clearAllTrades = (tierIndex: number) => {
    const updatedTiers = [...tiers];
    updatedTiers[tierIndex].trades = [];
    setTiers(updatedTiers);
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);
    setSubmitting(true);
    try {
      const payload: any = {
        name: name.trim(),
        description: description.trim() || undefined,
        isTemplate,
        requiresHoldHarmless,
        requiresAdditionalInsured,
        requiresWaiverSubrogation,
      };

      // Only include numeric fields if provided (WC and Auto at program level)
      if (wcMinimum !== '') payload.wcMinimum = Number(wcMinimum);
      if (autoMinimum !== '') payload.autoMinimum = Number(autoMinimum);
      if (holdHarmlessTemplateUrl.trim() !== '') payload.holdHarmlessTemplateUrl = holdHarmlessTemplateUrl.trim();

      // Include tier requirements with selected trades
      if (tiers.length > 0) {
        payload.tierRequirements = tiers.reduce((acc, tier) => {
          acc[tier.name] = {
            glPerOccurrence: tier.glPerOccurrence ? Number(tier.glPerOccurrence) : null,
            glAggregate: tier.glAggregate ? Number(tier.glAggregate) : null,
            umbrellaMinimum: tier.umbrellaMinimum ? Number(tier.umbrellaMinimum) : null,
            isRest: tier.isRest,
            trades: tier.trades.length > 0 ? tier.trades : undefined,
          };
          return acc;
        }, {} as Record<string, any>);
      }

      if (!payload.name) {
        setError('Program name is required');
        setSubmitting(false);
        return;
      }

      await apiClient.post('/programs', payload);
      setSuccessMessage('Program created successfully!');
      setSubmitting(false);
    } catch (err: any) {
      const msg = err?.response?.data?.message || 'Failed to create program';
      setError(Array.isArray(msg) ? msg.join(', ') : String(msg));
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-3xl mx-auto">
        {/* Navigation Breadcrumb */}
        <div className="mb-6 text-sm text-gray-600">
          <button
            onClick={() => router.push('/dashboard')}
            className="text-blue-600 hover:text-blue-800"
          >
            Dashboard
          </button>
          <span className="mx-2">/</span>
          <span className="text-gray-900 font-medium">Create Program</span>
        </div>

        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Create Program</h1>
            <p className="text-gray-600 mt-2">Define insurance requirements and rules</p>
          </div>
          <button
            onClick={() => router.push('/dashboard')}
            className="px-4 py-2 rounded bg-gray-200 text-gray-700 hover:bg-gray-300 text-sm font-medium"
          >
            ← Back to Dashboard
          </button>
        </div>

        {error && (
          <div className="mb-4 rounded border border-red-300 bg-red-50 px-4 py-3 text-red-800">
            {error}
          </div>
        )}

        {successMessage && (
          <div className="mb-4 rounded border border-green-300 bg-green-50 px-4 py-3 text-green-800 font-medium">
            ✓ {successMessage}
          </div>
        )}

        {/* PDF Upload Section */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg shadow p-6 mb-6">
          <h2 className="text-lg font-semibold text-blue-900 mb-4">
            📄 Upload Insurance Program PDF (AI Extraction)
          </h2>
          <p className="text-sm text-blue-800 mb-4">
            Upload an insurance program PDF and our AI will automatically extract requirements, coverage minimums, and requirements.
          </p>
          <div className="flex items-center gap-4">
            <input
              type="file"
              accept=".pdf"
              onChange={handleProgramPdfUpload}
              className="block w-full text-sm text-gray-600 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-blue-600 file:text-white hover:file:bg-blue-700"
              disabled={extractingPdf}
            />
            {extractingPdf && (
              <div className="flex items-center gap-2 text-blue-700">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-700"></div>
                <span className="text-sm">Extracting...</span>
              </div>
            )}
          </div>
          {programPdfFile && (
            <p className="mt-2 text-sm text-blue-700">
              Selected: {programPdfFile.name}
            </p>
          )}
        </div>

        <form onSubmit={onSubmit} className="bg-white rounded-lg shadow p-6 space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700">Program Name *</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-1 block w-full rounded border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="e.g., Standard Contractor Insurance"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="mt-1 block w-full rounded border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={3}
              placeholder="Briefly describe this program"
            />
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded p-4">
            <h3 className="text-sm font-semibold text-blue-900 mb-2">Program-Wide Minimums</h3>
            <p className="text-xs text-blue-700 mb-3">These apply to all contractors unless overridden by tier requirements.</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">WC Minimum ($)</label>
                <input
                  type="number"
                  inputMode="numeric"
                  value={wcMinimum}
                  onChange={(e) => setWcMinimum(e.target.value)}
                  className="mt-1 block w-full rounded border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., 500000"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Auto Minimum ($)</label>
                <input
                  type="number"
                  inputMode="numeric"
                  value={autoMinimum}
                  onChange={(e) => setAutoMinimum(e.target.value)}
                  className="mt-1 block w-full rounded border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., 1000000"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Hold Harmless Template
            </label>
            <div className="space-y-3">
              <div>
                <label className="block text-xs text-gray-600 mb-1">Upload File</label>
                <input
                  type="file"
                  accept=".pdf,.doc,.docx"
                  onChange={handleHoldHarmlessFileUpload}
                  className="block w-full text-sm text-gray-600 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
                  disabled={uploadingFile}
                />
                {holdHarmlessFile && (
                  <p className="mt-1 text-xs text-green-600">
                    ✓ {holdHarmlessFile.name}
                  </p>
                )}
              </div>
              <div className="flex items-center gap-2">
                <div className="flex-1 border-t border-gray-300"></div>
                <span className="text-xs text-gray-500">OR</span>
                <div className="flex-1 border-t border-gray-300"></div>
              </div>
              <div>
                <label className="block text-xs text-gray-600 mb-1">Enter URL</label>
                <input
                  type="url"
                  value={holdHarmlessTemplateUrl}
                  onChange={(e) => setHoldHarmlessTemplateUrl(e.target.value)}
                  className="mt-1 block w-full rounded border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  placeholder="https://storage.example.com/template.pdf"
                />
              </div>
            </div>
          </div>

          {/* Tier Requirements Section */}
          <div className="border border-gray-200 rounded-lg p-4">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Tier Requirements (GL Per Occurrence & Aggregate)</h3>
                <p className="text-xs text-gray-600 mt-1">Define different GL and Umbrella requirements by tier or trade</p>
              </div>
              <button
                type="button"
                onClick={() => setShowTierForm(!showTierForm)}
                className="px-3 py-2 rounded bg-blue-600 text-white text-sm hover:bg-blue-700 font-semibold"
              >
                {showTierForm ? '✕ Close' : '+ Add New Tier'}
              </button>
            </div>

            {showTierForm && (
              <div className="bg-gray-50 p-4 rounded mb-4 space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Tier Name *</label>
                  <input
                    type="text"
                    value={newTierName}
                    onChange={(e) => setNewTierName(e.target.value)}
                    className="mt-1 block w-full rounded border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g., Tier 1, Gold, Premium"
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">GL Per Occurrence ($)</label>
                    <input
                      type="number"
                      value={newTierGl}
                      onChange={(e) => setNewTierGl(e.target.value)}
                      className="mt-1 block w-full rounded border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="e.g., 2000000"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">GL Aggregate ($)</label>
                    <input
                      type="number"
                      value={newTierUmbrella}
                      onChange={(e) => setNewTierUmbrella(e.target.value)}
                      className="mt-1 block w-full rounded border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="e.g., 4000000"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Umbrella Minimum ($)</label>
                    <input
                      type="number"
                      value={newTierUmbrellaMin}
                      onChange={(e) => setNewTierUmbrellaMin(e.target.value)}
                      className="mt-1 block w-full rounded border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="e.g., 2000000"
                    />
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={addTier}
                    className="flex-1 px-3 py-2 rounded bg-blue-600 text-white text-sm hover:bg-blue-700 font-semibold"
                  >
                    Complete Tier
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowTierForm(false)}
                    className="flex-1 px-3 py-2 rounded bg-gray-300 text-gray-700 text-sm hover:bg-gray-400"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {tiers.length > 0 && (
              <div className="space-y-3">
                {tiers.map((tier, tierIndex) => (
                  <div key={tierIndex} className="bg-white border-2 border-gray-400 rounded p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <p className="font-bold text-gray-900 text-lg">{tier.name}</p>
                        <p className="text-sm text-gray-600">
                          GL Per Occurrence: ${Number(tier.glPerOccurrence).toLocaleString() || 'N/A'} | GL Aggregate: ${Number(tier.glAggregate).toLocaleString() || 'N/A'} | Umbrella: ${Number(tier.umbrellaMinimum).toLocaleString() || 'N/A'}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeTier(tierIndex)}
                        className="px-2 py-1 text-red-600 hover:bg-red-50 rounded"
                      >
                        Remove Tier
                      </button>
                    </div>

                    {/* "All Other Trades" toggle for Tier 2+ */}
                    {tierIndex > 0 && (
                      <div className="mb-3 p-3 rounded border-2" style={{borderColor: tier.isRest ? '#10b981' : '#e5e7eb', backgroundColor: tier.isRest ? '#ecfdf5' : '#f9fafb'}}>
                        <label className="inline-flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={tier.isRest}
                            onChange={() => toggleTierIsRest(tierIndex)}
                            className="h-4 w-4 text-green-600"
                          />
                          <span className="text-sm font-medium" style={{color: tier.isRest ? '#059669' : '#374151'}}>Applies to all other trades not listed in previous tiers</span>
                        </label>
                        {tier.isRest && (
                          <p className="text-xs text-green-700 mt-2 italic">✓ This tier will apply to all remaining trades</p>
                        )}
                      </div>
                    )}

                    {/* Trades within Tier - only show if not marked as "all other trades" */}
                    {!tier.isRest && (
                      <div className="mt-3 border-t pt-3">
                        <div className="flex items-center justify-between mb-3">
                          <h4 className="font-semibold text-gray-800 text-sm">Select Trades for This Tier</h4>
                          <div className="flex gap-2">
                            <button
                              type="button"
                              onClick={() => selectAllTrades(tierIndex)}
                              className="px-2 py-1 rounded bg-green-500 text-white text-xs hover:bg-green-600"
                            >
                              Select All
                            </button>
                            <button
                              type="button"
                              onClick={() => clearAllTrades(tierIndex)}
                              className="px-2 py-1 rounded bg-gray-400 text-white text-xs hover:bg-gray-500"
                            >
                              Clear All
                            </button>
                          </div>
                        </div>

                        {/* Trade Selection Grid */}
                        <div className="bg-gray-50 p-3 rounded border border-gray-200 max-h-64 overflow-y-auto">
                          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                            {getAvailableTrades(tierIndex).map((trade) => (
                              <label key={trade} className="flex items-center gap-2 p-2 hover:bg-white rounded cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={tier.trades.includes(trade)}
                                  onChange={() => toggleTradeSelection(tierIndex, trade)}
                                  className="h-4 w-4 text-blue-600 rounded"
                                />
                                <span className="text-sm text-gray-700">{trade}</span>
                              </label>
                            ))}
                          </div>
                          {getAvailableTrades(tierIndex).length === 0 && (
                            <p className="text-xs text-gray-500 italic">All trades assigned to earlier tiers</p>
                          )}
                        </div>

                        {tier.trades.length > 0 && (
                          <div className="mt-2 text-xs text-gray-600">
                            <span className="font-medium">{tier.trades.length} trade(s) selected</span>
                          </div>
                        )}
                      </div>
                    )}

                    {tier.isRest && (
                      <div className="mt-3 p-4 bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-500 rounded">
                        <div className="flex items-start gap-2">
                          <span className="text-xl mt-0.5">✓</span>
                          <div>
                            <p className="font-semibold text-green-900">Applies to All Other Trades</p>
                            <p className="text-xs text-green-700 mt-1">This tier covers all contractors with trades not explicitly assigned to previous tiers</p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <label className="inline-flex items-center gap-2">
              <input
                type="checkbox"
                checked={isTemplate}
                onChange={(e) => setIsTemplate(e.target.checked)}
                className="h-4 w-4 text-blue-600"
              />
              <span className="text-sm text-gray-700">Template</span>
            </label>
            <label className="inline-flex items-center gap-2">
              <input
                type="checkbox"
                checked={requiresHoldHarmless}
                onChange={(e) => setRequiresHoldHarmless(e.target.checked)}
                className="h-4 w-4 text-blue-600"
              />
              <span className="text-sm text-gray-700">Requires Hold Harmless</span>
            </label>
            <label className="inline-flex items-center gap-2">
              <input
                type="checkbox"
                checked={requiresAdditionalInsured}
                onChange={(e) => setRequiresAdditionalInsured(e.target.checked)}
                className="h-4 w-4 text-blue-600"
              />
              <span className="text-sm text-gray-700">Requires Additional Insured</span>
            </label>
            <label className="inline-flex items-center gap-2">
              <input
                type="checkbox"
                checked={requiresWaiverSubrogation}
                onChange={(e) => setRequiresWaiverSubrogation(e.target.checked)}
                className="h-4 w-4 text-blue-600"
              />
              <span className="text-sm text-gray-700">Requires Waiver of Subrogation</span>
            </label>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t">
            <button
              type="button"
              onClick={() => router.push('/dashboard')}
              className="px-4 py-2 rounded border border-gray-300 text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"
            >
              {submitting ? 'Creating…' : 'Create Program'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
