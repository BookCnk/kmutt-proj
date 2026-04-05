"use client";

// ─── PageFooter ───────────────────────────────────────────────────────────────
// Layout matches the KMUTT R2 TGAT-TPAT-69.pdf footer:
//
//  ┌─────────────────────────────────────────────────────────────────┐
//  │  [logo]  สำนักงานคัดเลือกฯ มจธ.     ข้อมูลอาจมีการเปลี่ยนแปลง  │
//  │                                      ข้อมูล ณ วันที่ ...        │
//  │                    1 | P a g e                                  │
//  └─────────────────────────────────────────────────────────────────┘

const ORANGE = "#fa4616";

function thaiDateStr(): string {
  const today = new Date();
  const thaiMonths = [
    "มกราคม", "กุมภาพันธ์", "มีนาคม", "เมษายน", "พฤษภาคม", "มิถุนายน",
    "กรกฎาคม", "สิงหาคม", "กันยายน", "ตุลาคม", "พฤศจิกายน", "ธันวาคม",
  ];
  return `ข้อมูล ณ วันที่ ${today.getDate()} ${thaiMonths[today.getMonth()]} ${today.getFullYear() + 543}`;
}

interface PageFooterProps {
  pageNumber: number;
  /** Logo shown in the left section of the footer (separate from header logo) */
  footerLogoUrl?: string;
  officeName?: string;
  warningText?: string;
  fontSize?: number;
}

export function PageFooter({
  pageNumber,
  footerLogoUrl = "/ICON.png",
  officeName = "สำนักงานคัดเลือกและสรรหานักศึกษา มจธ.",
  warningText = "ข้อมูลอาจมีการเปลี่ยนแปลงตามความเหมาะสม",
  fontSize = 16,
}: PageFooterProps) {
  const dateStr = thaiDateStr();

  return (
    <div
      style={{
        height: 88,           // fixed — same on every page
        flexShrink: 0,        // never compressed by flex parent
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        fontSize,
        fontFamily: "THSarabun, sans-serif",
      }}
    >
      {/* Row 1 — Left: logo + office name │ Right: orange warning + date */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flex: 1,
        }}
      >
        {/* LEFT */}
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={footerLogoUrl}
            alt="footer logo"
            style={{ width: 40, height: 28, objectFit: "contain", flexShrink: 0 }}
          />
          <span style={{ color: "#374151" }}>{officeName}</span>
        </div>

        {/* RIGHT */}
        <div style={{ textAlign: "right", lineHeight: 1.35 }}>
          <div style={{ color: ORANGE, fontWeight: 700 }}>{warningText}</div>
          <div style={{ color: ORANGE, fontWeight: 700 }}>{dateStr}</div>
        </div>
      </div>

      {/* Divider line — between content row and page number */}
      <div style={{ borderTop: "1px solid #d1d5db", marginBottom: 3 }} />

      {/* Row 2 — Centered page number */}
      <div
        style={{
          textAlign: "center",
          color: "#374151",
          fontWeight: 700,
          lineHeight: 1,
        }}
      >
        {pageNumber}&nbsp;|&nbsp;P&nbsp;a&nbsp;g&nbsp;e
      </div>
    </div>
  );
}
