import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import {
  Upload,
  Settings,
  ArrowRight,
  Store,
  AlertTriangle,
  Receipt,
  FileCheck2,
  Sliders,
  Check,
  Compass
} from 'lucide-react';
import { shopService, printingService, orderService } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { validateFile } from '../../utils/fileValidation';
import DocumentUploadZone from '../../components/DocumentUploadZone/DocumentUploadZone';
import './UploadPrint.css';

/**
 * Validates and parses customer-supplied page range strings like '1-3, 5, 8-10'.
 */
export function parsePageRangeString(rangeStr, maxPages) {
  if (!rangeStr || rangeStr.trim().toLowerCase() === 'all') {
    return { valid: true, pages: null, count: maxPages || 0, error: null };
  }

  const parts = rangeStr.split(',');
  const pageSet = new Set();

  for (let rawPart of parts) {
    const part = rawPart.trim();
    if (!part) continue;

    if (part.includes('-')) {
      const rangeParts = part.split('-');
      if (rangeParts.length !== 2) {
        return { valid: false, count: 0, error: `Invalid range format: "${part}"` };
      }
      const start = parseInt(rangeParts[0].trim(), 10);
      const end = parseInt(rangeParts[1].trim(), 10);

      if (isNaN(start) || isNaN(end) || start < 1 || end < start) {
        return { valid: false, count: 0, error: `Invalid range: "${part}". Start must be <= end.` };
      }
      if (maxPages && end > maxPages) {
        return { valid: false, count: 0, error: `Page ${end} exceeds total document pages (${maxPages}).` };
      }
      for (let p = start; p <= end; p++) {
        pageSet.add(p);
      }
    } else {
      const pageNum = parseInt(part, 10);
      if (isNaN(pageNum) || pageNum < 1) {
        return { valid: false, count: 0, error: `Invalid page number: "${part}".` };
      }
      if (maxPages && pageNum > maxPages) {
        return { valid: false, count: 0, error: `Page ${pageNum} exceeds total document pages (${maxPages}).` };
      }
      pageSet.add(pageNum);
    }
  }

  if (pageSet.size === 0) {
    return { valid: false, count: 0, error: 'Please enter at least one page number.' };
  }

  return {
    valid: true,
    pages: Array.from(pageSet).sort((a, b) => a - b),
    count: pageSet.size,
    error: null
  };
}

const UploadPrint = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [shops, setShops] = useState([]);
  const [selectedShopId, setSelectedShopId] = useState(searchParams.get('shopId') || '');
  const [selectedShop, setSelectedShop] = useState(null);

  // List of uploaded document entries:
  // { id, file, name, size, docType, pageCount, status: 'processing' | 'ready' | 'error', errorMessage }
  const [documents, setDocuments] = useState([]);

  // Printing preferences
  const [paperSize, setPaperSize] = useState('A4');
  const [colorMode, setColorMode] = useState('bw');
  const [printSide, setPrintSide] = useState('single');
  const [orientation, setOrientation] = useState('portrait');
  const [pageRangeType, setPageRangeType] = useState('all'); // 'all' | 'custom'
  const [customRange, setCustomRange] = useState('');
  const [copies, setCopies] = useState(1);
  const [collated, setCollated] = useState(true);
  const [paperType, setPaperType] = useState('standard_70gsm');
  const [instructions, setInstructions] = useState('');

  // Live estimate state
  const [estimatedCost, setEstimatedCost] = useState(null);
  const [calculating, setCalculating] = useState(false);
  const [pricingError, setPricingError] = useState('');

  // Load available shops
  useEffect(() => {
    shopService.getShops()
      .then((data) => {
        const list = Array.isArray(data) ? data : (data.results || []);
        setShops(list);
        if (!selectedShopId && list.length > 0) {
          setSelectedShopId(list[0].id);
        }
      })
      .catch(() => {});
  }, []);

  // Load selected shop details
  useEffect(() => {
    if (selectedShopId) {
      shopService.getShop(selectedShopId)
        .then((data) => setSelectedShop(data))
        .catch(() => setSelectedShop(null));
    }
  }, [selectedShopId]);

  // Dynamic shop capabilities based on shop's configured pricing_rules
  const availableRules = useMemo(() => {
    if (!selectedShop?.pricing_rules || !Array.isArray(selectedShop.pricing_rules)) {
      return null;
    }
    return selectedShop.pricing_rules.filter((r) => r.is_available);
  }, [selectedShop]);

  const availablePaperSizes = useMemo(() => {
    if (!availableRules || availableRules.length === 0) {
      return ['A4', 'Letter', 'Legal', 'A3'];
    }
    const sizes = Array.from(new Set(availableRules.map((r) => r.paper_size)));
    return sizes.length > 0 ? sizes : ['A4', 'Letter', 'Legal'];
  }, [availableRules]);

  const availableColorModes = useMemo(() => {
    if (!availableRules || availableRules.length === 0) {
      return ['bw', 'color'];
    }
    const matching = availableRules.filter((r) => r.paper_size === paperSize);
    const modes = Array.from(new Set(matching.map((r) => r.color_mode)));
    return modes.length > 0 ? modes : ['bw', 'color'];
  }, [availableRules, paperSize]);

  const availablePrintSides = useMemo(() => {
    if (!availableRules || availableRules.length === 0) {
      return ['single', 'double'];
    }
    const matching = availableRules.filter(
      (r) => r.paper_size === paperSize && r.color_mode === colorMode
    );
    const sides = Array.from(new Set(matching.map((r) => r.print_side)));
    return sides.length > 0 ? sides : ['single', 'double'];
  }, [availableRules, paperSize, colorMode]);

  // Synchronize selections when available options change
  useEffect(() => {
    if (availablePaperSizes.length > 0 && !availablePaperSizes.includes(paperSize)) {
      setPaperSize(availablePaperSizes[0]);
    }
  }, [availablePaperSizes, paperSize]);

  useEffect(() => {
    if (availableColorModes.length > 0 && !availableColorModes.includes(colorMode)) {
      setColorMode(availableColorModes[0]);
    }
  }, [availableColorModes, colorMode]);

  useEffect(() => {
    if (availablePrintSides.length > 0 && !availablePrintSides.includes(printSide)) {
      setPrintSide(availablePrintSides[0]);
    }
  }, [availablePrintSides, printSide]);

  // Process server-side page detection for a single document entry
  const processDocumentDetection = async (docId, file) => {
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await orderService.detectPages(formData);

      setDocuments((prev) =>
        prev.map((doc) =>
          doc.id === docId
            ? {
                ...doc,
                status: 'ready',
                pageCount: res.page_count,
                docType: res.doc_type || 'PDF',
                errorMessage: ''
              }
            : doc
        )
      );
    } catch (err) {
      const errorMsg =
        err.response?.data?.error ||
        err.message ||
        'Could not count document pages. Please check file format and try again.';
      setDocuments((prev) =>
        prev.map((doc) =>
          doc.id === docId
            ? {
                ...doc,
                status: 'error',
                errorMessage: errorMsg
              }
            : doc
        )
      );
    }
  };

  // Handle files selected or dropped
  const handleFilesSelected = (newFileList) => {
    const fileArray = Array.from(newFileList);

    fileArray.forEach((file) => {
      const docId = `${file.name}-${file.size}-${Date.now()}-${Math.random()}`;

      // 1. Frontend validation (size, extension, empty)
      const validation = validateFile(file);
      if (!validation.valid) {
        setDocuments((prev) => [
          ...prev,
          {
            id: docId,
            file,
            name: file.name,
            size: file.size,
            docType: file.name.split('.').pop()?.toUpperCase() || 'FILE',
            pageCount: null,
            status: 'error',
            errorMessage: validation.error
          }
        ]);
        return;
      }

      // 2. Mark as processing and call backend inspection
      setDocuments((prev) => [
        ...prev,
        {
          id: docId,
          file,
          name: file.name,
          size: file.size,
          docType: null,
          pageCount: null,
          status: 'processing',
          errorMessage: ''
        }
      ]);

      processDocumentDetection(docId, file);
    });
  };

  const handleRemoveDocument = (docId) => {
    setDocuments((prev) => prev.filter((d) => d.id !== docId));
  };

  const handleRetryDocument = (docId) => {
    const doc = documents.find((d) => d.id === docId);
    if (!doc) return;

    setDocuments((prev) =>
      prev.map((d) =>
        d.id === docId
          ? { ...d, status: 'processing', errorMessage: '' }
          : d
      )
    );

    processDocumentDetection(docId, doc.file);
  };

  // Check state of documents
  const allReady = useMemo(() => {
    return documents.length > 0 && documents.every((d) => d.status === 'ready' && d.pageCount > 0);
  }, [documents]);

  const maxDocumentPages = useMemo(() => {
    if (documents.length === 0) return 0;
    return Math.max(...documents.map((d) => d.pageCount || 0));
  }, [documents]);

  const hasProcessing = useMemo(() => {
    return documents.some((d) => d.status === 'processing');
  }, [documents]);

  const hasErrors = useMemo(() => {
    return documents.some((d) => d.status === 'error');
  }, [documents]);

  // Validate custom page range
  const pageRangeValidation = useMemo(() => {
    if (pageRangeType === 'all') {
      return { valid: true, count: maxDocumentPages, error: null };
    }
    return parsePageRangeString(customRange, maxDocumentPages);
  }, [pageRangeType, customRange, maxDocumentPages]);

  // Computed document pages, physical sheets, and printed sides
  const pageStats = useMemo(() => {
    let totalDocPages = 0;
    let totalEffectivePages = 0;
    let totalSheets = 0;
    let totalPrintedSides = 0;

    documents.forEach((d) => {
      if (d.status === 'ready' && d.pageCount) {
        totalDocPages += d.pageCount;
        const effectiveDocPages = pageRangeType === 'all'
          ? d.pageCount
          : (pageRangeValidation.valid ? pageRangeValidation.count : d.pageCount);

        totalEffectivePages += effectiveDocPages;
        const sheetsPerDoc = printSide === 'double' ? Math.ceil(effectiveDocPages / 2) : effectiveDocPages;
        totalSheets += sheetsPerDoc;
        totalPrintedSides += effectiveDocPages;
      }
    });

    return {
      documentPages: totalDocPages,
      effectivePages: totalEffectivePages,
      physicalSheets: totalSheets * copies,
      sheetsPerCopy: totalSheets,
      printedSides: totalPrintedSides * copies
    };
  }, [documents, printSide, copies, pageRangeType, pageRangeValidation]);

  // Recalculate price estimate when parameters or ready documents change
  useEffect(() => {
    if (!selectedShopId || !allReady) {
      setEstimatedCost(null);
      setPricingError('');
      return;
    }

    if (pageRangeType === 'custom' && !pageRangeValidation.valid) {
      setEstimatedCost(null);
      setPricingError(pageRangeValidation.error || 'Please specify a valid page range.');
      return;
    }

    const effectiveRangeParam = pageRangeType === 'all' ? 'all' : customRange.trim();

    const items = documents.map((d) => ({
      paper_size: paperSize,
      color_mode: colorMode,
      print_side: printSide,
      page_count: d.pageCount,
      copies: parseInt(copies, 10) || 1,
      page_range: effectiveRangeParam,
    }));

    setCalculating(true);
    setPricingError('');

    printingService.calculateEstimate(selectedShopId, items)
      .then((res) => {
        setEstimatedCost(res);
      })
      .catch((err) => {
        const msg = err.response?.data?.error || 'Could not compute price for the selected shop and preferences.';
        setPricingError(msg);
        setEstimatedCost(null);
      })
      .finally(() => setCalculating(false));
  }, [
    selectedShopId,
    documents,
    paperSize,
    colorMode,
    printSide,
    copies,
    allReady,
    pageRangeType,
    customRange,
    pageRangeValidation.valid
  ]);

  const canContinue =
    allReady &&
    !hasProcessing &&
    !hasErrors &&
    pageRangeValidation.valid &&
    !!estimatedCost &&
    !calculating;

  const handleContinue = () => {
    if (!canContinue) return;

    const effectivePageRange = pageRangeType === 'all' ? 'all' : customRange.trim();

    // Save order draft to sessionStorage for review & checkout
    const draft = {
      shopId: selectedShopId,
      shop: selectedShop,
      paperSize,
      colorMode,
      printSide,
      orientation,
      pageRangeType,
      pageRange: effectivePageRange,
      copies: parseInt(copies, 10) || 1,
      collated,
      paperType,
      instructions,
      estimatedCost,
      pageStats,
      filesSummary: documents.map((d) => {
        const effPages = pageRangeType === 'all' ? d.pageCount : pageRangeValidation.count;
        return {
          id: d.id,
          name: d.file.name,
          size: d.file.size,
          docType: d.docType,
          pageCount: d.pageCount,
          effectivePages: effPages,
          physicalSheets: printSide === 'double' ? Math.ceil(effPages / 2) : effPages,
        };
      }),
    };

    sessionStorage.setItem('uqp_order_draft', JSON.stringify(draft));
    // Store active raw files in window global memory for actual upload submission
    window.__uqp_upload_files = documents.map((d) => d.file);

    navigate('/order-review');
  };

  return (
    <div className="upload-print-page">
      <div className="upload-header">
        <h1 className="upload-title">Configure Printing Order</h1>
        <p className="upload-subtitle">
          Select your shop, upload your documents with automated page verification, and customize your printing options.
        </p>
      </div>

      <div className="upload-layout">
        <div className="upload-main-col">
          {/* Shop Selection */}
          <div className="upload-card">
            <h2 className="upload-card-title">
              <Store size={20} style={{ color: 'var(--primary-blue, #2563EB)' }} /> 1. Selected Printing Shop
            </h2>
            <div className="setting-field">
              <label className="setting-label" htmlFor="shop-select">Choose Printing Shop</label>
              <select
                id="shop-select"
                className="setting-select"
                value={selectedShopId}
                onChange={(e) => setSelectedShopId(e.target.value)}
              >
                {shops.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} ({s.city}) — {s.is_open ? 'Open Now' : 'Closed'}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Document Upload Zone */}
          <div className="upload-card">
            <h2 className="upload-card-title">
              <Upload size={20} style={{ color: 'var(--primary-blue, #2563EB)' }} /> 2. Upload Documents
            </h2>

            <DocumentUploadZone
              documents={documents}
              onFilesSelected={handleFilesSelected}
              onRemoveDocument={handleRemoveDocument}
              onRetryDocument={handleRetryDocument}
            />
          </div>

          {/* Printing Options */}
          <div className="upload-card">
            <h2 className="upload-card-title">
              <Settings size={20} style={{ color: 'var(--primary-blue, #2563EB)' }} /> 3. Printing Preferences
            </h2>

            <div className="settings-grid">
              {/* Paper Size */}
              <div className="setting-field">
                <label className="setting-label" htmlFor="paper-size-select">Paper Size</label>
                <select
                  id="paper-size-select"
                  className="setting-select"
                  value={paperSize}
                  onChange={(e) => setPaperSize(e.target.value)}
                >
                  {availablePaperSizes.map((size) => (
                    <option key={size} value={size}>
                      {size === 'A4' && 'A4 (8.27 × 11.69 in)'}
                      {size === 'Letter' && 'Letter / Short (8.5 × 11 in)'}
                      {size === 'Legal' && 'Legal / Long (8.5 × 14 in)'}
                      {size === 'A3' && 'A3 (11.7 × 16.5 in)'}
                      {!['A4', 'Letter', 'Legal', 'A3'].includes(size) && size}
                    </option>
                  ))}
                </select>
              </div>

              {/* Color Mode */}
              <div className="setting-field">
                <label className="setting-label" htmlFor="color-mode-select">Color Mode</label>
                <select
                  id="color-mode-select"
                  className="setting-select"
                  value={colorMode}
                  onChange={(e) => setColorMode(e.target.value)}
                >
                  {availableColorModes.map((mode) => (
                    <option key={mode} value={mode}>
                      {mode === 'bw' ? 'Black & White (Monochrome)' : 'Full Color'}
                    </option>
                  ))}
                </select>
              </div>

              {/* Print Sides */}
              <div className="setting-field">
                <label className="setting-label" htmlFor="print-side-select">Print Sides</label>
                <select
                  id="print-side-select"
                  className="setting-select"
                  value={printSide}
                  onChange={(e) => setPrintSide(e.target.value)}
                >
                  {availablePrintSides.map((side) => (
                    <option key={side} value={side}>
                      {side === 'single'
                        ? 'Single-Sided (1 sheet per page)'
                        : 'Double-Sided / Back-to-Back (2 pages per sheet)'}
                    </option>
                  ))}
                </select>
              </div>

              {/* Orientation */}
              <div className="setting-field">
                <label className="setting-label" htmlFor="orientation-select">Page Orientation</label>
                <select
                  id="orientation-select"
                  className="setting-select"
                  value={orientation}
                  onChange={(e) => setOrientation(e.target.value)}
                >
                  <option value="portrait">Portrait (Vertical)</option>
                  <option value="landscape">Landscape (Horizontal)</option>
                </select>
              </div>

              {/* Paper Type */}
              <div className="setting-field">
                <label className="setting-label" htmlFor="paper-type-select">Paper Type / Thickness</label>
                <select
                  id="paper-type-select"
                  className="setting-select"
                  value={paperType}
                  onChange={(e) => setPaperType(e.target.value)}
                >
                  <option value="standard_70gsm">Standard Copier (70 GSM)</option>
                  <option value="standard_80gsm">Premium Multipurpose (80 GSM)</option>
                  <option value="glossy">Glossy / Photo Paper</option>
                </select>
              </div>

              {/* Number of Copies */}
              <div className="setting-field">
                <label className="setting-label" htmlFor="copies-input">Number of Copies</label>
                <input
                  id="copies-input"
                  type="number"
                  min="1"
                  max="100"
                  className="setting-input"
                  value={copies}
                  onChange={(e) => setCopies(Math.max(1, parseInt(e.target.value, 10) || 1))}
                />
              </div>
            </div>

            {/* Page Range Selection */}
            <div className="page-range-section">
              <label className="setting-label">Page Range to Print</label>
              <div className="range-radio-group">
                <label className={`range-radio-card ${pageRangeType === 'all' ? 'active' : ''}`}>
                  <input
                    type="radio"
                    name="pageRangeOption"
                    value="all"
                    checked={pageRangeType === 'all'}
                    onChange={() => setPageRangeType('all')}
                  />
                  <span>All Pages ({maxDocumentPages || '—'} pages)</span>
                </label>
                <label className={`range-radio-card ${pageRangeType === 'custom' ? 'active' : ''}`}>
                  <input
                    type="radio"
                    name="pageRangeOption"
                    value="custom"
                    checked={pageRangeType === 'custom'}
                    onChange={() => setPageRangeType('custom')}
                  />
                  <span>Custom Page Range</span>
                </label>
              </div>

              {pageRangeType === 'custom' && (
                <div className="custom-range-box">
                  <input
                    type="text"
                    id="custom-range-input"
                    className={`setting-input ${pageRangeValidation.error ? 'input-error' : ''}`}
                    placeholder="e.g. 1-5, 8, 11-14"
                    value={customRange}
                    onChange={(e) => setCustomRange(e.target.value)}
                  />
                  <div className="range-helper-text">
                    {pageRangeValidation.error ? (
                      <span className="range-error-msg">
                        <AlertTriangle size={14} style={{ display: 'inline', marginRight: 4 }} />
                        {pageRangeValidation.error}
                      </span>
                    ) : pageRangeValidation.valid && customRange ? (
                      <span className="range-success-msg">
                        <Check size={14} style={{ display: 'inline', marginRight: 4 }} />
                        {pageRangeValidation.count} page{pageRangeValidation.count !== 1 ? 's' : ''} selected
                        {pageRangeValidation.pages && ` (${pageRangeValidation.pages.slice(0, 10).join(', ')}${pageRangeValidation.pages.length > 10 ? '...' : ''})`}
                      </span>
                    ) : (
                      <span>Enter comma-separated single pages or spans (e.g., 1-5, 8). Bounds checked against document length.</span>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Collation Option (When Copies > 1) */}
            {copies > 1 && (
              <div className="collation-option-box">
                <label className="collation-checkbox-label">
                  <input
                    type="checkbox"
                    checked={collated}
                    onChange={(e) => setCollated(e.target.checked)}
                  />
                  <span>
                    <strong>Collate copies</strong> (Group sets sequentially: 1, 2, 3... 1, 2, 3...)
                  </span>
                </label>
              </div>
            )}

            {/* Special Instructions */}
            <div className="setting-field" style={{ marginTop: '1.25rem' }}>
              <label className="setting-label" htmlFor="instructions-input">
                Special Instructions for Shop Staff (Optional)
              </label>
              <textarea
                id="instructions-input"
                className="setting-input"
                rows="3"
                placeholder="e.g. Please staple top-left corner, ring bind in blue cover, or keep clean margins..."
                value={instructions}
                onChange={(e) => setInstructions(e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* Live Estimate Sidebar */}
        <div className="upload-sidebar-col">
          <div className="upload-card">
            <h2 className="upload-card-title">
              <Receipt size={20} style={{ color: 'var(--primary-blue, #2563EB)' }} /> Cost Breakdown
            </h2>

            {pricingError && (
              <div style={{
                backgroundColor: 'var(--color-error-bg, #FEF2F2)',
                color: 'var(--color-error, #DC2626)',
                padding: '0.75rem',
                borderRadius: 8,
                fontSize: '0.85rem',
                marginBottom: '1rem',
                lineHeight: 1.4
              }}>
                <AlertTriangle size={16} style={{ display: 'inline', marginRight: 6, verticalAlign: 'middle' }} />
                {pricingError}
              </div>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1.25rem' }}>
              <div className="estimate-breakdown-row">
                <span>Selected Shop:</span>
                <strong style={{ color: 'var(--text-main, #1E293B)' }}>
                  {selectedShop?.name || 'Loading...'}
                </strong>
              </div>

              <div className="estimate-breakdown-row">
                <span>Documents Uploaded:</span>
                <strong style={{ color: 'var(--text-main, #1E293B)' }}>{documents.length}</strong>
              </div>

              <div className="estimate-breakdown-row">
                <span>Verified Document Pages:</span>
                <strong style={{ color: 'var(--text-main, #1E293B)' }}>
                  {pageStats.documentPages} page{pageStats.documentPages !== 1 ? 's' : ''}
                </strong>
              </div>

              {pageRangeType === 'custom' && (
                <div className="estimate-breakdown-row">
                  <span>Effective Pages in Range:</span>
                  <strong style={{ color: '#0369A1' }}>
                    {pageStats.effectivePages} page{pageStats.effectivePages !== 1 ? 's' : ''}
                  </strong>
                </div>
              )}

              <div className="estimate-breakdown-row">
                <span>Physical Sheets of Paper:</span>
                <strong style={{ color: 'var(--primary-blue, #2563EB)' }}>
                  {pageStats.physicalSheets} sheet{pageStats.physicalSheets !== 1 ? 's' : ''}
                  {printSide === 'double' && (
                    <span style={{ fontSize: '0.75rem', fontWeight: 500, color: '#64748B', marginLeft: 4 }}>
                      ({pageStats.sheetsPerCopy}/copy back-to-back)
                    </span>
                  )}
                </strong>
              </div>

              <div className="estimate-breakdown-row">
                <span>Printed Page Sides:</span>
                <strong style={{ color: 'var(--text-main, #1E293B)' }}>
                  {pageStats.printedSides} side{pageStats.printedSides !== 1 ? 's' : ''}
                </strong>
              </div>

              <div className="estimate-breakdown-row">
                <span>Print Configuration:</span>
                <span className="estimate-badge">
                  {paperSize} • {colorMode === 'color' ? 'Full Color' : 'B&W'} • {printSide === 'double' ? 'Double-Sided' : 'Single'} • {orientation === 'landscape' ? 'Landscape' : 'Portrait'}
                </span>
              </div>

              <div className="estimate-breakdown-row">
                <span>Number of Copies:</span>
                <strong style={{ color: 'var(--text-main, #1E293B)' }}>
                  {copies} {copies > 1 ? (collated ? '(Collated)' : '(Uncollated)') : ''}
                </strong>
              </div>
            </div>

            {/* Shop itemized calculation */}
            {calculating ? (
              <div style={{ textAlign: 'center', padding: '1rem', color: 'var(--text-secondary, #64748B)', fontSize: '0.9rem' }}>
                Calculating official price with {selectedShop?.name}...
              </div>
            ) : estimatedCost ? (
              <div>
                {/* Itemized breakdown if multiple documents */}
                {estimatedCost.breakdown && estimatedCost.breakdown.length > 0 && (
                  <div className="estimate-detail-card">
                    <div className="estimate-detail-header">
                      <span>Rate Breakdown</span>
                      <span>Unit Price: ₱{parseFloat(estimatedCost.breakdown[0]?.unit_price || 0).toFixed(2)}</span>
                    </div>
                    {estimatedCost.breakdown.map((item, idx) => (
                      <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: '#64748B', marginTop: 4 }}>
                        <span>
                          Doc #{idx + 1}: {item.document_pages} pgs ({item.physical_sheets} {printSide === 'double' ? 'sheets' : 'pgs'}) × {item.copies} {item.copies > 1 ? 'copies' : 'copy'}
                        </span>
                        <strong style={{ color: '#1E293B' }}>₱{parseFloat(item.calculated_total).toFixed(2)}</strong>
                      </div>
                    ))}
                  </div>
                )}

                <div className="estimate-breakdown-row">
                  <span>Subtotal:</span>
                  <span>₱{parseFloat(estimatedCost.subtotal).toFixed(2)}</span>
                </div>
                <div className="estimate-breakdown-row">
                  <span>Convenience Fee:</span>
                  <span>₱0.00 (Free in Sandbox)</span>
                </div>
                <div className="estimate-total-row">
                  <span>Estimated Total:</span>
                  <span style={{ color: 'var(--primary-blue, #2563EB)' }}>
                    ₱{parseFloat(estimatedCost.total).toFixed(2)}
                  </span>
                </div>
              </div>
            ) : (
              <div style={{
                textAlign: 'center',
                padding: '1.25rem',
                background: 'var(--bg-subtle, #F8FAFC)',
                borderRadius: 8,
                color: 'var(--text-secondary, #64748B)',
                fontSize: '0.85rem',
                lineHeight: 1.4
              }}>
                {hasProcessing
                  ? 'Detecting document pages to calculate pricing...'
                  : hasErrors
                  ? 'Please resolve document upload errors to generate pricing.'
                  : documents.length === 0
                  ? 'Upload a PDF, Word, or supported document to calculate verified price.'
                  : !pageRangeValidation.valid
                  ? 'Specify a valid page range.'
                  : 'Ready to calculate price.'}
              </div>
            )}

            <button
              type="button"
              className="btn-continue-review"
              onClick={handleContinue}
              disabled={!canContinue}
            >
              Review Order Details <ArrowRight size={18} />
            </button>

            {/* Block reason hint if disabled */}
            {!canContinue && (
              <div className="continue-blocker-hint">
                {documents.length === 0 && 'Upload at least one document to proceed.'}
                {hasProcessing && 'Waiting for automatic page counting to finish...'}
                {hasErrors && 'Resolve document errors above before proceeding.'}
                {!pageRangeValidation.valid && (pageRangeValidation.error || 'Fix the page range specification.')}
                {!hasProcessing && !hasErrors && pageRangeValidation.valid && documents.length > 0 && !estimatedCost && !pricingError && 'Calculating official shop pricing...'}
                {pricingError && 'Adjust printing preferences supported by the selected shop.'}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default UploadPrint;
