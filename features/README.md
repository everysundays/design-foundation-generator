# Design Foundation Generator

โปรเจคนี้เป็นเครื่องมือสำหรับสร้างและจัดการ Color Palette ตามมาตรฐาน Atlassian Design System (ADS)

## โครงสร้างโปรเจค

```
.ai-memory/
├── README.md                    # เอกสารหลักของโปรเจค
├── manifesto.md                # แนวทางการทำงานร่วมกัน
├── sprint-progress.md          # สถานะปัจจุบันและอัปเดตรายวัน
├── features/                   # รายละเอียดฟีเจอร์
│   ├── color-wheel/           # Color wheel controller
│   └── color-scales/          # Color scales management
├── technical/                  # เอกสารทางเทคนิค
├── decisions/                  # การตัดสินใจสำคัญ
└── references/                # เอกสารอ้างอิง
```

## ฟีเจอร์หลัก

1. **Color Palette Display**
   - แสดงค่าสีตามมาตรฐาน ADS
   - รองรับทั้งสีปกติและ alpha
   - แสดงค่า WCAG compliance

2. **Color Management**
   - ปรับแต่งค่าสีด้วย Color Wheel
   - ควบคุม Hue, Saturation, Lightness
   - Preview การเปลี่ยนแปลง

## การพัฒนา

โปรเจคนี้ใช้แนวทางการพัฒนาแบบ feature-driven โดยแต่ละฟีเจอร์จะมีเอกสารครบถ้วนก่อนเริ่มพัฒนา ดูรายละเอียดเพิ่มเติมได้ที่ [manifesto.md](manifesto.md)

## อ้างอิง

- [Atlassian Design System](https://atlassian.design/)
- [Color Palette Standards](references/ads-standards.md) 