import { HSBColor } from '../types/color';

/**
 * แปลงสีจาก HSB เป็น Hex
 */
export function hsbToHex({ hue, saturation, brightness }: HSBColor): string {
  const s = saturation / 100;
  const b = brightness / 100;
  const k = (n: number) => (n + hue / 60) % 6;
  const f = (n: number) => b * (1 - s * Math.max(0, Math.min(k(n), 4 - k(n), 1)));
  
  const r = Math.round(255 * f(5));
  const g = Math.round(255 * f(3));
  const bl = Math.round(255 * f(1));
  
  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${bl.toString(16).padStart(2, '0')}`;
}

/**
 * คำนวณสีตัวอักษรที่เหมาะสม (ขาว/ดำ) สำหรับพื้นหลังที่กำหนด
 */
export function getContrastColor(hexColor: string): string {
  const hex = hexColor.replace('#', '');
  const r = parseInt(hex.substr(0, 2), 16);
  const g = parseInt(hex.substr(2, 2), 16);
  const b = parseInt(hex.substr(4, 2), 16);
  
  // คำนวณ luminance ตามการรับรู้ของมนุษย์
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  
  return luminance > 0.5 ? '#000000' : '#ffffff';
} 