import { HSBColor, ScaleLevel } from '../types/color';

// ค่าคงที่สำหรับการคำนวณ
const BASE_LEVEL = 500;
const LOG_BASE = Math.E; // ใช้ natural logarithm
const BRIGHTNESS_RANGE = {
  MIN: 15,  // ค่าต่ำสุดสำหรับระดับ 1000
  MAX: 95,  // ค่าสูงสุดสำหรับระดับ 100
  BASE: 65, // ค่ากลางสำหรับระดับ 500
};

const SATURATION_ADJUSTMENT = {
  MIN_FACTOR: 0.7,  // ลดความอิ่มตัวลงต่ำสุด 70% ที่ระดับสว่างมากหรือมืดมาก
  MAX_FACTOR: 1,    // คงความอิ่มตัวไว้ 100% ที่ระดับกลาง
};

/**
 * คำนวณ brightness ตามระดับโดยใช้ logarithmic scale
 */
export function calculateBrightness(level: ScaleLevel): number {
  // คำนวณระยะห่างจากระดับกลาง (500)
  const levelDiff = level - BASE_LEVEL;
  
  // ใช้ logarithmic scale เพื่อให้การเปลี่ยนแปลงเป็นธรรมชาติ
  const normalizedDiff = Math.log(Math.abs(levelDiff) + 1) / Math.log(500);
  const direction = levelDiff > 0 ? -1 : 1; // ระดับสูงขึ้น = มืดลง
  
  // คำนวณ brightness โดยเริ่มจากค่ากลาง
  const brightnessChange = normalizedDiff * (BRIGHTNESS_RANGE.MAX - BRIGHTNESS_RANGE.MIN) / 2;
  const brightness = BRIGHTNESS_RANGE.BASE + (direction * brightnessChange);
  
  // จำกัดค่าให้อยู่ในช่วงที่กำหนด
  return Math.max(BRIGHTNESS_RANGE.MIN, Math.min(BRIGHTNESS_RANGE.MAX, brightness));
}

/**
 * ปรับ saturation ตาม brightness เพื่อให้ดูเป็นธรรมชาติ
 */
export function adjustSaturation(brightness: number, baseSaturation: number): number {
  // คำนวณระยะห่างจากความสว่างระดับกลาง (50%)
  const brightnessDiff = Math.abs(brightness - 50) / 50;
  
  // ลด saturation ลงเมื่อ brightness สูงหรือต่ำมาก
  const adjustmentFactor = SATURATION_ADJUSTMENT.MAX_FACTOR -
    (brightnessDiff * (SATURATION_ADJUSTMENT.MAX_FACTOR - SATURATION_ADJUSTMENT.MIN_FACTOR));
  
  return baseSaturation * adjustmentFactor;
}

/**
 * สร้าง color scale ทั้งหมด
 */
export function generateColorScale(baseColor: HSBColor): Record<ScaleLevel, HSBColor> {
  const levels: ScaleLevel[] = [100, 200, 300, 400, 500, 600, 700, 800, 900, 1000];
  
  return levels.reduce((scale, level) => {
    const brightness = calculateBrightness(level);
    const saturation = adjustSaturation(brightness, baseColor.saturation);
    
    scale[level] = {
      hue: baseColor.hue,
      saturation,
      brightness,
    };
    
    return scale;
  }, {} as Record<ScaleLevel, HSBColor>);
}

/**
 * สร้าง neutral scale (ลดทั้ง saturation และ brightness)
 */
export function generateNeutralScale(baseColor: HSBColor): Record<ScaleLevel, HSBColor> {
  const levels: ScaleLevel[] = [100, 200, 300, 400, 500, 600, 700, 800, 900, 1000];
  
  return levels.reduce((scale, level) => {
    const brightness = calculateBrightness(level);
    // ใช้ saturation ต่ำลงสำหรับ neutral colors
    const baseSaturation = baseColor.saturation * 0.15; // ลดลงเหลือ 15%
    const saturation = adjustSaturation(brightness, baseSaturation);
    
    scale[level] = {
      hue: baseColor.hue,
      saturation,
      brightness,
    };
    
    return scale;
  }, {} as Record<ScaleLevel, HSBColor>);
} 