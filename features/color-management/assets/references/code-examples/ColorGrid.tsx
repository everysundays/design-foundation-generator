import React from 'react';
import { Color } from '@/types/color';
import { ColorCard } from './ColorCard';

interface ColorGridProps {
  title: string;
  colors: Color[];
  onDuplicate?: (color: Color) => void;
  onDelete?: (color: Color) => void;
}

export const ColorGrid: React.FC<ColorGridProps> = ({
  title,
  colors,
  onDuplicate,
  onDelete
}) => {
  return (
    <div className="color-grid">
      <h2>{title}</h2>
      <div className="grid">
        {colors.map((color) => (
          <ColorCard
            key={color.name}
            color={color}
            onDuplicate={onDuplicate ? () => onDuplicate(color) : undefined}
            onDelete={onDelete ? () => onDelete(color) : undefined}
          />
        ))}
      </div>
    </div>
  );
}; 