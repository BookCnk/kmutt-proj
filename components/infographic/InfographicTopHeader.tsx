'use client';

import type { CSSProperties } from 'react';
import Image from 'next/image';

interface InfographicTopHeaderProps {
    className?: string;
    style?: CSSProperties;
    leftTitleLine1?: string;
    leftTitleLine2?: string;
    bannerText?: string;
}

const DEFAULT_LEFT_TITLE_LINE_1 = 'เกณฑ์การรับสมัครนักศึกษา';
const DEFAULT_LEFT_TITLE_LINE_2 = 'รอบที่ 2 (ปีการศึกษา 2569)';
const DEFAULT_BANNER_TEXT = 'โครงการคัดเลือกตรงโดยใช้คะแนน TGAT/TPAT';

export function InfographicTopHeader({
    className,
    style,
    leftTitleLine1 = DEFAULT_LEFT_TITLE_LINE_1,
    leftTitleLine2 = DEFAULT_LEFT_TITLE_LINE_2,
    bannerText = DEFAULT_BANNER_TEXT,
}: InfographicTopHeaderProps) {
    return (
        <div
            className={`flex items-stretch rounded-sm overflow-hidden ${className ?? ''}`}
            style={{
                minHeight: 70,
                border: '1.5px solid #fa4616',
                ...style,
            }}
        >
            <div className="flex items-center gap-4 px-4 py-2 bg-white" style={{ flex: '0 0 45%' }}>
                <div className="flex items-center pr-3 border-r border-slate-200">
                    <Image src="/ICON.png" alt="KMUTT 65" width={80} height={52} className="object-contain" priority />
                </div>
                <div className="text-slate-800 flex flex-col justify-center">
                    <div className="font-bold leading-tight" style={{ fontSize: 18 }}>
                        {leftTitleLine1}
                    </div>
                    <div className="font-bold leading-tight" style={{ fontSize: 18 }}>
                        {leftTitleLine2}
                    </div>
                </div>
            </div>

            <div
                className="flex-1 flex items-center justify-center text-white font-bold px-6"
                style={{
                    backgroundColor: '#fa4616',
                    borderLeft: '1.5px solid #fa4616',
                    fontSize: 18,
                }}
            >
                {bannerText}
            </div>
        </div>
    );
}
