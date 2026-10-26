import React from 'react';
import { DetailPanel } from './workspace/DetailPanel.tsx';
import { EmailResult } from '../types.ts';

interface DetailModalProps {
  result: EmailResult | null;
  onClose: () => void;
  onApplyTypoFix?: (oldEmail: string, correctedEmail: string) => void;
}

export const DetailModal: React.FC<DetailModalProps> = ({ result, onClose, onApplyTypoFix }) => {
  return <DetailPanel result={result} onClose={onClose} onApplyTypoFix={onApplyTypoFix} />;
};

export default DetailModal;
