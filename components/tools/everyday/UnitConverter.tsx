'use client';

import React, { useState, useMemo } from 'react';
import { ToolLayout } from '../ToolLayout';
import { getToolBySlug } from '@/lib/tools-registry';
import { ArrowLeftRight, Copy, Check, Calculator } from 'lucide-react';

type UnitCategory =
  | 'length'
  | 'weight'
  | 'temperature'
  | 'area'
  | 'volume'
  | 'speed'
  | 'time'
  | 'data';

interface UnitDef {
  label: string;
  factor: number; // Factor relative to base unit, or custom function for temperature
}

const CONVERSION_DATA: Record<
  UnitCategory,
  {
    name: string;
    base: string;
    units: Record<string, UnitDef>;
  }
> = {
  length: {
    name: 'Length',
    base: 'meter',
    units: {
      millimeter: { label: 'Millimeter (mm)', factor: 0.001 },
      centimeter: { label: 'Centimeter (cm)', factor: 0.01 },
      meter: { label: 'Meter (m)', factor: 1 },
      kilometer: { label: 'Kilometer (km)', factor: 1000 },
      inch: { label: 'Inch (in)', factor: 0.0254 },
      foot: { label: 'Foot (ft)', factor: 0.3048 },
      yard: { label: 'Yard (yd)', factor: 0.9144 },
      mile: { label: 'Mile (mi)', factor: 1609.344 },
    },
  },
  weight: {
    name: 'Weight / Mass',
    base: 'kilogram',
    units: {
      milligram: { label: 'Milligram (mg)', factor: 0.000001 },
      gram: { label: 'Gram (g)', factor: 0.001 },
      kilogram: { label: 'Kilogram (kg)', factor: 1 },
      metricTon: { label: 'Metric Ton (t)', factor: 1000 },
      ounce: { label: 'Ounce (oz)', factor: 0.0283495 },
      pound: { label: 'Pound (lb)', factor: 0.453592 },
    },
  },
  temperature: {
    name: 'Temperature',
    base: 'celsius',
    units: {
      celsius: { label: 'Celsius (°C)', factor: 1 },
      fahrenheit: { label: 'Fahrenheit (°F)', factor: 1 },
      kelvin: { label: 'Kelvin (K)', factor: 1 },
    },
  },
  area: {
    name: 'Area',
    base: 'sqMeter',
    units: {
      sqMeter: { label: 'Square Meter (m²)', factor: 1 },
      sqKilometer: { label: 'Square Kilometer (km²)', factor: 1000000 },
      sqFoot: { label: 'Square Foot (ft²)', factor: 0.092903 },
      acre: { label: 'Acre (ac)', factor: 4046.86 },
      hectare: { label: 'Hectare (ha)', factor: 10000 },
    },
  },
  volume: {
    name: 'Volume',
    base: 'liter',
    units: {
      milliliter: { label: 'Milliliter (mL)', factor: 0.001 },
      liter: { label: 'Liter (L)', factor: 1 },
      cubicMeter: { label: 'Cubic Meter (m³)', factor: 1000 },
      gallon: { label: 'US Gallon (gal)', factor: 3.78541 },
      cup: { label: 'US Cup', factor: 0.236588 },
    },
  },
  speed: {
    name: 'Speed',
    base: 'mps',
    units: {
      mps: { label: 'Meters per second (m/s)', factor: 1 },
      kph: { label: 'Kilometers per hour (km/h)', factor: 0.277778 },
      mph: { label: 'Miles per hour (mph)', factor: 0.44704 },
      knot: { label: 'Knot (kn)', factor: 0.514444 },
    },
  },
  time: {
    name: 'Time',
    base: 'second',
    units: {
      millisecond: { label: 'Millisecond (ms)', factor: 0.001 },
      second: { label: 'Second (s)', factor: 1 },
      minute: { label: 'Minute (min)', factor: 60 },
      hour: { label: 'Hour (hr)', factor: 3600 },
      day: { label: 'Day (d)', factor: 86400 },
      week: { label: 'Week (wk)', factor: 604800 },
    },
  },
  data: {
    name: 'Data Storage',
    base: 'byte',
    units: {
      bit: { label: 'Bit (b)', factor: 0.125 },
      byte: { label: 'Byte (B)', factor: 1 },
      kilobyte: { label: 'Kilobyte (KB)', factor: 1024 },
      megabyte: { label: 'Megabyte (MB)', factor: 1048576 },
      gigabyte: { label: 'Gigabyte (GB)', factor: 1073741824 },
      terabyte: { label: 'Terabyte (TB)', factor: 1099511627776 },
    },
  },
};

export function UnitConverter() {
  const tool = getToolBySlug('unit-converter')!;

  const [category, setCategory] = useState<UnitCategory>('length');
  const [inputValue, setInputValue] = useState<number>(100);
  const [fromUnit, setFromUnit] = useState<string>('meter');
  const [toUnit, setToUnit] = useState<string>('foot');
  const [copied, setCopied] = useState(false);

  // When category changes, reset from/to units to first available
  const handleCategoryChange = (newCat: UnitCategory) => {
    setCategory(newCat);
    const keys = Object.keys(CONVERSION_DATA[newCat].units);
    setFromUnit(keys[0]);
    setToUnit(keys[1] || keys[0]);
  };

  const convertedValue = useMemo(() => {
    const val = Number(inputValue);
    if (isNaN(val)) return 0;

    if (category === 'temperature') {
      // Temperature conversion
      let celsius = val;
      if (fromUnit === 'fahrenheit') celsius = ((val - 32) * 5) / 9;
      else if (fromUnit === 'kelvin') celsius = val - 273.15;

      if (toUnit === 'celsius') return celsius;
      if (toUnit === 'fahrenheit') return (celsius * 9) / 5 + 32;
      if (toUnit === 'kelvin') return celsius + 273.15;
      return celsius;
    }

    const units = CONVERSION_DATA[category].units;
    const fromFactor = units[fromUnit]?.factor || 1;
    const toFactor = units[toUnit]?.factor || 1;

    // Convert to base, then to target
    const baseValue = val * fromFactor;
    return baseValue / toFactor;
  }, [category, inputValue, fromUnit, toUnit]);

  const handleCopy = async () => {
    const fromLabel = CONVERSION_DATA[category].units[fromUnit]?.label;
    const toLabel = CONVERSION_DATA[category].units[toUnit]?.label;
    const text = `${inputValue} ${fromLabel} = ${convertedValue.toFixed(4)} ${toLabel}`;
    if (navigator.clipboard) {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleSwap = () => {
    const temp = fromUnit;
    setFromUnit(toUnit);
    setToUnit(temp);
  };

  const handleReset = () => {
    setInputValue(1);
  };

  const currentCategoryData = CONVERSION_DATA[category];

  return (
    <ToolLayout
      tool={tool}
      onReset={handleReset}
      educationalContent={{
        howItWorks: [
          'Choose the measurement dimension (Length, Mass, Temperature, Area, Volume, Speed, Time, Data).',
          'Select your source unit and destination target unit.',
          'Conversions are performed instantly using exact mathematical ratios.',
        ],
        faqs: [
          {
            q: 'Does data storage conversion use 1024 or 1000?',
            a: 'Binary standard (1 KB = 1024 Bytes) is used as standard for computing memory and storage calculations.',
          },
        ],
      }}
    >
      <div className="space-y-6 max-w-3xl mx-auto">
        {/* Category Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2">
          {(Object.keys(CONVERSION_DATA) as UnitCategory[]).map((catKey) => (
            <button
              key={catKey}
              type="button"
              onClick={() => handleCategoryChange(catKey)}
              className={`px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                category === catKey
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/20'
                  : 'border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
              }`}
            >
              {CONVERSION_DATA[catKey].name}
            </button>
          ))}
        </div>

        {/* Conversion Card */}
        <div className="p-6 sm:p-8 rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/50 shadow-sm space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-11 gap-4 items-center">
            {/* From Input */}
            <div className="sm:col-span-5 space-y-2">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500">
                From
              </label>
              <input
                type="number"
                step="any"
                value={inputValue}
                onChange={(e) => setInputValue(parseFloat(e.target.value) || 0)}
                className="w-full px-4 py-3 text-lg font-semibold rounded-2xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
              />
              <select
                value={fromUnit}
                onChange={(e) => setFromUnit(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
              >
                {Object.entries(currentCategoryData.units).map(([key, def]) => (
                  <option key={key} value={key}>
                    {def.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Swap Button */}
            <div className="sm:col-span-1 flex justify-center pt-4 sm:pt-0">
              <button
                type="button"
                onClick={handleSwap}
                className="p-3 rounded-2xl border border-slate-200 dark:border-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-950 text-indigo-600 dark:text-indigo-400 transition-colors"
                title="Swap Units"
                aria-label="Swap Units"
              >
                <ArrowLeftRight className="w-5 h-5" />
              </button>
            </div>

            {/* To Output */}
            <div className="sm:col-span-5 space-y-2">
              <label className="block text-xs font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                To (Result)
              </label>
              <div className="w-full px-4 py-3 text-lg font-semibold rounded-2xl border border-indigo-200 dark:border-indigo-800 bg-indigo-50/40 dark:bg-indigo-950/30 text-indigo-900 dark:text-indigo-200 truncate">
                {Number.isInteger(convertedValue)
                  ? convertedValue
                  : parseFloat(convertedValue.toFixed(6))}
              </div>
              <select
                value={toUnit}
                onChange={(e) => setToUnit(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
              >
                {Object.entries(currentCategoryData.units).map(([key, def]) => (
                  <option key={key} value={key}>
                    {def.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Copy Result */}
          <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <span className="text-xs text-slate-500">
              Formula: 1 {currentCategoryData.units[fromUnit]?.label} ={' '}
              {category === 'temperature'
                ? 'Standard Temperature Conversion'
                : `${parseFloat(
                    (
                      (currentCategoryData.units[fromUnit]?.factor || 1) /
                      (currentCategoryData.units[toUnit]?.factor || 1)
                    ).toFixed(6)
                  )} ${currentCategoryData.units[toUnit]?.label}`}
            </span>

            <button
              type="button"
              onClick={handleCopy}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied' : 'Copy'}</span>
            </button>
          </div>
        </div>
      </div>
    </ToolLayout>
  );
}
