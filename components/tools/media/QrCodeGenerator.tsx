'use client';

import React, { useState, useEffect, useRef } from 'react';
import QRCode from 'qrcode';
import { ToolLayout } from '../ToolLayout';
import { getToolBySlug } from '@/lib/tools-registry';
import {
  QrCode,
  Download,
  Copy,
  Check,
  Link as LinkIcon,
  Type,
  Wifi,
  User,
  Sparkles,
} from 'lucide-react';

type QrType = 'url' | 'text' | 'wifi' | 'vcard';

export function QrCodeGenerator() {
  const tool = getToolBySlug('qr-generator')!;

  const [qrType, setQrType] = useState<QrType>('url');
  const [urlInput, setUrlInput] = useState<string>('https://github.com');
  const [textInput, setTextInput] = useState<string>('Hello from StudentAI!');

  // Wi-Fi inputs
  const [wifiSsid, setWifiSsid] = useState<string>('Campus-WiFi');
  const [wifiPass, setWifiPass] = useState<string>('');
  const [wifiType, setWifiType] = useState<'WPA' | 'WEP' | 'nopass'>('WPA');

  // vCard inputs
  const [contactName, setContactName] = useState<string>('Alex Student');
  const [contactPhone, setContactPhone] = useState<string>('+1 555-0199');
  const [contactEmail, setContactEmail] = useState<string>('alex@university.edu');

  const [copied, setCopied] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Compute payload string based on active tab
  const getPayload = (): string => {
    switch (qrType) {
      case 'url':
        return urlInput.trim();
      case 'text':
        return textInput.trim();
      case 'wifi':
        return `WIFI:T:${wifiType};S:${wifiSsid};P:${wifiPass};;`;
      case 'vcard':
        return `BEGIN:VCARD\nVERSION:3.0\nFN:${contactName}\nTEL:${contactPhone}\nEMAIL:${contactEmail}\nEND:VCARD`;
      default:
        return '';
    }
  };

  const payload = getPayload();

  // Render QR Code onto Canvas
  useEffect(() => {
    if (!canvasRef.current || !payload) return;

    setErrorMsg(null);
    QRCode.toCanvas(
      canvasRef.current,
      payload,
      {
        width: 280,
        margin: 2,
        color: {
          dark: '#0f172a',
          light: '#ffffff',
        },
        errorCorrectionLevel: 'M',
      },
      (err) => {
        if (err) {
          setErrorMsg('Could not render QR code with current payload.');
        }
      }
    );
  }, [payload]);

  const handleDownloadPng = () => {
    if (!canvasRef.current) return;
    const url = canvasRef.current.toDataURL('image/png');
    const a = document.createElement('a');
    a.href = url;
    a.download = `studentai-qrcode-${Date.now()}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleCopyImage = async () => {
    if (!canvasRef.current) return;
    try {
      canvasRef.current.toBlob(async (blob) => {
        if (blob && navigator.clipboard && window.ClipboardItem) {
          await navigator.clipboard.write([
            new ClipboardItem({ 'image/png': blob }),
          ]);
          setCopied(true);
          setTimeout(() => setCopied(false), 2000);
        } else {
          // Fallback: copy text payload
          await navigator.clipboard.writeText(payload);
          setCopied(true);
          setTimeout(() => setCopied(false), 2000);
        }
      });
    } catch {
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(payload);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }
    }
  };

  const handleReset = () => {
    setUrlInput('https://');
    setTextInput('');
    setWifiSsid('');
    setWifiPass('');
    setContactName('');
    setContactPhone('');
    setContactEmail('');
  };

  return (
    <ToolLayout
      tool={tool}
      onReset={handleReset}
      educationalContent={{
        howItWorks: [
          'Choose the data format: Web URL, Plain Text, Wi-Fi configuration, or vCard contact card.',
          'The QR code matrix is calculated client-side in your browser using the open-source qrcode engine.',
          'Download high-resolution PNG images ready for presentations, study materials, or posters.',
        ],
        faqs: [
          {
            q: 'Are any external API requests made to generate the QR code?',
            a: 'No. The QR matrix is drawn directly onto an HTML5 canvas element inside your browser.',
          },
        ],
      }}
    >
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Inputs (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          {/* Format Tabs */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            <button
              type="button"
              onClick={() => setQrType('url')}
              className={`p-3 rounded-2xl border text-xs font-bold flex flex-col items-center gap-1.5 transition-all ${
                qrType === 'url'
                  ? 'border-indigo-600 bg-indigo-50/70 dark:bg-indigo-950/60 text-indigo-900 dark:text-indigo-200'
                  : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50'
              }`}
            >
              <LinkIcon className="w-4 h-4" />
              <span>Web Link</span>
            </button>

            <button
              type="button"
              onClick={() => setQrType('text')}
              className={`p-3 rounded-2xl border text-xs font-bold flex flex-col items-center gap-1.5 transition-all ${
                qrType === 'text'
                  ? 'border-indigo-600 bg-indigo-50/70 dark:bg-indigo-950/60 text-indigo-900 dark:text-indigo-200'
                  : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50'
              }`}
            >
              <Type className="w-4 h-4" />
              <span>Plain Text</span>
            </button>

            <button
              type="button"
              onClick={() => setQrType('wifi')}
              className={`p-3 rounded-2xl border text-xs font-bold flex flex-col items-center gap-1.5 transition-all ${
                qrType === 'wifi'
                  ? 'border-indigo-600 bg-indigo-50/70 dark:bg-indigo-950/60 text-indigo-900 dark:text-indigo-200'
                  : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50'
              }`}
            >
              <Wifi className="w-4 h-4" />
              <span>Wi-Fi Network</span>
            </button>

            <button
              type="button"
              onClick={() => setQrType('vcard')}
              className={`p-3 rounded-2xl border text-xs font-bold flex flex-col items-center gap-1.5 transition-all ${
                qrType === 'vcard'
                  ? 'border-indigo-600 bg-indigo-50/70 dark:bg-indigo-950/60 text-indigo-900 dark:text-indigo-200'
                  : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50'
              }`}
            >
              <User className="w-4 h-4" />
              <span>Contact vCard</span>
            </button>
          </div>

          {/* Type-Specific Form Inputs */}
          <div className="p-6 rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/50 shadow-sm space-y-4">
            {qrType === 'url' && (
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                  Website URL
                </label>
                <input
                  type="url"
                  placeholder="https://example.edu"
                  value={urlInput}
                  onChange={(e) => setUrlInput(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            )}

            {qrType === 'text' && (
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                  Plain Text Content
                </label>
                <textarea
                  rows={4}
                  placeholder="Enter any text or announcement..."
                  value={textInput}
                  onChange={(e) => setTextInput(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            )}

            {qrType === 'wifi' && (
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1">
                    Network Name (SSID)
                  </label>
                  <input
                    type="text"
                    value={wifiSsid}
                    onChange={(e) => setWifiSsid(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1">
                    Password
                  </label>
                  <input
                    type="text"
                    value={wifiPass}
                    onChange={(e) => setWifiPass(e.target.value)}
                    placeholder="Leave empty if open network"
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1">
                    Encryption
                  </label>
                  <select
                    value={wifiType}
                    onChange={(e) => setWifiType(e.target.value as 'WPA' | 'WEP' | 'nopass')}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-sm"
                  >
                    <option value="WPA">WPA / WPA2 / WPA3</option>
                    <option value="WEP">WEP</option>
                    <option value="nopass">None (Open)</option>
                  </select>
                </div>
              </div>
            )}

            {qrType === 'vcard' && (
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1">
                    Full Name
                  </label>
                  <input
                    type="text"
                    value={contactName}
                    onChange={(e) => setContactName(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    value={contactPhone}
                    onChange={(e) => setContactPhone(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1">
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={contactEmail}
                    onChange={(e) => setContactEmail(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-sm"
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Preview & Download (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          <div className="p-8 rounded-3xl border border-indigo-200 dark:border-indigo-900/60 bg-gradient-to-br from-indigo-500/5 via-white to-white dark:from-indigo-950/20 dark:via-slate-900 dark:to-slate-900 shadow-sm flex flex-col items-center text-center space-y-6">
            <span className="text-xs font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
              Live QR Preview
            </span>

            {/* Canvas Display */}
            <div className="p-4 bg-white rounded-2xl shadow-md border border-slate-200 dark:border-slate-700 flex items-center justify-center">
              <canvas ref={canvasRef} className="max-w-full rounded-lg" />
            </div>

            {errorMsg && (
              <p className="text-xs text-rose-500 font-medium">{errorMsg}</p>
            )}

            {/* Action Buttons */}
            <div className="w-full flex flex-col sm:flex-row gap-3">
              <button
                type="button"
                onClick={handleDownloadPng}
                disabled={!payload}
                className="flex-1 py-3 px-4 rounded-xl bg-indigo-600 text-white font-semibold text-xs hover:bg-indigo-700 transition-colors shadow-md shadow-indigo-500/20 flex items-center justify-center gap-2 disabled:opacity-40"
              >
                <Download className="w-4 h-4" />
                <span>Download PNG</span>
              </button>

              <button
                type="button"
                onClick={handleCopyImage}
                disabled={!payload}
                className="py-3 px-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 font-semibold text-xs hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors flex items-center justify-center gap-2 disabled:opacity-40"
              >
                {copied ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                <span>{copied ? 'Copied!' : 'Copy'}</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </ToolLayout>
  );
}
