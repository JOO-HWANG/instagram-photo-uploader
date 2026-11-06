import React from 'react';
import { PRODUCT_OPTIONS } from '../constants/data';
import { ShieldCheck, Sun, Moon, Sparkles, Layers, Sliders, Grid } from 'lucide-react';

interface ProductSelectorProps {
  productCode: string;
  onChangeProduct: (code: string) => void;
}

export const ProductSelector: React.FC<ProductSelectorProps> = ({
  productCode,
  onChangeProduct,
}) => {
  const selectedProduct = PRODUCT_OPTIONS.find((p) => p.code === productCode);

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-4 sm:p-5 shadow-xs">
      <div className="flex items-center justify-between mb-3">
        <label className="text-sm font-bold text-slate-900 flex items-center gap-2">
          <span className="w-5 h-5 rounded-full bg-slate-900 text-white text-xs flex items-center justify-center font-bold">
            4
          </span>
          <span>제품 종류 (Product)</span>
          <span className="text-xs text-rose-500 font-normal">*필수</span>
        </label>
        <span className="text-xs text-slate-500 font-medium">Hills Blind Lab 제품군</span>
      </div>

      {/* Primary Dropdown for simple mobile select */}
      <div className="mb-3">
        <select
          value={productCode}
          onChange={(e) => onChangeProduct(e.target.value)}
          className="w-full h-11 px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-semibold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
        >
          {PRODUCT_OPTIONS.map((prod) => (
            <option key={prod.code} value={prod.code}>
              {prod.code} - {prod.nameKo} ({prod.name})
            </option>
          ))}
        </select>
      </div>

      {/* Visual Product Grid for Fast One-Tap Field Selection */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {PRODUCT_OPTIONS.map((prod) => {
          const isSelected = productCode === prod.code;
          return (
            <button
              key={prod.code}
              type="button"
              onClick={() => onChangeProduct(prod.code)}
              className={`p-2.5 rounded-xl border text-left transition-all min-h-[56px] flex flex-col justify-between ${
                isSelected
                  ? 'border-blue-600 bg-blue-50/70 ring-2 ring-blue-500/20 shadow-xs'
                  : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'
              }`}
            >
              <div className="flex items-center justify-between w-full">
                <span className={`font-mono text-xs font-bold ${isSelected ? 'text-blue-700' : 'text-slate-900'}`}>
                  {prod.code}
                </span>
                {isSelected && (
                  <span className="w-2 h-2 rounded-full bg-blue-600" />
                )}
              </div>
              <div className="mt-1">
                <div className={`text-xs font-medium leading-tight truncate ${isSelected ? 'text-blue-900' : 'text-slate-800'}`}>
                  {prod.nameKo.split('(')[0]}
                </div>
                <div className="text-[10px] text-slate-500 truncate mt-0.5">
                  {prod.name}
                </div>
              </div>
            </button>
          );
        })}
      </div>

      <div className="mt-3 text-[11px] text-slate-500 flex items-center justify-between pt-2 border-t border-slate-100">
        <span>선택된 제품 코드:</span>
        <span className="font-mono font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded">
          {selectedProduct?.code} ({selectedProduct?.nameKo})
        </span>
      </div>
    </div>
  );
};
