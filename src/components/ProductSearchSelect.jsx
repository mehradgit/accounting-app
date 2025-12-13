"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { createPortal } from "react-dom";

/**
 * ProductSearchSelect (portal + focus-on-selection)
 * - Expects parent to pass inputProps including data-row (e.g. {"data-row": String(index), "data-field":"product-input", onKeyDown: handleEnterNavigation})
 * - After selecting a product (click or Enter) this component will focus the quantity input of the same row if present.
 */
export default function ProductSearchSelect({
  value,
  onChange,
  placeholder = "جستجو یا انتخاب کالا...",
  disabled = false,
  minQueryLength = 2,
  resultLimit = 50,
  inputProps = {},
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [highlight, setHighlight] = useState(0);
  const [selectedLabel, setSelectedLabel] = useState("");
  const containerRef = useRef(null);
  const inputRef = useRef(null);
  const debounceRef = useRef(null);
  const itemRefs = useRef([]);

  const [dropdownStyle, setDropdownStyle] = useState({ left: 0, top: 0, width: 200 });

  // fetch label when value changes
  useEffect(() => {
    let mounted = true;
    async function fetchLabel(id) {
      if (!id) {
        setSelectedLabel("");
        return;
      }
      try {
        const res = await fetch(`/api/inventory/products/${id}`);
        if (!res.ok) {
          setSelectedLabel("");
          return;
        }
        const p = await res.json();
        if (!mounted) return;
        setSelectedLabel(`${p.code} - ${p.name}${p.unit ? ` (${p.unit?.name})` : ""}`);
      } catch (err) {
        console.error("Error fetching product label:", err);
        setSelectedLabel("");
      }
    }
    fetchLabel(value);
    return () => {
      mounted = false;
    };
  }, [value]);

  // positioning
  const updateDropdownPosition = useCallback(() => {
    const el = inputRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    setDropdownStyle({
      left: rect.left + window.scrollX,
      top: rect.bottom + window.scrollY,
      width: rect.width,
    });
  }, []);

  // close on outside click (portal-aware)
  useEffect(() => {
    const onDocClick = (e) => {
      const t = e.target;
      if (
        containerRef.current &&
        !containerRef.current.contains(t) &&
        !document.getElementById("product-search-portal")?.contains(t)
      ) {
        setOpen(false);
        setQuery("");
        setResults([]);
        setHighlight(0);
      }
    };
    document.addEventListener("click", onDocClick);
    return () => document.removeEventListener("click", onDocClick);
  }, []);

  // update position on open/resize/scroll
  useEffect(() => {
    if (!open) return;
    updateDropdownPosition();
    const onResize = () => updateDropdownPosition();
    const onScroll = () => updateDropdownPosition();
    window.addEventListener("resize", onResize, { passive: true });
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("resize", onResize);
      window.removeEventListener("scroll", onScroll);
    };
  }, [open, updateDropdownPosition]);

  // debounce search
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    const q = query?.trim();
    if (!q || q.length < minQueryLength) {
      setResults([]);
      setLoading(false);
      return;
    }
    debounceRef.current = setTimeout(() => {
      fetchResults(q);
    }, 240);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query]);

  const fetchResults = async (q) => {
    try {
      setLoading(true);
      const res = await fetch(`/api/inventory/products/search?q=${encodeURIComponent(q)}&limit=${resultLimit}`);
      if (!res.ok) {
        setResults([]);
        return;
      }
      const data = await res.json();
      setResults(data.products || []);
      setHighlight(0);
      itemRefs.current = [];
    } catch (err) {
      console.error("Error fetching product search:", err);
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  // focus helper after selection: tries quantity, then unitPrice, then first focusable
  const focusNextFieldForRow = (row) => {
    if (!row && row !== 0) return;
    // prefer quantity
    let sel = document.querySelector(`input[data-row="${row}"][data-field="quantity"]`);
    if (sel) {
      sel.focus();
      return;
    }
    // fallback to unitPrice
    sel = document.querySelector(`input[data-row="${row}"][data-field="unitPrice"]`);
    if (sel) {
      sel.focus();
      return;
    }
    // generic fallback: next focusable inside same row
    const rowEl = document.querySelector(`[data-row="${row}"]`);
    if (rowEl) {
      const focusable = rowEl.querySelectorAll('input:not([type="button"]):not([disabled]), select:not([disabled]), textarea:not([disabled])');
      if (focusable && focusable.length > 0) {
        focusable[0].focus();
        return;
      }
    }
  };

  const onSelect = (p) => {
    if (!p) return;
    const id = String(p.id);
    setSelectedLabel(`${p.code} - ${p.name}${p.unit ? ` (${p.unit.name})` : ""}`);
    onChange(id);
    setOpen(false);
    setQuery("");
    setResults([]);
    // determine row index from input dataset or inputProps
    const rowAttr = inputRef.current?.getAttribute("data-row") ?? inputProps["data-row"];
    // focus quantity of same row (do it after next tick)
    setTimeout(() => {
      if (rowAttr !== undefined && rowAttr !== null) {
        focusNextFieldForRow(rowAttr);
      } else {
        // if no row info, blur input
        inputRef.current?.blur();
      }
    }, 0);
  };

  const clearSelection = (e) => {
    e.stopPropagation();
    onChange("");
    setSelectedLabel("");
    setQuery("");
    setResults([]);
    setOpen(false);
  };

  // scroll highlighted into view
  useEffect(() => {
    const el = itemRefs.current[highlight];
    if (el && typeof el.scrollIntoView === "function") {
      el.scrollIntoView({ block: "nearest", inline: "nearest" });
    }
  }, [highlight]);

  // internal key handling
  const handleInternalKey = (e) => {
    if (!open) {
      if (e.key === "ArrowDown") {
        setOpen(true);
        e.preventDefault();
        return { handled: true, wasEnterSelection: false };
      }
      return { handled: false, wasEnterSelection: false };
    }

    if (e.key === "ArrowDown") {
      setHighlight((h) => Math.min(h + 1, results.length - 1));
      e.preventDefault();
      return { handled: true, wasEnterSelection: false };
    } else if (e.key === "ArrowUp") {
      setHighlight((h) => Math.max(h - 1, 0));
      e.preventDefault();
      return { handled: true, wasEnterSelection: false };
    } else if (e.key === "Enter") {
      if (results[highlight]) {
        const sel = results[highlight];
        // perform selection and prevent parent handler (we will focus quantity ourselves)
        onSelect(sel);
        e.preventDefault();
        return { handled: true, wasEnterSelection: true };
      }
      return { handled: false, wasEnterSelection: false };
    } else if (e.key === "Escape") {
      setOpen(false);
      e.preventDefault();
      return { handled: true, wasEnterSelection: false };
    }
    return { handled: false, wasEnterSelection: false };
  };

  // document-level keydown so arrows work reliably
  useEffect(() => {
    if (!open) return;

    const onDocKey = (e) => {
      if (["ArrowDown", "ArrowUp", "Enter", "Escape"].includes(e.key)) {
        const res = handleInternalKey(e);
        // do not call parent here; onSelect already focuses the correct next field
        // (parent navigation handler should not run when we handled an Enter selection)
      }
    };

    document.addEventListener("keydown", onDocKey);
    return () => document.removeEventListener("keydown", onDocKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, results, highlight, inputProps]);

  const formatPriceFa = (val) => {
    if (val === undefined || val === null || isNaN(Number(val))) return "";
    try {
      return Number(val).toLocaleString("fa-IR");
    } catch {
      return String(val);
    }
  };

  const DropdownPortal = (
    <div
      id="product-search-portal"
      role="listbox"
      className="bg-white border shadow-sm"
      style={{
        position: "absolute",
        left: dropdownStyle.left,
        top: dropdownStyle.top,
        width: dropdownStyle.width,
        zIndex: 9999,
        maxHeight: 360,
        overflow: "auto",
        borderRadius: 6,
      }}
    >
      {loading ? (
        <div className="p-2 text-center small text-muted">در حال جستجو...</div>
      ) : results.length === 0 ? (
        <div className="p-2 text-muted small">موردی یافت نشد</div>
      ) : (
        <div className="list-group">
          {results.map((p, idx) => {
            const active = idx === highlight;
            return (
              <button
                type="button"
                key={p.id}
                role="option"
                aria-selected={String(p.id) === String(value)}
                onClick={() => onSelect(p)}
                onMouseEnter={() => setHighlight(idx)}
                ref={(el) => (itemRefs.current[idx] = el)}
                className={`list-group-item list-group-item-action d-flex justify-content-between align-items-start ${active ? "active" : ""}`}
                style={{ borderRadius: 0 }}
              >
                <div className="text-start">
                  <div style={{ fontWeight: 600 }}>{p.code} — {p.name}</div>
                  {p.category?.name && <div className="small text-muted">{p.category.name}</div>}
                </div>
                <div className="text-end small text-muted" style={{ minWidth: 70 }}>
                  {p.defaultPurchasePrice ? formatPriceFa(p.defaultPurchasePrice) : ""}
                  {p.defaultPurchasePrice ? <div className="very-small text-muted">ریال</div> : null}
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );

  return (
    <>
      <div ref={containerRef} className="position-relative" style={{ minWidth: 260 }}>
        <input
          ref={inputRef}
          type="text"
          className="form-control form-control-sm"
          placeholder={placeholder}
          value={open ? query : (query || selectedLabel)}
          onFocus={() => {
            setOpen(true);
            updateDropdownPosition();
          }}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
          }}
          onKeyDown={(e) => {
            const res = handleInternalKey(e);
            // If internal handled a non-Enter, don't call parent.
            // If internal did NOT handle (or we want parent behavior), call parent's handler.
            if (!res.handled && typeof inputProps.onKeyDown === "function") {
              inputProps.onKeyDown(e);
            }
            // Note: when Enter caused selection we DO NOT call parent's handler because we focused quantity here.
          }}
          disabled={disabled}
          autoComplete="off"
          aria-expanded={open}
          aria-haspopup="listbox"
          aria-controls="product-search-listbox"
          {...(inputProps || {})}
        />

        <div className="position-absolute" style={{ right: 6, top: 6 }}>
          {selectedLabel && !open ? (
            <button
              type="button"
              className="btn btn-sm btn-outline-secondary"
              onClick={clearSelection}
              title="پاک کردن"
            >
              ×
            </button>
          ) : (
            <span className="text-muted small">▾</span>
          )}
        </div>
      </div>

      {typeof document !== "undefined" && open ? createPortal(DropdownPortal, document.body) : null}
    </>
  );
}