# Color Scales Requirements

## ภาพรวม
ระบบจัดการและแสดงผล Color Scale ตามมาตรฐาน ADS โดยใช้ระบบสี HSL เพื่อความแม่นยำในการควบคุมและแสดงผล

## User Stories
- ในฐานะนักออกแบบ ฉันต้องการเห็น color scale ที่ตรงตาม ADS เพื่อให้แน่ใจว่าสีที่ใช้ถูกต้อง
- ในฐานะนักพัฒนา ฉันต้องการระบบสีที่แม่นยำและคงที่ เพื่อให้การพัฒนาเป็นไปตามมาตรฐาน
- ในฐานะผู้ใช้ ฉันต้องการเห็นค่า WCAG compliance เพื่อให้แน่ใจว่าสีที่เลือกสามารถใช้งานได้จริง

## ความต้องการด้านฟังก์ชัน

1. การแสดงผล Color Scale
   - แสดง scale ตั้งแต่ -100 ถึง 1000 สำหรับทุกสี
   - แสดง scale พิเศษ (-100, 0) สำหรับ dark neutral
   - จัดเรียง scale ตามลำดับจากน้อยไปมาก
   - แสดงระยะห่างระหว่าง scale ที่สม่ำเสมอ

2. ระบบสี HSL
   - แปลงค่าสีทั้งหมดจาก HEX เป็น HSL
   - รักษาความแม่นยำของสีในการแปลง
   - กำหนดค่า HSL มาตรฐานสำหรับแต่ละสี:
     ```typescript
     interface HSLRange {
       hue: { min: number; max: number };
       saturation: { min: number; max: number };
       lightness: { min: number; max: number };
     }
     ```

3. การจัดการสี Neutral
   - Neutral: ใช้ค่า saturation = 0
   - Dark Neutral: ใช้ค่า saturation = 0 และปรับ lightness
   - รองรับ alpha version สำหรับทั้งสองประเภท

4. WCAG Compliance
   - แสดงสัญลักษณ์ AA สำหรับสีที่ผ่านมาตรฐาน
   - คำนวณ contrast ratio กับพื้นหลังสีขาวและดำ
   - ไม่แสดง compliance สำหรับสีที่มี alpha

## ข้อจำกัดทางเทคนิค
1. การแปลงสี
   - ต้องรักษาความแม่นยำในการแปลง HEX ↔ HSL
   - ต้องจัดการทศนิยมอย่างเหมาะสม
   - ต้องรองรับการแปลงค่า alpha

2. ค่าสีมาตรฐาน
   - ต้องตรงกับ ADS color palette ทุกค่า
   - ต้องรักษาความสัมพันธ์ระหว่าง scale
   - ต้องรองรับการอัปเดตจาก ADS ในอนาคต

## Dependencies
- Color Wheel Controller Feature
- ADS Color Standards

## เกณฑ์ความสำเร็จ
- [ ] ทุกสีตรงกับ ADS color palette reference
- [ ] การแสดงผล scale ถูกต้องและสม่ำเสมอ
- [ ] WCAG compliance แสดงผลถูกต้อง
- [ ] ระบบ HSL ทำงานได้แม่นยำ
- [ ] สี neutral และ dark neutral แสดงผลถูกต้อง

## ตารางเปรียบเทียบสี
| Color Type | Scale | HSL Values | Alpha Version |
|------------|-------|------------|---------------|
| Neutral    | 0     | H:0 S:0 L:100 | Yes |
| Neutral    | 1000  | H:0 S:0 L:0   | Yes |
| Dark Neutral| -100  | H:0 S:0 L:0   | Yes |
| Dark Neutral| 0     | H:0 S:0 L:15  | Yes |
| Base Colors| 100   | ตาม HUE_RANGES | Yes |
| Base Colors| 1000  | ตาม HUE_RANGES | Yes |

## การทดสอบ
1. Visual Testing
   - เปรียบเทียบกับ ADS reference
   - ตรวจสอบความสม่ำเสมอของ scale
   - ตรวจสอบการแสดงผล alpha

2. Technical Testing
   - ทดสอบการแปลงสี HEX ↔ HSL
   - ทดสอบการคำนวณ WCAG compliance
   - ทดสอบการจัดการค่า alpha 