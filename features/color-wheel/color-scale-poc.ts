type ColorHSB = {
  hue: number;        // 0-360
  saturation: number; // 0-100
  brightness: number; // 0-100
};

type ScaleLevel = 100 | 200 | 300 | 400 | 500 | 600 | 700 | 800 | 900 | 1000;

/**
 * คำนวณค่า brightness แบบ linear
 * ใช้ color 700 เป็น base และคำนวณค่าอื่นๆ โดยใช้สัดส่วนเชิงเส้น
 */
function calculateLinearBrightness(baseColor: ColorHSB, targetLevel: ScaleLevel): number {
  const BASE_LEVEL = 700;
  const MAX_BRIGHTNESS = 100;
  
  // คำนวณระยะห่างจาก base level
  const levelDiff = targetLevel - BASE_LEVEL;
  
  // กำหนดอัตราการเปลี่ยนแปลง brightness ต่อระดับ
  const BRIGHTNESS_STEP = 5; // 5% ต่อระดับ
  
  // คำนวณค่า brightness ใหม่
  const newBrightness = baseColor.brightness + (levelDiff / 100) * BRIGHTNESS_STEP;
  
  // จำกัดค่าให้อยู่ในช่วง 0-100
  return Math.max(0, Math.min(MAX_BRIGHTNESS, newBrightness));
}

/**
 * คำนวณค่า brightness แบบ exponential
 * ใช้ฟังก์ชัน exponential เพื่อให้การเปลี่ยนแปลงเป็นแบบไม่เชิงเส้น
 */
function calculateExponentialBrightness(baseColor: ColorHSB, targetLevel: ScaleLevel): number {
  const BASE_LEVEL = 700;
  const MAX_BRIGHTNESS = 100;
  
  // คำนวณระยะห่างจาก base level เป็นค่าระหว่าง -1 ถึง 1
  const normalizedDiff = (targetLevel - BASE_LEVEL) / 400; // 400 คือระยะห่างสูงสุดจาก 700 (300 ถึง 1100)
  
  // ใช้ฟังก์ชัน exponential สำหรับการเปลี่ยนแปลงแบบไม่เชิงเส้น
  const exponentialFactor = Math.exp(normalizedDiff) - 1;
  
  // คำนวณค่า brightness ใหม่
  const brightnessChange = exponentialFactor * 20; // 20% เป็นค่าสูงสุดที่จะเปลี่ยนแปลง
  const newBrightness = baseColor.brightness + brightnessChange;
  
  // จำกัดค่าให้อยู่ในช่วง 0-100
  return Math.max(0, Math.min(MAX_BRIGHTNESS, newBrightness));
}

/**
 * คำนวณค่า saturation ตาม scale
 * ทดลองปรับ saturation ตามระดับของสี
 */
function calculateSaturation(baseColor: ColorHSB, targetLevel: ScaleLevel): number {
  const BASE_LEVEL = 700;
  const MAX_SATURATION = 100;
  
  // คำนวณระยะห่างจาก base level
  const levelDiff = targetLevel - BASE_LEVEL;
  
  // ทดลองปรับ saturation:
  // - เพิ่มขึ้นเล็กน้อยสำหรับสีเข้ม (800-1000)
  // - ลดลงเล็กน้อยสำหรับสีอ่อน (100-600)
  const SATURATION_STEP = 2; // 2% ต่อระดับ
  
  const newSaturation = baseColor.saturation + (levelDiff / 100) * SATURATION_STEP;
  
  // จำกัดค่าให้อยู่ในช่วง 0-100
  return Math.max(0, Math.min(MAX_SATURATION, newSaturation));
}

/**
 * สร้าง color scale ทั้งชุดจาก base color
 */
function generateColorScale(baseColor: ColorHSB): Record<ScaleLevel, ColorHSB> {
  const levels: ScaleLevel[] = [100, 200, 300, 400, 500, 600, 700, 800, 900, 1000];
  
  return levels.reduce((scale, level) => {
    scale[level] = {
      hue: baseColor.hue,
      saturation: calculateSaturation(baseColor, level),
      brightness: calculateLinearBrightness(baseColor, level)
      // สามารถสลับเป็น calculateExponentialBrightness เพื่อทดสอบ
    };
    return scale;
  }, {} as Record<ScaleLevel, ColorHSB>);
}

// ตัวอย่างการใช้งาน
const baseBlue: ColorHSB = {
  hue: 220,
  saturation: 70,
  brightness: 60
};

console.log('Linear Scale:');
const linearScale = generateColorScale(baseBlue);
console.log(JSON.stringify(linearScale, null, 2));

// เปลี่ยนฟังก์ชันใน generateColorScale เป็น calculateExponentialBrightness
console.log('\nExponential Scale:');
// ... ทดสอบแบบ exponential 