'use client';

import { useMemo } from 'react';
import {
  ResponsiveContainer,
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
} from 'recharts';
import { useScentDNAStore } from '@/store/scent-dna.store';

const CATEGORY_MAPPING: Record<string, string[]> = {
  'Floral': ['rose', 'jasmine', 'lavender', 'floral', 'iris', 'lily', 'peony', 'orchid', 'violet', 'magnolia', 'tuberose', 'gardenia', 'neroli', 'ylang', 'hoa'],
  'Woody': ['sandalwood', 'cedar', 'vetiver', 'patchouli', 'pine', 'oakmoss', 'oud', 'woody', 'gỗ'],
  'Citrus': ['bergamot', 'lemon', 'orange', 'grapefruit', 'mandarin', 'lime', 'citrus', 'chanh', 'cam'],
  'Spicy': ['cinnamon', 'clove', 'pepper', 'cardamom', 'ginger', 'nutmeg', 'saffron', 'spicy', 'gia vị', 'tiêu'],
  'Fresh/Green': ['aquatic', 'marine', 'mint', 'green', 'herbal', 'ozonic', 'tươi', 'xanh', 'biển', 'bạc hà'],
  'Sweet': ['vanilla', 'caramel', 'honey', 'chocolate', 'coffee', 'tonka', 'sweet', 'ngọt', 'vani'],
  'Amber/Musk': ['amber', 'musk', 'incense', 'resin', 'benzoin', 'myrrh', 'hổ phách', 'xạ hương', 'trầm'],
};

export function ScentDNARadar() {
  const { preferences } = useScentDNAStore();

  const data = useMemo(() => {
    if (!preferences || preferences.preferredNotes.length === 0) return [];

    const stats: Record<string, number> = {};
    Object.keys(CATEGORY_MAPPING).forEach(cat => stats[cat] = 0);

    preferences.preferredNotes.forEach(note => {
      const lowerNote = note.toLowerCase();
      Object.entries(CATEGORY_MAPPING).forEach(([cat, keywords]) => {
        if (keywords.some(kw => lowerNote.includes(kw))) {
          stats[cat] += 1;
        }
      });
    });

    return Object.entries(stats).map(([subject, value]) => ({
      subject,
      A: value + 1, // Add 1 as base to make it visible
      fullMark: Math.max(...Object.values(stats)) + 2,
    }));
  }, [preferences]);

  if (data.length === 0) return null;

  return (
    <div className="h-[300px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <RadarChart cx="50%" cy="50%" outerRadius="70%" data={data}>
          <PolarGrid stroke="#b6894820" />
          <PolarAngleAxis 
            dataKey="subject" 
            tick={{ fill: '#b68948', fontSize: 10, fontWeight: 'bold' }}
          />
          <Radar
            name="Scent DNA"
            dataKey="A"
            stroke="#d6b36d"
            fill="#d6b36d"
            fillOpacity={0.3}
          />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
}
