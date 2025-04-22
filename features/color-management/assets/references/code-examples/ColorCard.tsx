import React from 'react';
import { Color } from '@/types/color';
import { generateColorVariants } from '@/utils/color';

interface ColorCardProps {
  color: Color;
  onDuplicate?: () => void;
  onDelete?: () => void;
}

export const ColorCard: React.FC<ColorCardProps> = ({
  color,
  onDuplicate,
  onDelete
}) => {
  const { name, hex, type } = color;
  const variants = generateColorVariants(color);

  return (
    <div className="color-card">
      <div 
        className="color-preview"
        style={{ backgroundColor: hex }}
      />
      <div className="color-info">
        <div className="color-name">{name}</div>
        <div className="color-hex">{hex}</div>
        <div className="color-variants">
          {variants.map(({ hex }) => (
            <div 
              key={hex}
              className="variant-swatch"
              style={{ backgroundColor: hex }}
            />
          ))}
        </div>
      </div>
      <div className="color-actions">
        {type === 'base' && onDuplicate && (
          <button
            onClick={onDuplicate}
            className="action-button"
            title="Duplicate color"
          >
            +
          </button>
        )}
        {type === 'custom' && onDelete && (
          <button
            onClick={onDelete}
            className="action-button delete"
            title="Delete color"
          >
            ×
          </button>
        )}
      </div>
    </div>
  );
}; 