import React, { useState, useEffect } from 'react';
import { Contract, Article, ArticleBlock, ParagraphBlock, TaskRow, Installment, PaymentSchedule, Appendix, Attachment, ContractVersion, ContractTemplate } from '../types';
import { Save, X, Plus, Trash2, Eye, FileText, Users, CreditCard, Paperclip, History, Lock, Unlock, ArrowUp, ArrowDown, Printer, AlignRight, ListOrdered, FileMinus, FileCode2, FileDown, Cloud, CheckCircle, AlertCircle } from 'lucide-react';
import { useLang, t } from '../context/LanguageContext';
import { useSettings } from '../context/SettingsContext';
import { numberToArabicWords } from '../utils/arabicWords';
import { toHijri } from '../utils/hijriDate';
import { exportContractToPdf, generatePdfBlob } from '../utils/exportPdf';
import { initGoogleDrive, requestDriveAccess, isConnected, uploadPdfToDrive } from '../services/googleDrive';
import { platformBus, PLATFORM_EVENTS } from '../../../core/events/platformBus';

type Tab = 'metadata' | 'articles' | 'payments' | 'appendices' | 'attachments' | 'versions' | 'preview';

const getDefaultArticles = (): Article[] => [
  { id: 'a1', order_index: 1, title_ar: '\u0627\u0644\u062a\u0645\u0647\u064a\u062f', body_ar: '\u064a\u0639\u062a\u0628\u0631 \u0627\u0644\u062a\u0645\u0647\u064a\u062f \u0627\u0644\u0633\u0627\u0628\u0642 \u0648\u0627\u0644\u0645\u0642\u062f\u0645\u0629 \u0625\u0636\u0627\u0641\u0629\u064b \u0625\u0644\u0649 \u0627\u0644\u0645\u0644\u0627\u062d\u0642 \u0627\u0644\u0645\u0631\u0641\u0642\u0629 \u062c\u0632\u0621\u0627\u064b \u0644\u0627 \u064a\u062a\u062c\u0632\u0623 \u0645\u0646 \u0647\u0630\u0627 \u0627\u0644\u0639\u0642\u062f \u0648\u0645\u062a\u0645\u0645\u0629\u064b \u0648\u0645\u0641\u0633\u0631\u0629\u064b \u0644\u0623\u062d\u0643\u0627\u0645\u0647.', article_type: '\u062a\u0645\u0647\u064a\u062f', is_locked: true, is_visible: true },
  { id: 'a2', order_index: 2, title_ar: '\u0627\u0644\u0645\u0648\u0636\u0648\u0639', body_ar: '[\u0639\u0646\u0648\u0627\u0646 \u0627\u0644\u0639\u0642\u062f] \u0644\u0635\u0627\u0644\u062d \u0627\u0644\u0637\u0631\u0641 \u0627\u0644\u062b\u0627\u0646\u064a ([\u0627\u0633\u0645 \u0627\u0644\u0637\u0631\u0641 \u0627\u0644\u062b\u0627\u0646\u064a]) \u0627\u0639\u062a\u0645\u0627\u062f\u0627\u064b \u0639\u0644\u0649 \u0627\u0644\u0639\u0631\u0636 \u0627\u0644\u0641\u0646\u064a \u0627\u0644\u0645\u0639\u062a\u0645\u062f \u0645\u0646 \u0642\u0628\u0644 \u0627\u0644\u0637\u0631\u0641\u064a\u0646 \u0648\u0627\u0644\u0645\u0644\u062d\u0642 \u0645\u0639 \u0647\u0630\u0627 \u0627\u0644\u0639\u0642\u062f.', article_type: '\u0645\u0648\u0636\u0648\u0639', is_locked: false, is_visible: true },
  { id: 'a3', order_index: 3, title_ar: '\u0645\u062f\u0629 \u0627\u0644\u062a\u0646\u0641\u064a\u0630', body_ar: '\u064a\u0644\u062a\u0632\u0645 \u0627\u0644\u0637\u0631\u0641 \u0627\u0644\u0623\u0648\u0644 \u0628\u062a\u0646\u0641\u064a\u0630 [\u0639\u0646\u0648\u0627\u0646 \u0627\u0644\u0639\u0642\u062f] \u0644\u0635\u0627\u0644\u062d \u0627\u0644\u0637\u0631\u0641 \u0627\u0644\u062b\u0627\u0646\u064a \u062e\u0644\u0627\u0644 \u0645\u062f\u0629 \u0644\u0627 \u062a\u0632\u064a\u062f \u0639\u0646 \u0633\u062a\u0629 \u0623\u0634\u0647\u0631 \u0645\u0646 \u062a\u0627\u0631\u064a\u062e \u062a\u0648\u0642\u064a\u0639 \u0627\u0644\u0639\u0642\u062f \u0645\u0646 \u0643\u0644\u0627 \u0627\u0644\u0637\u0631\u0641\u064a\u0646 \u0648\u062a\u062d\u0648\u064a\u0644 \u0627\u0644\u062f\u0641\u0639\u0629 \u0627\u0644\u0623\u0648\u0644\u0649 \u0644\u062d\u0633\u0627\u0628 \u0627\u0644\u0637\u0631\u0641 \u0627\u0644\u0623\u0648\u0644.', article_type: '\u0645\u062f\u0629 \u0627\u0644\u062a\u0646\u0641\u064a\u0630', is_locked: false, is_visible: true },
  { id: 'a4', order_index: 4, title_ar: '\u0627\u0644\u0642\u064a\u0645\u0629 \u0648\u0627\u0644\u062f\u0641\u0639\u0627\u062a', body_ar: '\u062a\u0628\u0644\u063a \u0642\u064a\u0645\u0629 \u0627\u0644\u0639\u0642\u062f \u0627\u0644\u0625\u062c\u0645\u0627\u0644\u064a\u0629 \u0627\u0644\u0645\u0628\u0644\u063a \u0627\u0644\u0645\u062d\u062f\u062f \u0641\u064a \u062c\u062f\u0648\u0644 \u0627\u0644\u062f\u0641\u0639\u0627\u062a \u0623\u062f\u0646\u0627\u0647 \u0634\u0627\u0645\u0644\u0629\u064b \u0636\u0631\u064a\u0628\u0629 \u0627\u0644\u0642\u064a\u0645\u0629 \u0627\u0644\u0645\u0636\u0627\u0641\u0629.\n\n\u064a\u0644\u062a\u0632\u0645 \u0627\u0644\u0637\u0631\u0641 \u0627\u0644\u062b\u0627\u0646\u064a \u0628\u0625\u064a\u062f\u0627\u0639 \u062c\u0645\u064a\u0639 \u0627\u0644\u0645\u0633\u062a\u062d\u0642\u0627\u062a \u0627\u0644\u0645\u0627\u0644\u064a\u0629 \u0644\u0644\u0637\u0631\u0641 \u0627\u0644\u0623\u0648\u0644 \u0641\u064a \u062d\u0633\u0627\u0628\u0647 \u0641\u064a \u0628\u0646\u0643 \u0627\u0644\u0628\u0644\u0627\u062f \u0628\u0627\u0633\u0645 \u0634\u0631\u0643\u0629 \u062f\u0631\u0627\u064a\u0629 \u0627\u0644\u0630\u0643\u064a\u0629 \u0644\u062a\u0642\u0646\u064a\u0629 \u0627\u0644\u0645\u0639\u0644\u0648\u0645\u0627\u062a.\n\n\u0641\u064a \u062d\u0627\u0644 \u062a\u0623\u062e\u0631 \u0627\u0644\u0637\u0631\u0641 \u0627\u0644\u062b\u0627\u0646\u064a \u0639\u0646 \u0627\u0644\u0631\u062f \u062e\u0644\u0627\u0644 \u064a\u0648\u0645\u064a \u0639\u0645\u0644 \u0639\u0644\u0649 \u0645\u062e\u0627\u0637\u0628\u0627\u062a \u0627\u0644\u0637\u0631\u0641 \u0627\u0644\u0623\u0648\u0644 \u0641\u0644\u0627 \u062a\u064f\u062d\u062a\u0633\u0628 \u0627\u0644\u0645\u062f\u0629 \u0627\u0644\u062a\u064a \u062a\u0632\u064a\u062f \u0639\u0646 \u064a\u0648\u0645\u064a \u0627\u0644\u0639\u0645\u0644 \u062c\u0632\u0621\u0627\u064b \u0645\u0646 \u0645\u062f\u0629 \u0627\u0644\u062a\u0646\u0641\u064a\u0630.', article_type: '\u0627\u0644\u0642\u064a\u0645\u0629 \u0648\u0627\u0644\u062f\u0641\u0639\u0627\u062a', is_locked: false, is_visible: true },
  { id: 'a5', order_index: 5, title_ar: '\u0627\u0644\u0645\u0644\u0643\u064a\u0629 \u0627\u0644\u0641\u0643\u0631\u064a\u0629', body_ar: '\u0627\u0644\u0645\u0644\u0643\u064a\u0629 \u0627\u0644\u0641\u0643\u0631\u064a\u0629 \u0644\u0644\u0645\u0634\u0631\u0648\u0639 \u0628\u0645\u0643\u0648\u0646\u0627\u062a\u0647 \u0627\u0644\u0645\u062e\u062a\u0644\u0641\u0629 \u0647\u064a \u0645\u0644\u0643 \u0644\u0644\u0637\u0631\u0641 \u0627\u0644\u062b\u0627\u0646\u064a \u0648\u0644\u0627 \u064a\u062d\u0642 \u0644\u0644\u0637\u0631\u0641 \u0627\u0644\u0623\u0648\u0644 \u0637\u0644\u0628 \u0623\u064a \u062d\u0642\u0648\u0642 \u0645\u0644\u0643\u064a\u0629 \u0639\u0646 \u0645\u062e\u0631\u062c\u0627\u062a \u0627\u0644\u0645\u0634\u0631\u0648\u0639 \u0628\u0639\u062f \u0627\u0633\u062a\u0644\u0627\u0645 \u0643\u0627\u0645\u0644 \u0627\u0644\u0645\u0633\u062a\u062d\u0642\u0627\u062a \u0627\u0644\u0645\u0627\u0644\u064a\u0629.', article_type: '\u0627\u0644\u0645\u0644\u0643\u064a\u0629 \u0627\u0644\u0641\u0643\u0631\u064a\u0629', is_locked: false, is_visible: true },
  { id: 'a6', order_index: 6, title_ar: '\u0622\u0644\u064a\u0629 \u0625\u062f\u0627\u0631\u0629 \u0627\u0644\u0645\u0634\u0631\u0648\u0639 \u0648\u0627\u0644\u062f\u0639\u0645 \u0627\u0644\u0641\u0646\u064a', body_ar: '\u0661. \u0628\u0639\u062f \u0627\u0644\u0627\u062a\u0641\u0627\u0642 \u0648\u062a\u0648\u0642\u064a\u0639 \u0627\u0644\u0639\u0642\u062f \u0648\u0625\u064a\u062f\u0627\u0639 \u0627\u0644\u062f\u0641\u0639\u0629 \u0627\u0644\u0623\u0648\u0644\u0649\u060c \u064a\u064f\u0639\u064a\u0651\u0646 \u0627\u0644\u0637\u0631\u0641 \u0627\u0644\u062b\u0627\u0646\u064a \u0645\u062f\u064a\u0631\u0627\u064b \u0644\u0644\u0645\u0634\u0631\u0648\u0639 \u0645\u0645\u062b\u0644\u0627\u064b \u0644\u0647 \u0641\u064a \u0647\u0630\u0627 \u0627\u0644\u062a\u0639\u0627\u0642\u062f.\n\u0662. \u064a\u062a\u0645 \u0627\u0644\u0627\u062c\u062a\u0645\u0627\u0639 \u0627\u0644\u0623\u0648\u0644\u064a \u0628\u064a\u0646 \u0645\u062f\u064a\u0631 \u0627\u0644\u0645\u0634\u0631\u0648\u0639 \u0627\u0644\u0645\u0645\u062b\u0644 \u0644\u0644\u0637\u0631\u0641 \u0627\u0644\u062b\u0627\u0646\u064a \u0648\u0645\u062f\u064a\u0631 \u0627\u0644\u0645\u0634\u0631\u0648\u0639 \u0627\u0644\u0645\u0645\u062b\u0644 \u0644\u0644\u0637\u0631\u0641 \u0627\u0644\u0623\u0648\u0644 \u0644\u0644\u0627\u062a\u0641\u0627\u0642 \u0639\u0644\u0649 \u0622\u0644\u064a\u0627\u062a \u0633\u064a\u0631 \u0627\u0644\u0645\u0634\u0631\u0648\u0639.\n\u0663. \u064a\u062a\u0645 \u062a\u0648\u062b\u064a\u0642 \u062c\u0645\u064a\u0639 \u0627\u0644\u062e\u0637\u0648\u0627\u062a \u0648\u0627\u0644\u0627\u062a\u0641\u0627\u0642\u0627\u062a \u0644\u0636\u0645\u0627\u0646 \u0645\u0635\u0644\u062d\u0629 \u0637\u0631\u0641\u064a \u0627\u0644\u0645\u0634\u0631\u0648\u0639.\n\u0664. \u064a\u0644\u062a\u0632\u0645 \u0627\u0644\u0637\u0631\u0641 \u0627\u0644\u062b\u0627\u0646\u064a \u0628\u0625\u0641\u0627\u062f\u0629 \u0627\u0644\u0637\u0631\u0641 \u0627\u0644\u0623\u0648\u0644 \u0639\u0646 \u0645\u0644\u0627\u062d\u0638\u0627\u062a\u0647 \u062d\u0648\u0644 \u0627\u0644\u0623\u0639\u0645\u0627\u0644 \u0627\u0644\u062a\u064a \u064a\u062a\u0645 \u062a\u0646\u0641\u064a\u0630\u0647\u0627 \u0641\u064a \u0643\u0644 \u0645\u0631\u062d\u0644\u0629 \u062e\u0644\u0627\u0644 \u064a\u0648\u0645\u064a \u0639\u0645\u0644.', article_type: '\u0625\u062f\u0627\u0631\u0629 \u0627\u0644\u0645\u0634\u0631\u0648\u0639', is_locked: false, is_visible: true },
  { id: 'a7', order_index: 7, title_ar: '\u0622\u0644\u064a\u0629 \u0637\u0644\u0628\u0627\u062a \u0627\u0644\u062a\u063a\u064a\u064a\u0631', body_ar: '\u0641\u064a \u062d\u0627\u0644\u0629 \u0642\u064a\u0627\u0645 \u0627\u0644\u0637\u0631\u0641 \u0627\u0644\u062b\u0627\u0646\u064a \u0628\u0637\u0644\u0628 \u062a\u0639\u062f\u064a\u0644 \u0639\u0644\u0649 \u0646\u0637\u0627\u0642 \u0627\u0644\u0639\u0645\u0644 \u0627\u0644\u0645\u062a\u0641\u0642 \u0639\u0644\u064a\u0647\u060c \u064a\u0642\u0648\u0645 \u0627\u0644\u0637\u0631\u0641 \u0627\u0644\u062b\u0627\u0646\u064a \u0628\u0627\u0644\u0627\u062c\u062a\u0645\u0627\u0639 \u0645\u0639 \u0627\u0644\u0637\u0631\u0641 \u0627\u0644\u0623\u0648\u0644 \u0644\u0634\u0631\u062d \u0627\u0644\u0645\u062a\u0637\u0644\u0628\u0627\u062a \u0627\u0644\u062c\u062f\u064a\u062f\u0629\u060c \u0648\u064a\u0642\u0648\u0645 \u0627\u0644\u0637\u0631\u0641 \u0627\u0644\u0623\u0648\u0644 \u0628\u062a\u0642\u064a\u064a\u0645 \u0627\u0644\u0645\u062a\u0637\u0644\u0628\u0627\u062a \u0648\u062a\u062d\u062f\u064a\u062f \u0627\u0644\u062c\u0647\u062f \u0648\u0627\u0644\u062a\u0643\u0644\u0641\u0629 \u0627\u0644\u0645\u0637\u0644\u0648\u0628\u062a\u064a\u0646 \u0644\u062a\u0646\u0641\u064a\u0630 \u0627\u0644\u0645\u062a\u0637\u0644\u0628\u0627\u062a \u0627\u0644\u062c\u062f\u064a\u062f\u0629\u060c \u0648\u0644\u0627 \u064a\u064f\u0639\u062f\u0651 \u0623\u064a \u0637\u0644\u0628 \u062a\u063a\u064a\u064a\u0631 \u0645\u0644\u0632\u0645\u0627\u064b \u0625\u0644\u0627 \u0628\u0639\u062f \u062a\u0648\u0642\u064a\u0639 \u0645\u0644\u062d\u0642 \u062a\u0639\u062f\u064a\u0644 \u0645\u0646 \u0627\u0644\u0637\u0631\u0641\u064a\u0646.', article_type: '\u0637\u0644\u0628\u0627\u062a \u0627\u0644\u062a\u063a\u064a\u064a\u0631', is_locked: false, is_visible: true },
  { id: 'a8', order_index: 8, title_ar: '\u0625\u0646\u0647\u0627\u0621 \u0627\u0644\u0627\u062a\u0641\u0627\u0642\u064a\u0629', body_ar: '\u062a\u0646\u062a\u0647\u064a \u0647\u0630\u0647 \u0627\u0644\u0627\u062a\u0641\u0627\u0642\u064a\u0629 \u0641\u064a \u0627\u0644\u062d\u0627\u0644\u0627\u062a \u0627\u0644\u062a\u0627\u0644\u064a\u0629:\n\u0661. \u0628\u0627\u0643\u062a\u0645\u0627\u0644 \u0627\u0644\u0645\u0634\u0631\u0648\u0639 \u0648\u062a\u0633\u0644\u064a\u0645\u0647 \u0628\u0634\u0643\u0644 \u0646\u0647\u0627\u0626\u064a.\n\u0662. \u0628\u0627\u062a\u0641\u0627\u0642 \u0627\u0644\u0637\u0631\u0641\u064a\u0646 \u0639\u0644\u0649 \u0625\u0646\u0647\u0627\u0621 \u0627\u0644\u0645\u0634\u0631\u0648\u0639 \u0642\u0628\u0644 \u062a\u0646\u0641\u064a\u0630\u0647 \u0644\u0623\u0633\u0628\u0627\u0628 \u064a\u062a\u0641\u0642 \u0639\u0644\u064a\u0647\u0627 \u0627\u0644\u0637\u0631\u0641\u0627\u0646 \u0643\u062a\u0627\u0628\u064a\u0627\u064b.\n\u0663. \u064a\u062d\u0642 \u0644\u0643\u0644\u0627 \u0627\u0644\u0637\u0631\u0641\u064a\u0646 \u0625\u0646\u0647\u0627\u0621 \u0627\u0644\u0639\u0642\u062f \u0625\u0630\u0627 \u0623\u062e\u0644 \u0627\u0644\u0637\u0631\u0641 \u0627\u0644\u0622\u062e\u0631 \u0628\u0628\u0646\u0648\u062f\u0647 \u0628\u0639\u062f \u0625\u0646\u0630\u0627\u0631 \u0643\u062a\u0627\u0628\u064a \u0644\u0645\u062f\u0629 \u0644\u0627 \u062a\u0642\u0644 \u0639\u0646 \u0634\u0647\u0631.\n\u0664. \u0625\u0630\u0627 \u0644\u0645 \u064a\u0644\u062a\u0632\u0645 \u0627\u0644\u0637\u0631\u0641 \u0627\u0644\u062b\u0627\u0646\u064a \u0628\u0625\u064a\u062f\u0627\u0639 \u0627\u0644\u062f\u0641\u0639\u0629 \u062e\u0644\u0627\u0644 \u0623\u0633\u0628\u0648\u0639\u064a\u0646 \u0645\u0646 \u062a\u0627\u0631\u064a\u062e \u0627\u0633\u062a\u062d\u0642\u0627\u0642\u0647\u0627.', article_type: '\u0625\u0646\u0647\u0627\u0621 \u0627\u0644\u0627\u062a\u0641\u0627\u0642\u064a\u0629', is_locked: false, is_visible: true },
  { id: 'a9', order_index: 9, title_ar: '\u0623\u062d\u0643\u0627\u0645 \u0639\u0627\u0645\u0629', body_ar: '\u0661. \u064a\u0644\u062a\u0632\u0645 \u0627\u0644\u0637\u0631\u0641\u0627\u0646 \u0628\u0627\u0644\u0623\u062d\u0643\u0627\u0645 \u0648\u0627\u0644\u0636\u0648\u0627\u0628\u0637 \u0627\u0644\u0634\u0631\u0639\u064a\u0629 \u0641\u064a \u062a\u0646\u0641\u064a\u0630 \u0627\u0644\u0623\u0639\u0645\u0627\u0644 \u0627\u0644\u0641\u0646\u064a\u0629.\n\u0662. \u064a\u064f\u0642\u0631 \u0627\u0644\u0637\u0631\u0641\u0627\u0646 \u0628\u0623\u0646\u0647\u0645\u0627 \u0642\u062f \u0627\u0637\u0644\u0639\u0627 \u0639\u0644\u0649 \u0643\u0644 \u0628\u0646\u0648\u062f \u0648\u0645\u062d\u062a\u0648\u0649 \u0647\u0630\u0627 \u0627\u0644\u0639\u0642\u062f \u0648\u062a\u0641\u0647\u0645\u0627\u0647\u0627 \u0648\u0623\u062f\u0631\u0643\u0627 \u0645\u0642\u0627\u0635\u062f\u0647\u0627 \u0625\u062f\u0631\u0627\u0643\u0627\u064b \u0646\u0627\u0641\u064a\u0627\u064b \u0644\u0644\u062c\u0647\u0627\u0644\u0629 \u0648\u0627\u0644\u063a\u0631\u0631.\n\u0663. \u064a\u0643\u0648\u0646 \u0627\u0644\u0639\u0646\u0648\u0627\u0646 \u0627\u0644\u0646\u0638\u0627\u0645\u064a \u0644\u0643\u0644 \u0637\u0631\u0641 \u0647\u0648 \u0627\u0644\u0639\u0646\u0648\u0627\u0646 \u0627\u0644\u0645\u0628\u064a\u0646 \u0641\u064a \u062a\u0645\u0647\u064a\u062f \u0647\u0630\u0627 \u0627\u0644\u0639\u0642\u062f.\n\u0664. \u0644\u0627 \u064a\u064f\u0639\u062a\u062f\u0651 \u0628\u062a\u0639\u062f\u064a\u0644 \u0623\u064a \u0634\u0631\u0637 \u0645\u0646 \u0634\u0631\u0648\u0637 \u0647\u0630\u0627 \u0627\u0644\u0639\u0642\u062f \u0645\u0627 \u0644\u0645 \u064a\u0643\u0646 \u0645\u0643\u062a\u0648\u0628\u0627\u064b \u0628\u0645\u0644\u062d\u0642 \u0648\u0645\u0648\u0642\u0651\u0639\u0627\u064b \u0639\u0644\u064a\u0647 \u0645\u0646 \u0627\u0644\u0637\u0631\u0641\u064a\u0646.\n\u0665. \u064a\u064f\u0639\u062f\u0651 \u0647\u0630\u0627 \u0627\u0644\u0639\u0642\u062f \u0648\u0645\u0627\u0644\u062d\u0642\u0647 \u0646\u0647\u0627\u0626\u064a\u0627\u064b \u0648\u0645\u0644\u0632\u0645\u0627\u064b \u0644\u0644\u0637\u0631\u0641\u064a\u0646 \u0645\u0646 \u062a\u0627\u0631\u064a\u062e \u0625\u0628\u0631\u0627\u0645 \u0627\u0644\u0639\u0642\u062f \u0648\u0645\u0644\u063a\u064a\u0627\u064b \u0644\u0623\u064a \u0639\u0642\u062f \u0623\u0648 \u0627\u062a\u0641\u0627\u0642 \u0633\u0627\u0628\u0642.', article_type: '\u0623\u062d\u0643\u0627\u0645 \u0639\u0627\u0645\u0629', is_locked: true, is_visible: true },
  { id: 'a10', order_index: 10, title_ar: '\u0646\u064f\u0633\u062e \u0627\u0644\u0627\u062a\u0641\u0627\u0642\u064a\u0629', body_ar: '\u062d\u064f\u0631\u0651\u064a\u0631 \u0647\u0630\u0627 \u0627\u0644\u0639\u0642\u062f \u0645\u0646 \u0639\u0634\u0631\u0629 \u0628\u0646\u0648\u062f \u0628\u0646\u0633\u062e\u062a\u064a\u0646 \u0623\u0635\u0644\u064a\u062a\u064a\u0646 \u0628\u0627\u0644\u0644\u063a\u0629 \u0627\u0644\u0639\u0631\u0628\u064a\u0629\u060c \u0648\u0627\u0633\u062a\u0644\u0645 \u0643\u0644 \u0637\u0631\u0641 \u0646\u0633\u062e\u0629\u064b \u0644\u0644\u0639\u0645\u0644 \u0628\u0645\u0648\u062c\u0628\u0647\u0627\u060c \u0648\u064a\u064f\u0639\u062a\u0628\u0631 \u062a\u0648\u0642\u064a\u0639 \u0627\u0644\u0637\u0631\u0641\u064a\u0646 \u0639\u0644\u0649 \u0647\u0630\u0627 \u0627\u0644\u0639\u0642\u062f \u0625\u0642\u0631\u0627\u0631\u0627\u064b \u0628\u0635\u062d\u062a\u0647\u060c \u0648\u0623\u0646 \u0623\u064a \u0643\u0634\u0637 \u0623\u0648 \u062a\u0639\u062f\u064a\u0644 \u063a\u064a\u0631 \u0645\u062a\u0641\u0642 \u0639\u0644\u064a\u0647 \u0645\u0646 \u0627\u0644\u0637\u0631\u0641\u064a\u0646 \u064a\u0643\u0648\u0646 \u0633\u0628\u0628\u0627\u064b \u0641\u064a \u0625\u0644\u063a\u0627\u0621 \u0647\u0630\u0627 \u0627\u0644\u0639\u0642\u062f.\n\u0648\u062a\u0648\u062b\u064a\u0642\u0627\u064b \u0644\u0645\u0627 \u062a\u0642\u062f\u0645 \u0641\u0642\u062f \u062c\u0631\u0649 \u0627\u0644\u062a\u0648\u0642\u064a\u0639 \u0639\u0644\u064a\u0647 \u0641\u064a \u0627\u0644\u064a\u0648\u0645 \u0648\u0627\u0644\u0633\u0646\u0629 \u0627\u0644\u0645\u0628\u064a\u0651\u064e\u0646\u064a\u0646 \u0641\u064a \u062a\u0645\u0647\u064a\u062f\u0647.\n\u0648\u0627\u0644\u0644\u0647 \u0648\u0644\u064a \u0627\u0644\u062a\u0648\u0641\u064a\u0642.', article_type: '\u0646\u0633\u062e \u0627\u0644\u0627\u062a\u0641\u0627\u0642\u064a\u0629', is_locked: true, is_visible: true },
];

// Props use direct Firestore functions — no array-diffing callback pattern.
// This eliminates the stale-closure bug where the callback captured an old
// `contracts` snapshot and could miss saves from the empty template path.
interface ContractEditorProps {
  contractId: string | null;
  onClose: () => void;
  contracts: Contract[];
  onSaveNew: (c: Contract) => Promise<void>;      // addContract
  onSaveEdit: (id: string, data: Partial<Contract>) => Promise<void>; // updateContract
  projects: any[];
  clients: any[];
  templates: ContractTemplate[];
  onSaveTemplate: (t: ContractTemplate) => Promise<void>; // addTemplate
}

export default function ContractEditor({
  contractId, onClose, contracts,
  onSaveNew, onSaveEdit,
  projects, clients, templates, onSaveTemplate
}: ContractEditorProps) {
  const { lang } = useLang();
  const [activeTab, setActiveTab] = useState<Tab>('metadata');
  const [contract, setContract] = useState<Contract | null>(null);
  const [isSelectingTemplate, setIsSelectingTemplate] = useState(!contractId);
  const [saveAsTemplateModal, setSaveAsTemplateModal] = useState(false);
  const [saveAsTemplateName, setSaveAsTemplateName] = useState('');
  const [saveAsTemplateFeedback, setSaveAsTemplateFeedback] = useState<'success' | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (contractId) {
      const existing = contracts.find((c: Contract) => c.id === contractId);
      if (existing) setContract(JSON.parse(JSON.stringify(existing)));
    }
  }, [contractId, contracts]);

  const handleSelectTemplate = (template: ContractTemplate | null) => {
    const newContract: Contract = {
      id: Date.now().toString(),
      contract_number: `CMS-${new Date().getFullYear()}-${Math.floor(Math.random() * 10000).toString().padStart(4, '0')}`,
      title_ar: template ? template.name_ar : '\u0639\u0642\u062f \u062c\u062f\u064a\u062f',
      type: template ? template.default_type : '\u062a\u0637\u0648\u064a\u0631 \u0628\u0631\u0645\u062c\u064a\u0627\u062a',
      status: template ? template.default_status : '\u0645\u0633\u0648\u062f\u0629',
      client_id: (clients || [])[0]?.id || '',
      start_date: new Date().toISOString().split('T')[0],
      end_date: '',
      hijri_date: toHijri(new Date().toISOString().split('T')[0]),
      tags: template && template.tags ? [...template.tags] : [],
      articles: template ? JSON.parse(JSON.stringify(template.default_articles)) : getDefaultArticles(),
      payment_schedule: template && template.default_payment_schedule
        ? JSON.parse(JSON.stringify(template.default_payment_schedule))
        : { subtotal_sar: 0, vat_rate: 15, vat_amount: 0, total_sar: 0, bank_iban: 'SA865134841770007', bank_name: '\u0628\u0646\u0643 \u0627\u0644\u0628\u0644\u0627\u062f', account_holder: '\u0634\u0631\u0643\u0629 \u062f\u0631\u0627\u064a\u0629 \u0627\u0644\u0630\u0643\u064a\u0629 \u0644\u062a\u0642\u0646\u064a\u0629 \u0627\u0644\u0645\u0639\u0644\u0648\u0645\u0627\u062a', tasks: [], installments: [] },
      appendices: template && template.default_appendices ? JSON.parse(JSON.stringify(template.default_appendices)) : [],
      attachments: [],
      versions: [],
      template_id: template ? template.id : undefined
    };
    setContract(newContract);
    setIsSelectingTemplate(false);
  };

  if (isSelectingTemplate) {
    return (
      <div className="flex flex-col h-full bg-slate-50 p-8">
        <div className="max-w-4xl mx-auto w-full space-y-8">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-slate-800">{t('\u0625\u0646\u0634\u0627\u0621 \u0639\u0642\u062f \u062c\u062f\u064a\u062f', 'Create New Contract', lang)}</h1>
              <p className="text-slate-500 mt-1">{t('\u0627\u062e\u062a\u0631 \u0642\u0627\u0644\u0628\u0627\u064b \u0644\u0644\u0628\u062f\u0621 \u0623\u0648 \u0627\u0628\u062f\u0623 \u0628\u0639\u0642\u062f \u0641\u0627\u0631\u063a', 'Choose a template to start or start with an empty contract', lang)}</p>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-full text-slate-500 transition-colors"><X size={24} /></button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <button onClick={() => handleSelectTemplate(null)} className="flex flex-col items-center justify-center p-8 bg-white border-2 border-dashed border-slate-300 rounded-xl hover:border-emerald-500 hover:bg-emerald-50 transition-all group">
              <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4 group-hover:bg-emerald-100 transition-colors"><FileText size={32} className="text-slate-400 group-hover:text-emerald-600" /></div>
              <h3 className="text-lg font-bold text-slate-800">{t('\u0639\u0642\u062f \u0641\u0627\u0631\u063a', 'Empty Contract', lang)}</h3>
              <p className="text-sm text-slate-500 text-center mt-2">{t('\u0627\u0628\u062f\u0623 \u0645\u0646 \u0627\u0644\u0635\u0641\u0631 \u0628\u062f\u0648\u0646 \u0628\u0646\u0648\u062f \u0645\u0633\u0628\u0642\u0629', 'Start from scratch without predefined articles', lang)}</p>
            </button>
            {templates.map((tpl: ContractTemplate) => (
              <button key={tpl.id} onClick={() => handleSelectTemplate(tpl)} className="flex flex-col items-start p-6 bg-white border border-slate-200 rounded-xl hover:border-emerald-500 hover:shadow-md transition-all text-right">
                <div className="flex justify-between w-full mb-4">
                  <div className="w-12 h-12 bg-blue-50 rounded-lg flex items-center justify-center"><FileCode2 size={24} className="text-blue-600" /></div>
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-800 h-6">{tpl.category}</span>
                </div>
                <h3 className="text-lg font-bold text-slate-800 mb-1">{tpl.name_ar}</h3>
                {tpl.description && <p className="text-sm text-slate-500 mb-4 line-clamp-2">{tpl.description}</p>}
                <div className="mt-auto flex items-center space-x-4 space-x-reverse text-xs text-slate-400">
                  <span className="flex items-center"><FileText size={14} className="ml-1" /> {tpl.default_articles.length} \u0628\u0646\u0648\u062f</span>
                  <span>{tpl.default_type}</span>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!contract) return <div className="p-8">Loading...</div>;

  // --- Direct Firestore save — no array-diffing ---
  const handleSave = async () => {
    if (saving) return;
    setSaving(true);
    try {
      let updatedContract = { ...contract };

      if (contractId) {
        // EDIT: compute version snapshot then update
        const originalContract = contracts.find((c: Contract) => c.id === contractId);
        if (originalContract) {
          const currentWithoutVersions = { ...contract, versions: [] };
          const originalWithoutVersions = { ...originalContract, versions: [] };
          if (JSON.stringify(currentWithoutVersions) !== JSON.stringify(originalWithoutVersions)) {
            let summary = '\u062a\u062d\u062f\u064a\u062b \u062a\u0644\u0642\u0627\u0626\u064a \u0644\u0644\u0639\u0642\u062f';
            if (JSON.stringify(contract.articles) !== JSON.stringify(originalContract.articles)) summary = '\u062a\u062d\u062f\u064a\u062b \u0627\u0644\u0628\u0646\u0648\u062f';
            else if (JSON.stringify(contract.payment_schedule) !== JSON.stringify(originalContract.payment_schedule)) summary = '\u062a\u062d\u062f\u064a\u062b \u0627\u0644\u062f\u0641\u0639\u0627\u062a';
            else if (JSON.stringify(contract.appendices) !== JSON.stringify(originalContract.appendices)) summary = '\u062a\u062d\u062f\u064a\u062b \u0627\u0644\u0645\u0644\u0627\u062d\u0642';
            else summary = '\u062a\u062d\u062f\u064a\u062b \u0645\u0639\u0644\u0648\u0645\u0627\u062a \u0627\u0644\u0639\u0642\u062f';

            const lastVersion = contract.versions.length > 0
              ? Math.max(...contract.versions.map((v: ContractVersion) => v.version_number)) : 0;
            const { versions: _v, ...contractWithoutVersions } = contract;
            const newVersion: ContractVersion = {
              version_number: lastVersion + 1,
              created_at: new Date().toISOString(),
              change_summary: summary,
              snapshot: JSON.parse(JSON.stringify({ ...contractWithoutVersions, versions: [] })) as Omit<Contract, 'versions'>,
            };
            updatedContract.versions = [newVersion, ...contract.versions];
          }
        }
        await onSaveEdit(contractId, updatedContract);
      } else {
        // NEW CONTRACT: attach initial version then call addContract directly
        const { versions: _v, ...contractWithoutVersions } = contract;
        const newVersion: ContractVersion = {
          version_number: 1,
          created_at: new Date().toISOString(),
          change_summary: '\u0625\u0646\u0634\u0627\u0621 \u0627\u0644\u0639\u0642\u062f',
          snapshot: JSON.parse(JSON.stringify({ ...contractWithoutVersions, versions: [] })) as Omit<Contract, 'versions'>,
        };
        updatedContract.versions = [newVersion];
        await onSaveNew(updatedContract);  // directly calls setDoc — no stale closure
      }
      onClose();
    } catch (err) {
      console.error('[ContractEditor] save failed:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleSaveAsTemplate = () => { setSaveAsTemplateName(contract.title_ar || ''); setSaveAsTemplateModal(true); };

  const confirmSaveAsTemplate = async () => {
    if (!saveAsTemplateName.trim()) return;
    const newTemplate: ContractTemplate = {
      id: Date.now().toString(),
      name_ar: saveAsTemplateName.trim(),
      category: '\u0645\u062e\u0635\u0635',
      default_status: '\u0645\u0633\u0648\u062f\u0629',
      default_type: contract.type,
      default_articles: JSON.parse(JSON.stringify(contract.articles)),
      default_payment_schedule: JSON.parse(JSON.stringify(contract.payment_schedule)),
      default_appendices: JSON.parse(JSON.stringify(contract.appendices)),
      tags: contract.tags ? [...contract.tags] : [],
      is_default: false,
    };
    await onSaveTemplate(newTemplate);  // directly calls setDoc
    setSaveAsTemplateModal(false);
    setSaveAsTemplateFeedback('success');
    setTimeout(() => setSaveAsTemplateFeedback(null), 3000);
  };

  const tabs = [
    { id: 'metadata', label_ar: '\u0645\u0639\u0644\u0648\u0645\u0627\u062a \u0627\u0644\u0639\u0642\u062f', label_en: 'Parties & Info', icon: Users },
    { id: 'articles', label_ar: '\u0627\u0644\u0628\u0646\u0648\u062f', label_en: 'Articles', icon: FileText },
    { id: 'payments', label_ar: '\u0627\u0644\u0645\u062f\u0641\u0648\u0639\u0627\u062a', label_en: 'Payments', icon: CreditCard },
    { id: 'appendices', label_ar: '\u0627\u0644\u0645\u0644\u0627\u062d\u0642', label_en: 'Appendices', icon: FileText },
    { id: 'attachments', label_ar: '\u0627\u0644\u0645\u0631\u0641\u0642\u0627\u062a', label_en: 'Attachments', icon: Paperclip },
    { id: 'versions', label_ar: '\u0627\u0644\u0625\u0635\u062f\u0627\u0631\u0627\u062a', label_en: 'Versions', icon: History },
    { id: 'preview', label_ar: '\u0645\u0639\u0627\u064a\u0646\u0629 \u0627\u0644\u0639\u0642\u062f', label_en: 'Preview', icon: Eye },
  ];

  return (
    <div className="flex flex-col h-full bg-slate-50">
      <header className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between shrink-0 no-print">
        <div className="flex items-center space-x-4 space-x-reverse">
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full text-slate-500"><X size={20} /></button>
          <div>
            <h1 className="text-xl font-bold text-slate-800">{contract.contract_number}</h1>
            <p className="text-sm text-slate-500">{contract.status}</p>
          </div>
        </div>
        <div className="flex items-center space-x-3 space-x-reverse">
          {saveAsTemplateFeedback === 'success' && (
            <span className="text-sm text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-lg flex items-center gap-1.5">
              <CheckCircle size={14} /> \u062a\u0645 \u062d\u0641\u0638 \u0627\u0644\u0642\u0627\u0644\u0628
            </span>
          )}
          <button onClick={handleSaveAsTemplate} className="flex items-center space-x-2 space-x-reverse bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 px-4 py-2 rounded-lg font-medium transition-colors">
            <FileCode2 size={18} /><span>{t('\u062d\u0641\u0638 \u0643\u0642\u0627\u0644\u0628', 'Save as Template', lang)}</span>
          </button>
          <button onClick={handleSave} disabled={saving} className="flex items-center space-x-2 space-x-reverse bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white px-4 py-2 rounded-lg font-medium transition-colors">
            <Save size={18} /><span>{saving ? t('\u062c\u0627\u0631\u064d...', 'Saving...', lang) : t('\u062d\u0641\u0638 \u0627\u0644\u0639\u0642\u062f', 'Save Contract', lang)}</span>
          </button>
        </div>
      </header>

      {saveAsTemplateModal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center no-print" dir="rtl">
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-bold text-slate-800 mb-4">\u062d\u0641\u0638 \u0643\u0642\u0627\u0644\u0628 \u062c\u062f\u064a\u062f</h3>
            <label className="block text-sm font-medium text-slate-700 mb-2">\u0627\u0633\u0645 \u0627\u0644\u0642\u0627\u0644\u0628</label>
            <input type="text" dir="rtl" value={saveAsTemplateName} onChange={e => setSaveAsTemplateName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && confirmSaveAsTemplate()} autoFocus
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none mb-5"
              placeholder="\u0645\u062b\u0627\u0644: \u0642\u0627\u0644\u0628 \u062a\u0637\u0648\u064a\u0631 \u0645\u0646\u0635\u0629 SaaS" />
            <div className="flex gap-3 justify-end">
              <button onClick={() => setSaveAsTemplateModal(false)} className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg text-sm font-medium">\u0625\u0644\u063a\u0627\u0621</button>
              <button onClick={confirmSaveAsTemplate} disabled={!saveAsTemplateName.trim()}
                className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white px-4 py-2 rounded-lg text-sm font-medium">
                <FileCode2 size={16} /> \u062d\u0641\u0638 \u0627\u0644\u0642\u0627\u0644\u0628
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="flex flex-1 overflow-hidden">
        <div className="w-64 bg-white border-l border-slate-200 flex flex-col shrink-0 no-print">
          <div className="p-4 space-y-1">
            {tabs.map(tab => (
              <button key={tab.id} onClick={() => setActiveTab(tab.id as Tab)}
                className={`w-full flex items-center space-x-3 space-x-reverse px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                  activeTab === tab.id ? 'bg-emerald-50 text-emerald-700' : 'text-slate-600 hover:bg-slate-50'}`}>
                <tab.icon size={18} className={activeTab === tab.id ? 'text-emerald-600' : 'text-slate-400'} />
                <span>{t(tab.label_ar, tab.label_en, lang)}</span>
              </button>
            ))}
          </div>
        </div>
        <div className="flex-1 overflow-auto p-8">
          <div className="max-w-4xl mx-auto">
            {activeTab === 'metadata' && <MetadataEditor contract={contract} setContract={setContract} lang={lang} projects={projects} clients={clients} templates={templates} />}
            {activeTab === 'articles' && <ArticlesEditor contract={contract} setContract={setContract} lang={lang} />}
            {activeTab === 'payments' && <PaymentsEditor contract={contract} setContract={setContract} lang={lang} />}
            {activeTab === 'appendices' && <AppendicesEditor contract={contract} setContract={setContract} lang={lang} />}
            {activeTab === 'attachments' && <AttachmentsEditor contract={contract} setContract={setContract} lang={lang} />}
            {activeTab === 'versions' && <VersionsEditor contract={contract} setContract={setContract} lang={lang} />}
            {activeTab === 'preview' && <ContractPreview contract={contract} lang={lang} projects={projects} clients={clients || []} />}
          </div>
        </div>
      </div>
    </div>
  );
}

function MetadataEditor({ contract, setContract, lang, projects, clients, templates }: any) {
  const { settings, getDefaultEntity } = useSettings();
  const selectedProject = projects?.find((p: any) => p.id === contract.project_id);
  const showClientWarning = selectedProject && selectedProject.client_id !== contract.client_id;
  const selectedTemplate = templates?.find((t: ContractTemplate) => t.id === contract.template_id);

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 space-y-8">
      <div>
        <div className="flex justify-between items-center border-b border-slate-100 pb-4 mb-6">
          <h2 className="text-lg font-bold text-slate-800">{t('\u0645\u0639\u0644\u0648\u0645\u0627\u062a \u0627\u0644\u0639\u0642\u062f', 'Contract Information', lang)}</h2>
          {selectedTemplate && (
            <div className="flex items-center space-x-2 space-x-reverse bg-blue-50 text-blue-700 px-3 py-1.5 rounded-lg text-sm font-medium border border-blue-100">
              <FileCode2 size={16} /><span>\u0642\u0627\u0644\u0628: {selectedTemplate.name_ar}</span>
            </div>
          )}
        </div>
        <div className="grid grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">{t('\u0639\u0646\u0648\u0627\u0646 \u0627\u0644\u0639\u0642\u062f', 'Contract Title', lang)}</label>
            <input type="text" dir="rtl" value={contract.title_ar} onChange={e => setContract({...contract, title_ar: e.target.value})} className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none" />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">{t('\u0646\u0648\u0639 \u0627\u0644\u0639\u0642\u062f', 'Contract Type', lang)}</label>
            <select value={contract.type} onChange={e => setContract({...contract, type: e.target.value})} className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none">
              <option value="\u062a\u0637\u0648\u064a\u0631 \u0628\u0631\u0645\u062c\u064a\u0627\u062a">\u062a\u0637\u0648\u064a\u0631 \u0628\u0631\u0645\u062c\u064a\u0627\u062a</option>
              <option value="\u0627\u0634\u062a\u0631\u0627\u0643/SaaS">\u0627\u0634\u062a\u0631\u0627\u0643/SaaS</option>
              <option value="\u0625\u0646\u062a\u0627\u062c \u0645\u062d\u062a\u0648\u0649">\u0625\u0646\u062a\u0627\u062c \u0645\u062d\u062a\u0648\u0649</option>
              <option value="\u0645\u062e\u062a\u0644\u0637">\u0645\u062e\u062a\u0644\u0637</option>
            </select>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">\u0627\u0644\u0645\u0634\u0631\u0648\u0639</label>
            <select value={contract.project_id || ''} onChange={e => {
              const projectId = e.target.value;
              const project = projects?.find((p: any) => p.id === projectId);
              if (project) setContract({ ...contract, project_id: projectId, client_id: project.client_id });
              else setContract({ ...contract, project_id: undefined });
            }} className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none">
              <option value="">\u0628\u062f\u0648\u0646 \u0645\u0634\u0631\u0648\u0639</option>
              {projects?.map((p: any) => <option key={p.id} value={p.id}>{p.name_ar}</option>)}
            </select>
            {selectedProject && (
              <div className="mt-2 bg-slate-50 border border-slate-200 rounded-lg p-3 text-sm text-slate-600 space-y-1">
                <div className="flex justify-between"><span className="text-slate-500">\u0627\u0644\u0646\u0648\u0639:</span><span className="font-medium">{selectedProject.project_type}</span></div>
                <div className="flex justify-between"><span className="text-slate-500">\u0627\u0644\u0639\u0645\u064a\u0644:</span><span className="font-medium">{(clients || []).find((c: any) => c.id === selectedProject.client_id)?.name_ar || '\u063a\u064a\u0631 \u0645\u0639\u0631\u0648\u0641'}</span></div>
                <div className="flex justify-between"><span className="text-slate-500">\u0627\u0644\u0642\u064a\u0645\u0629:</span><span className="font-medium">{selectedProject.amount_sar.toLocaleString('ar-SA')} \u0631.\u0633</span></div>
              </div>
            )}
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">\u0627\u0644\u062c\u0647\u0629 \u0627\u0644\u0645\u064f\u0635\u062f\u0650\u0631\u0629 (\u0627\u0644\u0637\u0631\u0641 \u0627\u0644\u0623\u0648\u0644)</label>
            <select value={contract.entity_id || getDefaultEntity().id} onChange={e => setContract({ ...contract, entity_id: e.target.value })} className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none">
              {settings.entities.map((e: any) => <option key={e.id} value={e.id}>{e.name_ar} {e.is_default ? '(\u0627\u0644\u0627\u0641\u062a\u0631\u0627\u0636\u064a)' : ''}</option>)}
            </select>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">{t('\u062d\u0627\u0644\u0629 \u0627\u0644\u0639\u0642\u062f', 'Status', lang)}</label>
            <select value={contract.status} onChange={e => {
              const s = e.target.value; setContract({...contract, status: s});
              if (s === '\u0645\u0648\u0642\u0651\u0639') platformBus.emit(PLATFORM_EVENTS.CONTRACT_SIGNED, { contractId: contract.id, contractTitle: contract.title_ar, counterpartyId: contract.client_id, projectId: contract.project_id, amount: contract.payment_schedule.total_sar, currency: 'SAR' });
            }} className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none">
              {['\u0645\u0633\u0648\u062f\u0629','\u0642\u064a\u062f \u0627\u0644\u0645\u0631\u0627\u062c\u0639\u0629','\u0645\u0639\u062a\u0645\u062f','\u0645\u0648\u0642\u0651\u0639','\u0646\u0634\u0637','\u0645\u0643\u062a\u0645\u0644','\u0645\u0646\u062a\u0647\u064a'].map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">{t('\u0627\u0644\u0639\u0645\u064a\u0644 (\u0627\u0644\u0637\u0631\u0641 \u0627\u0644\u062b\u0627\u0646\u064a)', 'Client (Party Two)', lang)}</label>
            <select value={contract.client_id} onChange={e => setContract({...contract, client_id: e.target.value})} className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none">
              {(clients || []).map((c: any) => <option key={c.id} value={c.id}>{c.name_ar}</option>)}
            </select>
            {showClientWarning && <p className="text-xs text-amber-600 mt-1">\u0633\u064a\u062a\u0645 \u062a\u062d\u062f\u064a\u062b \u0627\u0644\u0639\u0645\u064a\u0644 \u062a\u0644\u0642\u0627\u0626\u064a\u0627\u064b</p>}
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">{t('\u062a\u0627\u0631\u064a\u062e \u0627\u0644\u0628\u062f\u0621', 'Start Date', lang)}</label>
            <input type="date" value={contract.start_date} onChange={e => { const d = e.target.value; setContract({...contract, start_date: d, hijri_date: toHijri(d)}); }} className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none" />
            <p className="text-xs text-slate-500 mt-1">{contract.hijri_date}</p>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">{t('\u062a\u0627\u0631\u064a\u062e \u0627\u0644\u0627\u0646\u062a\u0647\u0627\u0621', 'End Date', lang)}</label>
            <input type="date" value={contract.end_date || ''} onChange={e => setContract({...contract, end_date: e.target.value})} className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none" />
          </div>
          <div className="space-y-2 col-span-2">
            <label className="text-sm font-medium text-slate-700">{t('\u0627\u0644\u0648\u0633\u0648\u0645 (\u0645\u0641\u0635\u0648\u0644\u0629 \u0628\u0641\u0627\u0635\u0644\u0629)', 'Tags (comma separated)', lang)}</label>
            <input type="text" dir="rtl" value={contract.tags?.join('\u060c ') || ''} onChange={e => setContract({...contract, tags: e.target.value.split('\u060c').map((s: string) => s.trim()).filter(Boolean)})} className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none" />
          </div>
        </div>
      </div>
      {(() => {
        const sel = settings.entities.find((e: any) => e.id === (contract.entity_id || getDefaultEntity().id)) || getDefaultEntity();
        return (
          <div>
            <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-6">
              <h2 className="text-lg font-bold text-slate-800">{t('\u0628\u064a\u0627\u0646\u0627\u062a \u0627\u0644\u0637\u0631\u0641 \u0627\u0644\u0623\u0648\u0644', 'Party One Details', lang)}</h2>
              <span className="text-xs text-slate-400 bg-slate-100 px-3 py-1 rounded-full">{t('\u062a\u064f\u0642\u0631\u0623 \u0645\u0646 \u0625\u0639\u062f\u0627\u062f\u0627\u062a \u0627\u0644\u062c\u0647\u0629', 'Read from entity settings', lang)}</span>
            </div>
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 text-sm text-slate-700" dir="rtl">
              <div className="flex items-start gap-3 mb-4">
                {sel.logo_base64 && <img src={sel.logo_base64} alt="logo" className="h-14 w-28 object-contain border border-slate-200 rounded-lg p-1 bg-white shrink-0" />}
                <div>
                  <p className="text-base font-bold text-slate-800">{sel.name_ar}</p>
                  <p className="text-xs text-slate-500 mt-0.5">\u0633.\u062a: {sel.cr_number}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm border-t border-slate-200 pt-4">
                <div className="flex gap-2"><span className="text-slate-500 shrink-0">\u0627\u0644\u0645\u0645\u062b\u0644:</span><span className="font-medium">{sel.representative_name} \u2014 {sel.representative_title}</span></div>
                <div className="flex gap-2"><span className="text-slate-500 shrink-0">\u0627\u0644\u0639\u0646\u0648\u0627\u0646:</span><span>{sel.city} \u2014 {sel.address}</span></div>
                <div className="flex gap-2"><span className="text-slate-500 shrink-0">\u0627\u0644\u0647\u0627\u062a\u0641:</span><span dir="ltr">{sel.phone}</span></div>
                <div className="flex gap-2"><span className="text-slate-500 shrink-0">\u0627\u0644\u0628\u0631\u064a\u062f:</span><span dir="ltr">{sel.email}</span></div>
                <div className="flex gap-2"><span className="text-slate-500 shrink-0">\u0627\u0644\u0628\u0646\u0643:</span><span>{sel.bank_name} \u2014 {sel.account_holder}</span></div>
                <div className="flex gap-2 col-span-2"><span className="text-slate-500 shrink-0">\u0627\u0644\u0622\u064a\u0628\u0627\u0646:</span><span dir="ltr" className="font-mono">{sel.bank_iban}</span></div>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}

export function ArticlesEditor({ contract, setContract, lang }: any) {
  const addArticle = () => setContract({ ...contract, articles: [...contract.articles, { id: Date.now().toString(), order_index: contract.articles.length + 1, title_ar: '\u0628\u0646\u062f \u062c\u062f\u064a\u062f', body_ar: '', article_type: '\u0645\u062e\u0635\u0635', is_locked: false, is_visible: true } as Article] });
  const updateArticle = (id: string, field: keyof Article, value: any) => setContract({ ...contract, articles: contract.articles.map((a: Article) => a.id === id ? { ...a, [field]: value } : a) });
  const deleteArticle = (id: string) => setContract({ ...contract, articles: contract.articles.filter((a: Article) => a.id !== id).map((a: Article, idx: number) => ({ ...a, order_index: idx + 1 })) });
  const moveArticle = (index: number, dir: 'up' | 'down') => {
    if (dir === 'up' && index === 0) return;
    if (dir === 'down' && index === contract.articles.length - 1) return;
    const arr = [...contract.articles]; const ti = dir === 'up' ? index - 1 : index + 1;
    [arr[index], arr[ti]] = [arr[ti], arr[index]];
    setContract({ ...contract, articles: arr.map((a, i) => ({ ...a, order_index: i + 1 })) });
  };
  const addBlock = (articleId: string, type: 'paragraph' | 'list' | 'page_break') => {
    const art = contract.articles.find((a: Article) => a.id === articleId); if (!art) return;
    const id = Date.now().toString();
    const b: ArticleBlock = type === 'paragraph' ? { id, type: 'paragraph', text_ar: '' } : type === 'list' ? { id, type: 'list', style: 'unordered', items: [{ id: id + '1', text_ar: '' }] } : { id, type: 'page_break' };
    updateArticle(articleId, 'blocks', [...(art.blocks || []), b]);
  };
  const updateBlock = (articleId: string, blockId: string, updates: Partial<ArticleBlock>) => {
    const art = contract.articles.find((a: Article) => a.id === articleId); if (!art?.blocks) return;
    updateArticle(articleId, 'blocks', art.blocks.map((b: ArticleBlock) => b.id === blockId ? { ...b, ...updates } : b));
  };
  const deleteBlock = (articleId: string, blockId: string) => {
    const art = contract.articles.find((a: Article) => a.id === articleId); if (!art?.blocks) return;
    updateArticle(articleId, 'blocks', art.blocks.filter((b: ArticleBlock) => b.id !== blockId));
  };
  const moveBlock = (articleId: string, index: number, dir: 'up' | 'down') => {
    const art = contract.articles.find((a: Article) => a.id === articleId); if (!art?.blocks) return;
    if (dir === 'up' && index === 0) return; if (dir === 'down' && index === art.blocks.length - 1) return;
    const arr = [...art.blocks]; const ti = dir === 'up' ? index - 1 : index + 1;
    [arr[index], arr[ti]] = [arr[ti], arr[index]]; updateArticle(articleId, 'blocks', arr);
  };
  const convertToBlocks = (articleId: string) => {
    const art = contract.articles.find((a: Article) => a.id === articleId); if (!art) return;
    updateArticle(articleId, 'blocks', [{ id: Date.now().toString(), type: 'paragraph', text_ar: art.body_ar || '' } as ParagraphBlock]);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-bold text-slate-800">{t('\u0628\u0646\u0648\u062f \u0627\u0644\u0639\u0642\u062f', 'Contract Articles', lang)}</h2>
        <button onClick={addArticle} className="flex items-center space-x-2 space-x-reverse text-sm font-medium text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-lg">
          <Plus size={16} /><span>{t('\u0625\u0636\u0627\u0641\u0629 \u0628\u0646\u062f', 'Add Article', lang)}</span>
        </button>
      </div>
      <div className="space-y-4">
        {contract.articles.map((article: Article, index: number) => (
          <div key={article.id} className={`bg-white rounded-xl shadow-sm border ${article.is_visible ? 'border-slate-200' : 'border-dashed border-slate-300 opacity-50'} overflow-hidden`}>
            <div className="bg-slate-50 px-4 py-3 border-b border-slate-200 flex justify-between items-center">
              <div className="flex items-center space-x-3 space-x-reverse">
                <div className="flex flex-col space-y-1 ml-2">
                  <button onClick={() => moveArticle(index, 'up')} className="text-slate-400 hover:text-emerald-600"><ArrowUp size={14} /></button>
                  <button onClick={() => moveArticle(index, 'down')} className="text-slate-400 hover:text-emerald-600"><ArrowDown size={14} /></button>
                </div>
                <span className="text-sm font-bold text-slate-500 w-16">\u0627\u0644\u0628\u0646\u062f {index + 1}</span>
                <input type="text" dir="rtl" value={article.title_ar} onChange={e => updateArticle(article.id, 'title_ar', e.target.value)} disabled={article.is_locked} className="bg-transparent border-none focus:ring-0 font-bold text-slate-800 w-48 px-0 outline-none disabled:opacity-70" />
                <select value={article.article_type} onChange={e => updateArticle(article.id, 'article_type', e.target.value)} disabled={article.is_locked} className="text-xs bg-white border border-slate-200 rounded px-2 py-1 outline-none disabled:opacity-70">
                  {['\u062a\u0645\u0647\u064a\u062f','\u0645\u0648\u0636\u0648\u0639','\u0645\u062f\u0629 \u0627\u0644\u062a\u0646\u0641\u064a\u0630','\u0627\u0644\u0642\u064a\u0645\u0629 \u0648\u0627\u0644\u062f\u0641\u0639\u0627\u062a','\u0627\u0644\u0645\u0644\u0643\u064a\u0629 \u0627\u0644\u0641\u0643\u0631\u064a\u0629','\u0625\u062f\u0627\u0631\u0629 \u0627\u0644\u0645\u0634\u0631\u0648\u0639','\u0637\u0644\u0628\u0627\u062a \u0627\u0644\u062a\u063a\u064a\u064a\u0631','\u0625\u0646\u0647\u0627\u0621 \u0627\u0644\u0627\u062a\u0641\u0627\u0642\u064a\u0629','\u0623\u062d\u0643\u0627\u0645 \u0639\u0627\u0645\u0629','\u0646\u0633\u062e \u0627\u0644\u0627\u062a\u0641\u0627\u0642\u064a\u0629','\u0645\u062e\u0635\u0635'].map(v => <option key={v} value={v}>{v}</option>)}
                </select>
              </div>
              <div className="flex items-center space-x-2 space-x-reverse">
                <button onClick={() => updateArticle(article.id, 'is_visible', !article.is_visible)} className={`p-1.5 rounded ${article.is_visible ? 'text-emerald-600 bg-emerald-50' : 'text-slate-400 bg-slate-100'}`}><Eye size={16} /></button>
                <button onClick={() => updateArticle(article.id, 'is_locked', !article.is_locked)} className={`p-1.5 rounded ${article.is_locked ? 'text-amber-600 bg-amber-50' : 'text-slate-400 bg-slate-100'}`}>{article.is_locked ? <Lock size={16} /> : <Unlock size={16} />}</button>
                <button onClick={() => deleteArticle(article.id)} className="text-slate-400 hover:text-red-500 p-1.5"><Trash2 size={16} /></button>
              </div>
            </div>
            <div className="p-4 relative">
              {article.blocks ? (
                <div className="space-y-4">
                  {article.blocks.map((block: ArticleBlock, bIndex: number) => (
                    <div key={block.id} className="relative group bg-white border border-slate-200 rounded-lg p-3">
                      <div className="absolute top-2 left-2 opacity-0 group-hover:opacity-100 transition-opacity flex items-center space-x-1 space-x-reverse bg-white shadow-sm border border-slate-100 rounded-md p-1 z-10">
                        <button onClick={() => moveBlock(article.id, bIndex, 'up')} disabled={bIndex === 0 || article.is_locked} className="p-1 text-slate-400 hover:text-emerald-600 disabled:opacity-50"><ArrowUp size={14} /></button>
                        <button onClick={() => moveBlock(article.id, bIndex, 'down')} disabled={bIndex === article.blocks!.length - 1 || article.is_locked} className="p-1 text-slate-400 hover:text-emerald-600 disabled:opacity-50"><ArrowDown size={14} /></button>
                        <div className="w-px h-4 bg-slate-200 mx-1" />
                        <button onClick={() => deleteBlock(article.id, block.id)} disabled={article.is_locked} className="p-1 text-slate-400 hover:text-red-500 disabled:opacity-50"><Trash2 size={14} /></button>
                      </div>
                      {block.type === 'paragraph' && <textarea dir="rtl" value={block.text_ar} onChange={e => updateBlock(article.id, block.id, { text_ar: e.target.value })} disabled={article.is_locked} className="w-full min-h-[80px] p-2 bg-transparent border-none focus:ring-0 outline-none resize-y text-slate-700 disabled:text-slate-500" placeholder="\u0646\u0635 \u0627\u0644\u0641\u0642\u0631\u0629..." />}
                      {block.type === 'list' && (
                        <div className="space-y-3">
                          <div className="flex items-center space-x-2 space-x-reverse mb-2">
                            <span className="text-xs font-medium text-slate-500">\u0646\u0645\u0637 \u0627\u0644\u0642\u0627\u0626\u0645\u0629:</span>
                            <select value={block.style} onChange={e => updateBlock(article.id, block.id, { style: e.target.value as any })} disabled={article.is_locked} className="text-xs border border-slate-200 rounded px-2 py-1 outline-none">
                              <option value="unordered">\u0646\u0642\u0637\u064a\u0629</option><option value="ordered">\u0631\u0642\u0645\u064a\u0629</option><option value="alpha">\u0623\u0628\u062c\u062f\u064a\u0629</option>
                            </select>
                          </div>
                          {block.items.map((item, iIndex) => (
                            <div key={item.id} className="flex items-start space-x-2 space-x-reverse">
                              <span className="mt-2 text-slate-400 text-xs w-4 text-center">{block.style === 'ordered' ? `${iIndex + 1}.` : block.style === 'alpha' ? `${String.fromCharCode(1575 + iIndex)}.` : '\u2022'}</span>
                              <input type="text" dir="rtl" value={item.text_ar} onChange={e => { const ni = [...block.items]; ni[iIndex].text_ar = e.target.value; updateBlock(article.id, block.id, { items: ni }); }} disabled={article.is_locked} className="flex-1 p-1.5 border-b border-transparent hover:border-slate-200 focus:border-emerald-500 bg-transparent outline-none" />
                              {!article.is_locked && <button onClick={() => updateBlock(article.id, block.id, { items: block.items.filter((_, i) => i !== iIndex) })} className="p-1.5 text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100"><X size={14} /></button>}
                            </div>
                          ))}
                          {!article.is_locked && <button onClick={() => updateBlock(article.id, block.id, { items: [...block.items, { id: Date.now().toString(), text_ar: '' }] })} className="text-xs text-emerald-600 font-medium flex items-center space-x-1 space-x-reverse mt-2"><Plus size={12} /> <span>\u0625\u0636\u0627\u0641\u0629 \u0639\u0646\u0635\u0631</span></button>}
                        </div>
                      )}
                      {block.type === 'page_break' && <div className="flex flex-col items-center justify-center py-6 border-2 border-dashed border-slate-200 rounded-lg bg-slate-50 text-slate-400"><FileMinus size={24} className="mb-2 opacity-50" /><span className="text-sm font-medium">\u0641\u0627\u0635\u0644 \u0635\u0641\u062d\u0629</span></div>}
                    </div>
                  ))}
                  {!article.is_locked && (
                    <div className="flex items-center space-x-2 space-x-reverse pt-2 border-t border-slate-100">
                      <button onClick={() => addBlock(article.id, 'paragraph')} className="flex items-center space-x-1 space-x-reverse px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-md text-xs font-medium"><AlignRight size={14} /> <span>\u0625\u0636\u0627\u0641\u0629 \u0641\u0642\u0631\u0629</span></button>
                      <button onClick={() => addBlock(article.id, 'list')} className="flex items-center space-x-1 space-x-reverse px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-md text-xs font-medium"><ListOrdered size={14} /> <span>\u0625\u0636\u0627\u0641\u0629 \u0642\u0627\u0626\u0645\u0629</span></button>
                      <button onClick={() => addBlock(article.id, 'page_break')} className="flex items-center space-x-1 space-x-reverse px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-md text-xs font-medium"><FileMinus size={14} /> <span>\u0641\u0627\u0635\u0644 \u0635\u0641\u062d\u0629</span></button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-3">
                  <textarea dir="rtl" value={article.body_ar} onChange={e => updateArticle(article.id, 'body_ar', e.target.value)} disabled={article.is_locked} className={`w-full h-32 p-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none resize-y ${article.is_locked ? 'bg-slate-100 cursor-not-allowed text-slate-400' : ''}`} placeholder="\u0646\u0635 \u0627\u0644\u0628\u0646\u062f..." />
                  {!article.is_locked && <button onClick={() => convertToBlocks(article.id)} className="text-xs font-medium text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-md">\u0627\u0644\u062a\u0631\u0642\u064a\u0629 \u0625\u0644\u0649 \u0643\u062a\u0644 \u0627\u0644\u0645\u062d\u062a\u0648\u0649 (Blocks)</button>}
                </div>
              )}
              {article.is_locked && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-20">
                  <div className="bg-white/90 px-4 py-2 rounded-lg flex items-center space-x-2 space-x-reverse text-slate-500 shadow-sm border border-slate-100"><Lock size={16} /><span className="text-sm font-medium">\u0647\u0630\u0627 \u0627\u0644\u0628\u0646\u062f \u0645\u062d\u0645\u064a</span></div>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function PaymentsEditor({ contract, setContract, lang }: any) {
  const schedule = contract.payment_schedule;
  const upd = (u: Partial<PaymentSchedule>) => setContract({ ...contract, payment_schedule: { ...schedule, ...u } });
  const taskLogic = (tasks: TaskRow[], insts: Installment[]) => {
    const sub = tasks.reduce((s: number, t: TaskRow) => s + Number(t.cost_sar || 0), 0);
    const vat = sub * (schedule.vat_rate / 100); const total = sub + vat;
    upd({ tasks, subtotal_sar: sub, vat_amount: vat, total_sar: total, installments: insts.map((i: Installment) => ({ ...i, amount_sar: total * (i.percentage / 100), amount_words_ar: numberToArabicWords(total * (i.percentage / 100)) })) });
  };
  const addTask = () => taskLogic([...schedule.tasks, { id: Date.now().toString(), task_name_ar: '\u0645\u0647\u0645\u0629 \u062c\u062f\u064a\u062f\u0629', duration: '', cost_sar: 0, frequency: '\u0645\u0631\u0629 \u0648\u0627\u062d\u062f\u0629' }], schedule.installments);
  const updTask = (id: string, f: keyof TaskRow, v: any) => taskLogic(schedule.tasks.map((t: TaskRow) => t.id === id ? { ...t, [f]: v } : t), schedule.installments);
  const rmTask = (id: string) => taskLogic(schedule.tasks.filter((t: TaskRow) => t.id !== id), schedule.installments);
  const addInst = () => upd({ installments: [...schedule.installments, { id: Date.now().toString(), label_ar: '\u062f\u0641\u0639\u0629 \u062c\u062f\u064a\u062f\u0629', trigger_event: '\u062a\u0648\u0642\u064a\u0639 \u0627\u0644\u0639\u0642\u062f', percentage: 0, amount_sar: 0, amount_words_ar: '\u0635\u0641\u0631 \u0631\u064a\u0627\u0644 \u0633\u0639\u0648\u062f\u064a' }] });
  const updInst = (id: string, f: keyof Installment, v: any) => upd({ installments: schedule.installments.map((i: Installment) => { if (i.id !== id) return i; const u = { ...i, [f]: v }; if (f === 'percentage') { const a = schedule.total_sar * (Number(v) / 100); u.amount_sar = a; u.amount_words_ar = numberToArabicWords(a); } return u; }) });
  const rmInst = (id: string) => upd({ installments: schedule.installments.filter((i: Installment) => i.id !== id) });
  const totalPct = schedule.installments.reduce((s: number, i: Installment) => s + Number(i.percentage || 0), 0);

  return (
    <div className="space-y-8">
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 flex justify-between items-center bg-slate-50">
          <h3 className="font-bold text-slate-800">{t('\u0627\u0644\u0645\u0647\u0627\u0645 \u0648\u0627\u0644\u062a\u0643\u0627\u0644\u064a\u0641', 'Tasks & Costs', lang)}</h3>
          <button onClick={addTask} className="text-sm font-medium text-emerald-600 flex items-center space-x-1 space-x-reverse"><Plus size={16} /> <span>{t('\u0625\u0636\u0627\u0641\u0629 \u0645\u0647\u0645\u0629', 'Add Task', lang)}</span></button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-right text-sm">
            <thead className="bg-slate-50 text-slate-500 border-b border-slate-200"><tr>
              <th className="px-6 py-3 font-medium">{t('\u0627\u0644\u0645\u0647\u0645\u0629','Task',lang)}</th><th className="px-6 py-3 font-medium">{t('\u0627\u0644\u0645\u062f\u0629','Duration',lang)}</th><th className="px-6 py-3 font-medium">{t('\u0627\u0644\u062a\u0643\u0644\u0641\u0629 (\u0631.\u0633)','Cost (SAR)',lang)}</th><th className="px-6 py-3 font-medium">{t('\u0627\u0644\u062a\u0643\u0631\u0627\u0631','Frequency',lang)}</th><th className="px-6 py-3 w-16"></th>
            </tr></thead>
            <tbody className="divide-y divide-slate-100">
              {schedule.tasks.map((task: TaskRow) => (
                <tr key={task.id}>
                  <td className="px-6 py-3"><input type="text" dir="rtl" value={task.task_name_ar} onChange={e => updTask(task.id, 'task_name_ar', e.target.value)} className="w-full p-2 border border-slate-200 rounded focus:ring-1 focus:ring-emerald-500 outline-none" /></td>
                  <td className="px-6 py-3"><input type="text" dir="rtl" value={task.duration} onChange={e => updTask(task.id, 'duration', e.target.value)} className="w-full p-2 border border-slate-200 rounded focus:ring-1 focus:ring-emerald-500 outline-none" /></td>
                  <td className="px-6 py-3"><input type="number" value={task.cost_sar} onChange={e => updTask(task.id, 'cost_sar', Number(e.target.value))} className="w-full p-2 border border-slate-200 rounded focus:ring-1 focus:ring-emerald-500 outline-none" /></td>
                  <td className="px-6 py-3"><select value={task.frequency} onChange={e => updTask(task.id, 'frequency', e.target.value)} className="w-full p-2 border border-slate-200 rounded focus:ring-1 focus:ring-emerald-500 outline-none"><option value="\u0645\u0631\u0629 \u0648\u0627\u062d\u062f\u0629">\u0645\u0631\u0629 \u0648\u0627\u062d\u062f\u0629</option><option value="\u0633\u0646\u0648\u064a">\u0633\u0646\u0648\u064a</option><option value="\u0634\u0647\u0631\u064a">\u0634\u0647\u0631\u064a</option></select></td>
                  <td className="px-6 py-3 text-center"><button onClick={() => rmTask(task.id)} className="text-slate-400 hover:text-red-500"><Trash2 size={16} /></button></td>
                </tr>
              ))}
            </tbody>
            <tfoot className="bg-slate-50 border-t border-slate-200">
              <tr><td colSpan={2} className="px-6 py-3 text-left font-medium text-slate-600">{t('\u0627\u0644\u0625\u062c\u0645\u0627\u0644\u064a','Subtotal',lang)}</td><td className="px-6 py-3 font-bold text-slate-800">{schedule.subtotal_sar.toLocaleString()}</td><td colSpan={2}></td></tr>
              <tr><td colSpan={2} className="px-6 py-3 text-left font-medium text-slate-600">{t('\u0636\u0631\u064a\u0628\u0629 \u0627\u0644\u0642\u064a\u0645\u0629 \u0627\u0644\u0645\u0636\u0627\u0641\u0629 (15%)','VAT (15%)',lang)}</td><td className="px-6 py-3 font-bold text-slate-800">{schedule.vat_amount.toLocaleString()}</td><td colSpan={2}></td></tr>
              <tr className="bg-emerald-50"><td colSpan={2} className="px-6 py-3 text-left font-bold text-emerald-800">{t('\u0627\u0644\u0625\u062c\u0645\u0627\u0644\u064a \u0627\u0644\u0643\u0644\u064a','Total',lang)}</td><td className="px-6 py-3 font-bold text-emerald-800">{schedule.total_sar.toLocaleString()}</td><td colSpan={2}></td></tr>
            </tfoot>
          </table>
        </div>
      </div>
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 flex justify-between items-center bg-slate-50">
          <div className="flex items-center space-x-4 space-x-reverse">
            <h3 className="font-bold text-slate-800">{t('\u062c\u062f\u0648\u0644 \u0627\u0644\u062f\u0641\u0639\u0627\u062a','Installments',lang)}</h3>
            <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${totalPct === 100 ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>{totalPct}%</span>
          </div>
          <button onClick={addInst} className="text-sm font-medium text-emerald-600 flex items-center space-x-1 space-x-reverse"><Plus size={16} /> <span>{t('\u0625\u0636\u0627\u0641\u0629 \u062f\u0641\u0639\u0629','Add Installment',lang)}</span></button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-right text-sm">
            <thead className="bg-slate-50 text-slate-500 border-b border-slate-200"><tr>
              <th className="px-6 py-3 font-medium">{t('\u0627\u0644\u062f\u0641\u0639\u0629','Label',lang)}</th><th className="px-6 py-3 font-medium">{t('\u0627\u0644\u0627\u0633\u062a\u062d\u0642\u0627\u0642','Trigger',lang)}</th><th className="px-6 py-3 font-medium">{t('\u0627\u0644\u0646\u0633\u0628\u0629 (%)','%',lang)}</th><th className="px-6 py-3 font-medium">{t('\u0627\u0644\u0645\u0628\u0644\u063a','Amount',lang)}</th><th className="px-6 py-3 w-16"></th>
            </tr></thead>
            <tbody className="divide-y divide-slate-100">
              {schedule.installments.map((inst: Installment) => (
                <tr key={inst.id}>
                  <td className="px-6 py-3"><input type="text" dir="rtl" value={inst.label_ar} onChange={e => updInst(inst.id, 'label_ar', e.target.value)} className="w-full p-2 border border-slate-200 rounded focus:ring-1 focus:ring-emerald-500 outline-none" /></td>
                  <td className="px-6 py-3"><select value={inst.trigger_event} onChange={e => updInst(inst.id, 'trigger_event', e.target.value)} className="w-full p-2 border border-slate-200 rounded focus:ring-1 focus:ring-emerald-500 outline-none">{['\u062a\u0648\u0642\u064a\u0639 \u0627\u0644\u0639\u0642\u062f','\u0627\u0639\u062a\u0645\u0627\u062f \u0627\u0644\u0645\u062a\u0637\u0644\u0628\u0627\u062a','\u0627\u0644\u0625\u0637\u0644\u0627\u0642 \u0627\u0644\u062a\u062c\u0631\u064a\u0628\u064a','\u0627\u0644\u0625\u0637\u0644\u0627\u0642','\u0645\u062e\u0635\u0635'].map(v => <option key={v} value={v}>{v}</option>)}</select></td>
                  <td className="px-6 py-3"><input type="number" value={inst.percentage} onChange={e => updInst(inst.id, 'percentage', Number(e.target.value))} className="w-full p-2 border border-slate-200 rounded focus:ring-1 focus:ring-emerald-500 outline-none" /></td>
                  <td className="px-6 py-3"><div className="font-medium text-slate-700">{inst.amount_sar.toLocaleString()} \u0631.\u0633</div><div className="text-xs text-slate-500 mt-1">{inst.amount_words_ar}</div></td>
                  <td className="px-6 py-3 text-center"><button onClick={() => rmInst(inst.id)} className="text-slate-400 hover:text-red-500"><Trash2 size={16} /></button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <h3 className="font-bold text-slate-800 mb-4">{t('\u0627\u0644\u0628\u064a\u0627\u0646\u0627\u062a \u0627\u0644\u0628\u0646\u0643\u064a\u0629','Bank Details',lang)}</h3>
        <div className="grid grid-cols-3 gap-4">
          <div><label className="text-sm font-medium text-slate-700">{t('\u0627\u0633\u0645 \u0627\u0644\u0628\u0646\u0643','Bank Name',lang)}</label><input type="text" value={schedule.bank_name} onChange={e => upd({bank_name: e.target.value})} className="w-full mt-1 px-3 py-2 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-emerald-500" /></div>
          <div><label className="text-sm font-medium text-slate-700">{t('\u0627\u0633\u0645 \u0627\u0644\u062d\u0633\u0627\u0628','Account Holder',lang)}</label><input type="text" value={schedule.account_holder} onChange={e => upd({account_holder: e.target.value})} className="w-full mt-1 px-3 py-2 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-emerald-500" /></div>
          <div><label className="text-sm font-medium text-slate-700">{t('\u0631\u0642\u0645 \u0627\u0644\u0622\u064a\u0628\u0627\u0646','IBAN',lang)}</label><input type="text" dir="ltr" value={schedule.bank_iban} onChange={e => upd({bank_iban: e.target.value})} className="w-full mt-1 px-3 py-2 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-emerald-500 text-left" /></div>
        </div>
      </div>
    </div>
  );
}

export function AppendicesEditor({ contract, setContract, lang }: any) {
  const add = () => setContract({ ...contract, appendices: [...contract.appendices, { id: Date.now().toString(), order_index: contract.appendices.length + 1, title_ar: '\u0645\u0644\u062d\u0642 \u062c\u062f\u064a\u062f', body_ar: '', appendix_type: '\u0623\u062e\u0631\u0649' } as Appendix] });
  const upd = (id: string, f: keyof Appendix, v: any) => setContract({ ...contract, appendices: contract.appendices.map((a: Appendix) => a.id === id ? { ...a, [f]: v } : a) });
  const del = (id: string) => setContract({ ...contract, appendices: contract.appendices.filter((a: Appendix) => a.id !== id).map((a: Appendix, i: number) => ({ ...a, order_index: i + 1 })) });
  const move = (index: number, dir: 'up' | 'down') => {
    if (dir === 'up' && index === 0) return; if (dir === 'down' && index === contract.appendices.length - 1) return;
    const arr = [...contract.appendices]; const ti = dir === 'up' ? index - 1 : index + 1;
    [arr[index], arr[ti]] = [arr[ti], arr[index]]; setContract({ ...contract, appendices: arr.map((a, i) => ({ ...a, order_index: i + 1 })) });
  };
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-bold text-slate-800">{t('\u0645\u0644\u0627\u062d\u0642 \u0627\u0644\u0639\u0642\u062f','Appendices',lang)}</h2>
        <button onClick={add} className="flex items-center space-x-2 space-x-reverse text-sm font-medium text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-lg"><Plus size={16} /><span>{t('\u0625\u0636\u0627\u0641\u0629 \u0645\u0644\u062d\u0642','Add Appendix',lang)}</span></button>
      </div>
      <div className="space-y-4">
        {contract.appendices.map((app: Appendix, index: number) => (
          <div key={app.id} className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="bg-slate-50 px-4 py-3 border-b border-slate-200 flex justify-between items-center">
              <div className="flex items-center space-x-3 space-x-reverse">
                <div className="flex flex-col space-y-1 ml-2"><button onClick={() => move(index,'up')} className="text-slate-400 hover:text-emerald-600"><ArrowUp size={14} /></button><button onClick={() => move(index,'down')} className="text-slate-400 hover:text-emerald-600"><ArrowDown size={14} /></button></div>
                <span className="text-sm font-bold text-slate-500 w-16">\u0645\u0644\u062d\u0642 {index + 1}</span>
                <input type="text" dir="rtl" value={app.title_ar} onChange={e => upd(app.id,'title_ar',e.target.value)} className="bg-transparent border-none focus:ring-0 font-bold text-slate-800 w-48 px-0 outline-none" />
                <select value={app.appendix_type} onChange={e => upd(app.id,'appendix_type',e.target.value)} className="text-xs bg-white border border-slate-200 rounded px-2 py-1 outline-none">
                  {['\u0642\u0627\u0626\u0645\u0629 \u0627\u0644\u062e\u062f\u0645\u0627\u062a','\u0627\u0644\u062a\u0647\u064a\u0626\u0629 \u0627\u0644\u062a\u0642\u0646\u064a\u0629','\u0627\u0644\u0639\u0631\u0636 \u0627\u0644\u0641\u0646\u064a','\u0642\u0627\u0626\u0645\u0629 \u0627\u0644\u0623\u0633\u0639\u0627\u0631','\u0623\u062e\u0631\u0649'].map(v => <option key={v} value={v}>{v}</option>)}
                </select>
              </div>
              <button onClick={() => del(app.id)} className="text-slate-400 hover:text-red-500 p-1.5"><Trash2 size={16} /></button>
            </div>
            <div className="p-4"><textarea dir="rtl" value={app.body_ar} onChange={e => upd(app.id,'body_ar',e.target.value)} className="w-full h-32 p-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none resize-y" placeholder="\u0645\u062d\u062a\u0648\u0649 \u0627\u0644\u0645\u0644\u062d\u0642..." /></div>
          </div>
        ))}
        {contract.appendices.length === 0 && <div className="text-center py-12 bg-white rounded-xl border border-dashed border-slate-300"><p className="text-slate-500">{t('\u0644\u0627 \u062a\u0648\u062c\u062f \u0645\u0644\u0627\u062d\u0642 \u0645\u0636\u0627\u0641\u0629','No appendices added',lang)}</p></div>}
      </div>
    </div>
  );
}

function AttachmentsEditor({ contract, setContract, lang }: any) {
  const [showForm, setShowForm] = React.useState(false);
  const [newTitle, setNewTitle] = React.useState('');
  const [newType, setNewType] = React.useState<'\u0627\u0644\u0639\u0631\u0636 \u0627\u0644\u0641\u0646\u064a' | '\u0627\u0644\u062a\u0635\u0627\u0645\u064a\u0645' | '\u0648\u062b\u064a\u0642\u0629 \u0627\u0644\u0646\u0637\u0627\u0642' | '\u0623\u062e\u0631\u0649'>('\u0623\u062e\u0631\u0649');
  const add = () => { if (!newTitle.trim()) return; setContract({ ...contract, attachments: [...contract.attachments, { id: Date.now().toString(), title: newTitle.trim(), file_type: 'PDF', attachment_type: newType, uploaded_at: new Date().toISOString().split('T')[0] } as Attachment] }); setNewTitle(''); setNewType('\u0623\u062e\u0631\u0649'); setShowForm(false); };
  const del = (id: string) => setContract({ ...contract, attachments: contract.attachments.filter((a: Attachment) => a.id !== id) });
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-bold text-slate-800">{t('\u0627\u0644\u0645\u0631\u0641\u0642\u0627\u062a','Attachments',lang)}</h2>
        <button onClick={() => setShowForm(!showForm)} className="flex items-center space-x-2 space-x-reverse text-sm font-medium text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-lg"><Plus size={16} /><span>{t('\u0625\u0636\u0627\u0641\u0629 \u0645\u0631\u0641\u0642','Add Attachment',lang)}</span></button>
      </div>
      {showForm && (
        <div className="bg-white rounded-xl shadow-sm border border-emerald-200 p-4 flex items-end gap-4">
          <div className="flex-1"><label className="text-sm font-medium text-slate-700">\u0627\u0633\u0645 \u0627\u0644\u0645\u0631\u0641\u0642</label><input type="text" dir="rtl" value={newTitle} onChange={e => setNewTitle(e.target.value)} className="w-full mt-1 px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none" /></div>
          <div className="w-48"><label className="text-sm font-medium text-slate-700">\u0646\u0648\u0639 \u0627\u0644\u0645\u0631\u0641\u0642</label><select value={newType} onChange={e => setNewType(e.target.value as any)} className="w-full mt-1 px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none">{['\u0627\u0644\u0639\u0631\u0636 \u0627\u0644\u0641\u0646\u064a','\u0627\u0644\u062a\u0635\u0627\u0645\u064a\u0645','\u0648\u062b\u064a\u0642\u0629 \u0627\u0644\u0646\u0637\u0627\u0642','\u0623\u062e\u0631\u0649'].map(v => <option key={v} value={v}>{v}</option>)}</select></div>
          <div className="flex gap-2"><button onClick={add} className="bg-emerald-600 text-white px-4 py-2 rounded-lg font-medium">\u0625\u0636\u0627\u0641\u0629</button><button onClick={() => setShowForm(false)} className="bg-slate-100 text-slate-700 px-4 py-2 rounded-lg font-medium">\u0625\u0644\u063a\u0627\u0621</button></div>
        </div>
      )}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <table className="w-full text-right text-sm">
          <thead className="bg-slate-50 text-slate-500 border-b border-slate-200"><tr><th className="px-6 py-3 font-medium">{t('\u0627\u0633\u0645 \u0627\u0644\u0645\u0631\u0641\u0642','Title',lang)}</th><th className="px-6 py-3 font-medium">{t('\u0627\u0644\u0646\u0648\u0639','Type',lang)}</th><th className="px-6 py-3 font-medium">{t('\u062a\u0627\u0631\u064a\u062e \u0627\u0644\u0631\u0641\u0639','Uploaded At',lang)}</th><th className="px-6 py-3 w-16"></th></tr></thead>
          <tbody className="divide-y divide-slate-100">
            {contract.attachments.map((a: Attachment) => (<tr key={a.id}><td className="px-6 py-4 font-medium text-slate-800">{a.title}</td><td className="px-6 py-4 text-slate-600">{a.attachment_type}</td><td className="px-6 py-4 text-slate-500">{a.uploaded_at}</td><td className="px-6 py-4 text-center"><button onClick={() => del(a.id)} className="text-slate-400 hover:text-red-500"><Trash2 size={16} /></button></td></tr>))}
            {contract.attachments.length === 0 && <tr><td colSpan={4} className="px-6 py-8 text-center text-slate-500">{t('\u0644\u0627 \u062a\u0648\u062c\u062f \u0645\u0631\u0641\u0642\u0627\u062a','No attachments',lang)}</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function VersionsEditor({ contract, setContract, lang }: any) {
  const restore = (v: ContractVersion) => {
    if (confirm('\u0647\u0644 \u0623\u0646\u062a \u0645\u062a\u0623\u0643\u062f \u0645\u0646 \u0627\u0633\u062a\u0639\u0627\u062f\u0629 \u0647\u0630\u0627 \u0627\u0644\u0625\u0635\u062f\u0627\u0631\u061f')) setContract({ ...v.snapshot, versions: contract.versions });
  };
  return (
    <div className="space-y-6">
      <h2 className="text-lg font-bold text-slate-800">{t('\u0633\u062c\u0644 \u0627\u0644\u0625\u0635\u062f\u0627\u0631\u0627\u062a','Version History',lang)}</h2>
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <table className="w-full text-right text-sm">
          <thead className="bg-slate-50 text-slate-500 border-b border-slate-200"><tr>
            <th className="px-6 py-3 font-medium">{t('\u0631\u0642\u0645 \u0627\u0644\u0625\u0635\u062f\u0627\u0631','Version',lang)}</th><th className="px-6 py-3 font-medium">{t('\u0627\u0644\u062a\u0627\u0631\u064a\u062e','Date',lang)}</th><th className="px-6 py-3 font-medium">{t('\u0645\u0644\u062e\u0635 \u0627\u0644\u062a\u063a\u064a\u064a\u0631','Summary',lang)}</th><th className="px-6 py-3 w-24"></th>
          </tr></thead>
          <tbody className="divide-y divide-slate-100">
            {contract.versions.map((v: ContractVersion) => (
              <tr key={v.version_number}>
                <td className="px-6 py-4 font-bold text-slate-800">v{v.version_number}.0</td>
                <td className="px-6 py-4 text-slate-500" dir="ltr">{new Date(v.created_at).toLocaleString('ar-SA')}</td>
                <td className="px-6 py-4 text-slate-700">{v.change_summary}</td>
                <td className="px-6 py-4 text-center"><button onClick={() => restore(v)} className="text-emerald-600 hover:text-emerald-700 font-medium">{t('\u0627\u0633\u062a\u0639\u0627\u062f\u0629','Restore',lang)}</button></td>
              </tr>
            ))}
            {contract.versions.length === 0 && <tr><td colSpan={4} className="px-6 py-8 text-center text-slate-500">{t('\u0633\u064a\u062a\u0645 \u0625\u0646\u0634\u0627\u0621 \u0627\u0644\u0625\u0635\u062f\u0627\u0631\u0627\u062a \u062a\u0644\u0642\u0627\u0626\u064a\u0627\u064b \u0639\u0646\u062f \u062d\u0641\u0638 \u0627\u0644\u0639\u0642\u062f','Versions are created automatically when saving',lang)}</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function ContractPreview({ contract, lang, projects, clients }: any) {
  const { getDefaultEntity, getEntityById } = useSettings();
  const entity = (contract.entity_id ? getEntityById(contract.entity_id) : null) || getDefaultEntity();
  const colors = { primary: entity.primary_color, secondary: entity.secondary_color, accent: entity.accent_color };
  const client = (clients || []).find((c: any) => c.id === contract.client_id);
  const project = projects?.find((p: any) => p.id === contract.project_id);
  const schedule = contract.payment_schedule;
  const visibleArticles = contract.articles.filter((a: Article) => a.is_visible).sort((a: Article, b: Article) => a.order_index - b.order_index);
  const [isExporting, setIsExporting] = React.useState(false);
  const [exportError, setExportError] = React.useState(false);
  const [driveStatus, setDriveStatus] = React.useState<'idle'|'uploading'|'success'|'error'>('idle');
  const [driveLink, setDriveLink] = React.useState<string|null>(null);
  React.useEffect(() => { initGoogleDrive(); }, []);
  const san = (n: string) => n.replace(/[\/\\?%*:|"<>]/g, '-').trim();
  const handleDrive = async () => {
    setDriveStatus('uploading'); setDriveLink(null);
    try {
      if (!isConnected()) await requestDriveAccess();
      const blob = await generatePdfBlob('contract-preview');
      const r = await uploadPdfToDrive(blob, san(`${contract.contract_number}-${contract.title_ar}.pdf`), entity.name_ar, client?.name_ar);
      setDriveLink(r.webViewLink); setDriveStatus('success');
    } catch(e) { console.error(e); setDriveStatus('error'); }
  };
  const handlePdf = async () => {
    setIsExporting(true);
    try { await exportContractToPdf('contract-preview', { filename: san(`${contract.contract_number}-${contract.title_ar}.pdf`), primaryColor: colors.primary }); }
    catch(e) { console.error(e); setExportError(true); setTimeout(() => setExportError(false), 4000); }
    finally { setIsExporting(false); }
  };
  const visibleCount = visibleArticles.length;
  const arNums: Record<number,string> = {1:'\u0628\u0646\u062f \u0648\u0627\u062d\u062f',2:'\u0628\u0646\u062f\u064a\u0646',3:'\u062b\u0644\u0627\u062b\u0629 \u0628\u0646\u0648\u062f',4:'\u0623\u0631\u0628\u0639\u0629 \u0628\u0646\u0648\u062f',5:'\u062e\u0645\u0633\u0629 \u0628\u0646\u0648\u062f',6:'\u0633\u062a\u0629 \u0628\u0646\u0648\u062f',7:'\u0633\u0628\u0639\u0629 \u0628\u0646\u0648\u062f',8:'\u062b\u0645\u0627\u0646\u064a\u0629 \u0628\u0646\u0648\u062f',9:'\u062a\u0633\u0639\u0629 \u0628\u0646\u0648\u062f',10:'\u0639\u0634\u0631\u0629 \u0628\u0646\u0648\u062f',11:'\u0623\u062d\u062f \u0639\u0634\u0631 \u0628\u0646\u062f\u0627\u064b',12:'\u0627\u062b\u0646\u064a \u0639\u0634\u0631 \u0628\u0646\u062f\u0627\u064b',13:'\u062b\u0644\u0627\u062b\u0629 \u0639\u0634\u0631 \u0628\u0646\u062f\u0627\u064b',14:'\u0623\u0631\u0628\u0639\u0629 \u0639\u0634\u0631 \u0628\u0646\u062f\u0627\u064b',15:'\u062e\u0645\u0633\u0629 \u0639\u0634\u0631 \u0628\u0646\u062f\u0627\u064b'};
  const countLabel = arNums[visibleCount] || `${visibleCount} \u0628\u0646\u0648\u062f`;

  return (
    <div>
      <div className="mb-4 flex justify-end gap-3 no-print sticky top-0 z-10 bg-slate-50 py-2">
        <button onClick={handleDrive} disabled={driveStatus==='uploading'} className="flex items-center space-x-2 space-x-reverse bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white px-6 py-2 rounded-lg font-medium">
          <Cloud size={18}/><span>{driveStatus==='uploading' ? t('\u062c\u0627\u0631\u064d \u0627\u0644\u0631\u0641\u0639...','Uploading...',lang) : t('\u062d\u0641\u0638 \u0641\u064a Drive','Save to Drive',lang)}</span>
        </button>
        <button onClick={handlePdf} disabled={isExporting} className="flex items-center space-x-2 space-x-reverse bg-red-600 hover:bg-red-700 disabled:opacity-60 text-white px-6 py-2 rounded-lg font-medium">
          <FileDown size={18}/><span>{isExporting ? t('\u062c\u0627\u0631\u064d \u0627\u0644\u062a\u0635\u062f\u064a\u0631...','Exporting...',lang) : t('\u062a\u0635\u062f\u064a\u0631 PDF','Export PDF',lang)}</span>
        </button>
        <button onClick={() => window.print()} className="flex items-center space-x-2 space-x-reverse bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-2 rounded-lg font-medium">
          <Printer size={18}/><span>{t('\u0637\u0628\u0627\u0639\u0629','Print',lang)}</span>
        </button>
      </div>
      {driveStatus==='success' && driveLink && (<div className="mb-4 flex items-center gap-2 text-sm text-blue-700 bg-blue-50 border border-blue-200 rounded-lg px-4 py-2 no-print"><CheckCircle size={16}/><span>{t('\u062a\u0645 \u0627\u0644\u062d\u0641\u0638 \u0641\u064a Google Drive','Saved to Drive',lang)}</span><a href={driveLink} target="_blank" rel="noopener noreferrer" className="mr-auto underline font-medium">{t('\u0641\u062a\u062d \u0627\u0644\u0645\u0644\u0641','Open file',lang)}</a></div>)}
      {driveStatus==='error' && (<div className="mb-4 flex items-center gap-2 text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-4 py-2 no-print"><AlertCircle size={16}/><span>{t('\u0641\u0634\u0644 \u0627\u0644\u0631\u0641\u0639','Upload failed',lang)}</span></div>)}
      {exportError && (<div className="mb-4 flex items-center gap-2 text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-4 py-2 no-print"><AlertCircle size={16}/><span>{t('\u0641\u0634\u0644 \u062a\u0635\u062f\u064a\u0631 PDF','PDF export failed',lang)}</span></div>)}
      <div id="contract-preview" className="bg-white shadow-xl border border-slate-200 p-12 max-w-4xl mx-auto text-slate-900 contract-pdf-ready" dir="rtl" style={{fontFamily:"'Tajawal', sans-serif"}}>
        <div className="flex justify-between items-start mb-8">
          <div>{entity.logo_base64 ? <img src={entity.logo_base64} alt="logo" className="h-20 max-w-[180px] object-contain" /> : <div className="h-20 w-[180px]" />}</div>
          <div className="text-left text-sm text-slate-500 leading-6"><p>{entity.name_ar}</p><p>\u0633.\u062a: {entity.cr_number}</p><p>{entity.city}</p></div>
        </div>
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold mb-6">\u0628\u0633\u0645 \u0627\u0644\u0644\u0647 \u0627\u0644\u0631\u062d\u0645\u0646 \u0627\u0644\u0631\u062d\u064a\u0645</h1>
          <h2 className="text-xl font-bold">{contract.title_ar}</h2>
          <p className="text-sm text-slate-500 mt-2">\u0631\u0642\u0645 \u0627\u0644\u0639\u0642\u062f: {contract.contract_number}</p>
          <p className="text-sm text-slate-500">\u0627\u0644\u0645\u064a\u0644\u0627\u062f\u064a: {contract.start_date} | \u0627\u0644\u0647\u062c\u0631\u064a: {toHijri(contract.start_date)}</p>
        </div>
        <div className="mb-10 leading-relaxed text-lg">
          <p className="mb-4">\u0625\u0646\u0647 \u0641\u064a \u064a\u0648\u0645 \u0627\u0644\u0645\u0648\u0627\u0641\u0642 {contract.start_date}\u060c \u062a\u0645 \u0627\u0644\u0627\u062a\u0641\u0627\u0642 \u0628\u064a\u0646 \u0643\u0644 \u0645\u0646:</p>
          <div className="mb-6 bg-slate-50 p-4 rounded border border-slate-100">
            <p className="font-bold mb-2" style={{color:colors.primary}}>\u0627\u0644\u0637\u0631\u0641 \u0627\u0644\u0623\u0648\u0644: {entity.name_ar}</p>
            <div className="grid grid-cols-2 gap-2 text-base">
              <p>\u0633\u062c\u0644 \u062a\u062c\u0627\u0631\u064a \u0631\u0642\u0645: {entity.cr_number}</p>
              <p>\u0648\u064a\u0645\u062b\u0644\u0647\u0627: {entity.representative_name} ({entity.representative_title})</p>
              <p>\u0627\u0644\u0639\u0646\u0648\u0627\u0646: {entity.city} \u2013 {entity.address}</p>
              <p>\u0627\u0644\u0628\u0631\u064a\u062f: {entity.email}</p>
            </div>
          </div>
          <div className="mb-6 bg-slate-50 p-4 rounded border border-slate-100">
            <p className="font-bold mb-3" style={{color:colors.primary}}>\u0627\u0644\u0637\u0631\u0641 \u0627\u0644\u062b\u0627\u0646\u064a: {client?.name_ar}</p>
            <div className="grid grid-cols-2 gap-2 text-base">
              <p>\u0627\u0644\u0633\u062c\u0644 \u0627\u0644\u062a\u062c\u0627\u0631\u064a: {client?.license_no||'\u2014'}</p>
              <p>\u0648\u064a\u0645\u062b\u0644\u0647\u0627: {client?.representative_name||'\u2014'} \u2014 {client?.representative_title||'\u2014'}</p>
              <p>\u0627\u0644\u0645\u062f\u064a\u0646\u0629: {client?.city||'\u2014'}</p>
              <p>\u0627\u0644\u0639\u0646\u0648\u0627\u0646: {client?.address||'\u2014'}</p>
              {client?.phone && <p>\u0627\u0644\u0647\u0627\u062a\u0641: <span dir="ltr">{client.phone}</span></p>}
              {client?.email && <p>\u0627\u0644\u0628\u0631\u064a\u062f: <span dir="ltr">{client.email}</span></p>}
            </div>
          </div>
        </div>
        <div className="space-y-8 text-lg">
          {visibleArticles.map((article: Article, idx: number) => {
            const repl = (s: string) => s.replace(/\b(\u0648\u0627\u062d\u062f|\u0627\u062b\u0646\u064a\u0646|\u062b\u0644\u0627\u062b\u0629|\u0623\u0631\u0628\u0639\u0629|\u062e\u0645\u0633\u0629|\u0633\u062a\u0629|\u0633\u0628\u0639\u0629|\u062b\u0645\u0627\u0646\u064a\u0629|\u062a\u0633\u0639\u0629|\u0639\u0634\u0631\u0629|\u0623\u062d\u062f \u0639\u0634\u0631|\u0627\u062b\u0646\u064a \u0639\u0634\u0631|\u062b\u0644\u0627\u062b\u0629 \u0639\u0634\u0631|\u0623\u0631\u0628\u0639\u0629 \u0639\u0634\u0631|\u062e\u0645\u0633\u0629 \u0639\u0634\u0631)\s+\u0628\u0646\u062f[\u0627\u064b]?/g, countLabel);
            const displayBody = article.article_type === '\u0646\u0633\u062e \u0627\u0644\u0627\u062a\u0641\u0627\u0642\u064a\u0629' ? repl(article.body_ar || '') : (article.body_ar || '(\u0646\u0635 \u0627\u0644\u0628\u0646\u062f \u0641\u0627\u0631\u063a)');
            return (
              <div key={article.id} className="article-block">
                <h3 className="text-xl font-bold mb-3" style={{color:colors.accent}}>\u0627\u0644\u0628\u0646\u062f {idx+1}: {article.title_ar}</h3>
                {article.blocks && article.blocks.length > 0 ? (
                  <div className="space-y-4">
                    {article.blocks.map((block: ArticleBlock) => {
                      if (block.type === 'paragraph') { const bt = article.article_type==='\u0646\u0633\u062e \u0627\u0644\u0627\u062a\u0641\u0627\u0642\u064a\u0629' ? repl(block.text_ar||'') : block.text_ar; return <p key={block.id} className="whitespace-pre-wrap leading-relaxed text-justify">{bt}</p>; }
                      if (block.type === 'list') { const LT = block.style==='ordered'||block.style==='alpha' ? 'ol' : 'ul'; const lc = block.style==='ordered'?'list-decimal':block.style==='alpha'?'list-[lower-alpha]':'list-disc'; return <LT key={block.id} className={`${lc} list-inside space-y-2 mr-4 leading-relaxed text-justify`}>{block.items.map(i=><li key={i.id}>{i.text_ar}</li>)}</LT>; }
                      if (block.type === 'page_break') return <div key={block.id} className="contract-page-break">\u0641\u0627\u0635\u0644 \u0635\u0641\u062d\u0629</div>;
                      return null;
                    })}
                  </div>
                ) : <div className="whitespace-pre-wrap leading-relaxed text-justify">{displayBody}</div>}
                {article.article_type === '\u0627\u0644\u0642\u064a\u0645\u0629 \u0648\u0627\u0644\u062f\u0641\u0639\u0627\u062a' && schedule.tasks.length > 0 && (
                  <div className="mt-6">
                    <table className="w-full border-collapse border border-slate-300 mb-6 text-base">
                      <thead style={{backgroundColor:colors.primary}}><tr><th className="border border-slate-300 px-4 py-2 text-right text-white font-medium">\u0627\u0644\u0645\u0647\u0645\u0629</th><th className="border border-slate-300 px-4 py-2 text-right text-white font-medium">\u0627\u0644\u0645\u062f\u0629</th><th className="border border-slate-300 px-4 py-2 text-right text-white font-medium">\u0627\u0644\u062a\u0643\u0644\u0641\u0629 (\u0631\u064a\u0627\u0644)</th></tr></thead>
                      <tbody>{schedule.tasks.map((task:TaskRow,i:number)=>(<tr key={task.id} style={{backgroundColor:i%2===0?colors.secondary:'#fff'}}><td className="border border-slate-300 px-4 py-2">{task.task_name_ar}</td><td className="border border-slate-300 px-4 py-2">{task.duration}</td><td className="border border-slate-300 px-4 py-2">{task.cost_sar.toLocaleString()}</td></tr>))}</tbody>
                      <tfoot style={{backgroundColor:'#f8fafc',fontWeight:'bold'}}>
                        <tr><td colSpan={2} className="border border-slate-300 px-4 py-2">\u0627\u0644\u0625\u062c\u0645\u0627\u0644\u064a \u063a\u064a\u0631 \u0634\u0627\u0645\u0644 \u0627\u0644\u0636\u0631\u064a\u0628\u0629</td><td className="border border-slate-300 px-4 py-2">{schedule.subtotal_sar.toLocaleString()}</td></tr>
                        <tr><td colSpan={2} className="border border-slate-300 px-4 py-2">\u0636\u0631\u064a\u0628\u0629 \u0627\u0644\u0642\u064a\u0645\u0629 \u0627\u0644\u0645\u0636\u0627\u0641\u0629 ({schedule.vat_rate}%)</td><td className="border border-slate-300 px-4 py-2">{schedule.vat_amount.toLocaleString()}</td></tr>
                        <tr style={{backgroundColor:colors.secondary}}><td colSpan={2} className="border border-slate-300 px-4 py-2" style={{color:colors.accent}}>\u0627\u0644\u0625\u062c\u0645\u0627\u0644\u064a \u0627\u0644\u0643\u0644\u064a</td><td className="border border-slate-300 px-4 py-2" style={{color:colors.accent}}>{schedule.total_sar.toLocaleString()}</td></tr>
                      </tfoot>
                    </table>
                    {schedule.installments.length > 0 && (<div className="mb-6"><p className="font-bold mb-2">\u0637\u0631\u064a\u0642\u0629 \u0627\u0644\u062f\u0641\u0639:</p><ul className="list-disc list-inside space-y-4 mr-4">{schedule.installments.map((inst:Installment)=>(<li key={inst.id}><span className="font-bold">{inst.label_ar}</span>: \u0646\u0633\u0628\u0629 {inst.percentage}% \u062a\u0633\u062a\u062d\u0642 \u0639\u0646\u062f {inst.trigger_event}.<div className="mt-1 text-slate-700">\u0627\u0644\u0645\u0628\u0644\u063a: {inst.amount_sar.toLocaleString()} \u0631\u064a\u0627\u0644 ({inst.amount_words_ar})</div></li>))}</ul></div>)}
                    <div className="p-4 border border-slate-200 rounded text-base" style={{backgroundColor:colors.secondary}}>
                      <p className="font-bold mb-2">\u0627\u0644\u0628\u064a\u0627\u0646\u0627\u062a \u0627\u0644\u0628\u0646\u0643\u064a\u0629:</p>
                      <p>\u0627\u0633\u0645 \u0627\u0644\u0628\u0646\u0643: {schedule.bank_name}</p><p>\u0627\u0633\u0645 \u0627\u0644\u062d\u0633\u0627\u0628: {schedule.account_holder}</p><p>\u0631\u0642\u0645 \u0627\u0644\u0622\u064a\u0628\u0627\u0646: <span dir="ltr">{schedule.bank_iban}</span></p>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
          <div className="mt-24 grid grid-cols-2 gap-12 text-center text-lg signature-block">
            <div><p className="font-bold mb-8">\u0627\u0644\u0637\u0631\u0641 \u0627\u0644\u0623\u0648\u0644</p><p>\u0627\u0644\u0627\u0633\u0645: {entity.representative_name}</p><p className="mt-4">\u0627\u0644\u062a\u0648\u0642\u064a\u0639: ___________________</p></div>
            <div><p className="font-bold mb-8">\u0627\u0644\u0637\u0631\u0641 \u0627\u0644\u062b\u0627\u0646\u064a</p><p>\u0627\u0644\u0627\u0633\u0645: {client?.representative_name}</p><p className="mt-4">\u0627\u0644\u062a\u0648\u0642\u064a\u0639: ___________________</p></div>
          </div>
          {contract.appendices.map((app:Appendix,idx:number)=>(<div key={app.id} className="contract-page-break" style={{pageBreakBefore:'always',marginTop:'48px',paddingTop:'32px',borderTop:'2px solid #1e293b'}}>{idx===0&&<h2 className="text-2xl font-bold mb-8 text-center">\u0627\u0644\u0645\u0644\u0627\u062d\u0642</h2>}<h3 className="text-xl font-bold mb-3" style={{color:colors.accent}}>\u0627\u0644\u0645\u0644\u062d\u0642 {idx+1}: {app.title_ar}</h3><div className="whitespace-pre-wrap leading-relaxed text-justify">{app.body_ar||'(\u0646\u0635 \u0627\u0644\u0645\u0644\u062d\u0642 \u0641\u0627\u0631\u063a)'}</div></div>))}
          {contract.attachments.length>0&&(<div className="contract-page-break" style={{pageBreakBefore:'always',marginTop:'48px',paddingTop:'32px',borderTop:'2px solid #1e293b'}}><h2 className="text-2xl font-bold mb-8 text-center">\u0627\u0644\u0645\u0631\u0641\u0642\u0627\u062a</h2><table className="w-full border-collapse border border-slate-300 text-base"><thead style={{backgroundColor:colors.primary}}><tr><th className="border border-slate-300 px-4 py-2 text-right text-white font-medium">\u0627\u0633\u0645 \u0627\u0644\u0645\u0631\u0641\u0642</th><th className="border border-slate-300 px-4 py-2 text-right text-white font-medium">\u0627\u0644\u0646\u0648\u0639</th><th className="border border-slate-300 px-4 py-2 text-right text-white font-medium">\u0627\u0644\u062a\u0627\u0631\u064a\u062e</th></tr></thead><tbody>{contract.attachments.map((att:Attachment,i:number)=>(<tr key={att.id} style={{backgroundColor:i%2===0?colors.secondary:'#fff'}}><td className="border border-slate-300 px-4 py-2">{att.title}</td><td className="border border-slate-300 px-4 py-2">{att.attachment_type}</td><td className="border border-slate-300 px-4 py-2">{att.uploaded_at}</td></tr>))}</tbody></table></div>)}
        </div>
      </div>
    </div>
  );
}
