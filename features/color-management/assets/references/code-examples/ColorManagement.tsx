import React, { useState } from 'react';
import { Color } from '@/types/color';
import { duplicateColor } from '@/utils/color';
import { ColorGrid } from './ColorGrid';

interface ColorManagementProps {
  baseColors: Color[];
  neutralColors: Color[];
  darkNeutralColors: Color[];
}

export const ColorManagement: React.FC<ColorManagementProps> = ({
  baseColors,
  neutralColors,
  darkNeutralColors
}) => {
  const [customColors, setCustomColors] = useState<Color[]>([]);

  const handleDuplicate = (color: Color) => {
    const newName = `${color.name} Copy`;
    const newColor = duplicateColor(color, newName);
    setCustomColors(prev => [...prev, newColor]);
  };

  const handleDelete = (color: Color) => {
    setCustomColors(prev => prev.filter(c => c.name !== color.name));
  };

  return (
    <div className="color-management">
      <div className="color-sections">
        <ColorGrid
          title="Base Colors"
          colors={baseColors}
          onDuplicate={handleDuplicate}
        />
        <ColorGrid
          title="Neutral Colors"
          colors={neutralColors}
          onDuplicate={handleDuplicate}
        />
        <ColorGrid
          title="Dark Neutral Colors"
          colors={darkNeutralColors}
          onDuplicate={handleDuplicate}
        />
        {customColors.length > 0 && (
          <ColorGrid
            title="Custom Colors"
            colors={customColors}
            onDelete={handleDelete}
          />
        )}
      </div>
    </div>
  );
}; 