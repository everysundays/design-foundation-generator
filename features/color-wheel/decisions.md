# Color Wheel Feature - Design Decisions

This document tracks key decisions made during the development of the color wheel feature.

## Decision Records

### [2025-04-18] Switch to HSB Color System
**Context:**
- เดิมใช้ HSL ในการควบคุมสี แต่พบปัญหาในการปรับแต่งด้วย slider
- ต้องการระบบที่ทำให้การควบคุมสีจาก base color (700) ไปยังระดับอื่นๆ ทำได้ง่าย
- ต้องการความแม่นยำในการคำนวณสีตรงข้าม (opposite color)

**Decision:**
- เปลี่ยนจาก HSL เป็น HSB color system
- ใช้ color 700 เป็น base color สำหรับการสร้าง scale
- แยก Brightness control ออกจาก Hue/Saturation control

**Consequences:**
- ข้อดี:
  - การควบคุม Brightness จาก base color ทำได้แม่นยำกว่า
  - การคำนวณสีตรงข้ามทำได้ง่ายขึ้น
  - Saturation และ Brightness แยกจากกันชัดเจน
- ข้อควรระวัง:
  - ต้องทำ POC เพื่อเปรียบเทียบวิธีการคำนวณ scale แบบ linear vs exponential
  - ต้องทดสอบการเปลี่ยนแปลงของ Saturation ในแต่ละ scale

## Template for New Decisions 