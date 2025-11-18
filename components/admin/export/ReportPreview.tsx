'use client';

import { Major } from '@/lib/types/report.types';

interface ReportPreviewProps {
  structuredData: Major[];
}

export default function ReportPreview({ structuredData }: ReportPreviewProps) {
  if (!structuredData || structuredData.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        No data available for preview.
      </div>
    );
  }

  return (
    <div id="report-preview" className="space-y-8">
      {/* Report Header */}
      <div className="text-center border-b-2 border-gray-800 pb-4">
        <h1 className="text-2xl font-bold mb-2">
          เกณฑ์การรับสมัครนักศึกษา
        </h1>
        <h2 className="text-xl font-semibold">
          รอบที่ 2 (ปีการศึกษา 2569)
        </h2>
        <p className="text-sm text-gray-600 mt-2">
          โครงการคัดเลือกตรงโดยใช้คะแนน TGAT/TPAT
        </p>
      </div>

      {/* Group by Faculty */}
      {(() => {
        const facultyGroups = structuredData.reduce((acc, major) => {
          const faculty = major.faculty || 'อื่นๆ';
          if (!acc[faculty]) {
            acc[faculty] = [];
          }
          acc[faculty].push(major);
          return acc;
        }, {} as Record<string, Major[]>);

        return Object.entries(facultyGroups).map(([faculty, majors]) => (
          <div key={faculty} className="report-major-section">
            {/* Faculty Header */}
            <div className="bg-orange-500 text-white p-3 mb-4">
              <h3 className="text-xl font-bold">{faculty}</h3>
            </div>

            {/* Majors Table */}
            <div className="mb-6">
              <table className="w-full border-collapse border border-gray-400">
                <thead>
                  <tr className="bg-gray-200">
                    <th className="border border-gray-400 p-2 text-left">สาขาวิชา</th>
                    <th className="border border-gray-400 p-2 text-center w-48">
                      จำนวนเรียกสอบคัดเลือก* (คน)
                    </th>
                    <th className="border border-gray-400 p-2 text-center w-48">
                      จำนวนรับเข้าศึกษา (คน)
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {majors.map((major, index) => (
                    <tr key={index} className={index % 2 === 0 ? 'bg-orange-50' : 'bg-white'}>
                      <td className="border border-gray-400 p-2">{major.name}</td>
                      <td className="border border-gray-400 p-2 text-center">
                        {major.admitCount ? `${major.admitCount}+` : 'N/A'}
                      </td>
                      <td className="border border-gray-400 p-2 text-center">
                        {major.admitCount || 'N/A'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Detailed Requirements for Each Major */}
            {majors.map((major, majorIndex) => (
              <div key={majorIndex} className="mb-8 page-break-inside-avoid">
                <h4 className="text-lg font-bold mb-3 bg-gray-100 p-2 border-l-4 border-orange-500">
                  {major.name}
                </h4>

                {/* Basic Information */}
                {(major.fee || major.notes) && (
                  <div className="mb-4 text-sm">
                    {major.fee && (
                      <p>
                        <span className="font-semibold">ค่าธรรมเนียม:</span> {major.fee}
                      </p>
                    )}
                    {major.notes && (
                      <p>
                        <span className="font-semibold">หมายเหตุ:</span> {major.notes}
                      </p>
                    )}
                  </div>
                )}

                {/* Qualifications */}
                {major.qualifications.map((qual, qualIndex) => (
                  <div key={qualIndex} className="mb-4">
                    <h5 className="font-semibold text-md mb-2 text-orange-600">
                      {qual.applicantType}
                    </h5>

                    {/* Requirements Table */}
                    {qual.requirements.length > 0 && (
                      <div className="mb-3">
                        <p className="font-semibold text-sm mb-1">วิชาที่ต้องมีคะแนน:</p>
                        <table className="w-full border-collapse border border-gray-300 text-sm">
                          <thead>
                            <tr className="bg-gray-100">
                              <th className="border border-gray-300 p-2 text-left">วิชา</th>
                              <th className="border border-gray-300 p-2 text-left">เงื่อนไข</th>
                              <th className="border border-gray-300 p-2 text-center">คะแนน</th>
                            </tr>
                          </thead>
                          <tbody>
                            {qual.requirements.map((req, reqIndex) => (
                              <tr key={reqIndex}>
                                <td className="border border-gray-300 p-2">{req.subject}</td>
                                <td className="border border-gray-300 p-2">
                                  {req.condition || '-'}
                                </td>
                                <td className="border border-gray-300 p-2 text-center">
                                  {req.score || '-'}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}

                    {/* English Tests Table */}
                    {qual.englishTests.length > 0 && (
                      <div className="mb-3">
                        <p className="font-semibold text-sm mb-1">
                          ผลคะแนนสอบความสามารถทางภาษาอังกฤษ:
                        </p>
                        <table className="w-full border-collapse border border-gray-300 text-sm">
                          <thead>
                            <tr className="bg-gray-100">
                              <th className="border border-gray-300 p-2 text-left">การสอบ</th>
                              <th className="border border-gray-300 p-2 text-left">เงื่อนไข</th>
                              <th className="border border-gray-300 p-2 text-center">
                                คะแนนขั้นต่ำ
                              </th>
                            </tr>
                          </thead>
                          <tbody>
                            {qual.englishTests.map((test, testIndex) => (
                              <tr key={testIndex}>
                                <td className="border border-gray-300 p-2">{test.test}</td>
                                <td className="border border-gray-300 p-2">
                                  {test.condition || '-'}
                                </td>
                                <td className="border border-gray-300 p-2 text-center">
                                  {test.score}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                ))}

                {/* Divider between majors */}
                {majorIndex < majors.length - 1 && (
                  <hr className="my-6 border-t-2 border-gray-300" />
                )}
              </div>
            ))}
          </div>
        ));
      })()}

      {/* Footer Note */}
      <div className="text-xs text-gray-600 mt-8 p-4 bg-gray-50 border-t border-gray-300">
        <p className="font-semibold">หมายเหตุ:</p>
        <p>
          สอบคัดเลือก* หมายถึง สอบสัมภาษณ์ และ/หรือสอบทักษะพื้นฐาน
          เพื่อประเมินความถนัดทางวิชาชีพ/ความสามารถพิเศษ
        </p>
        <p className="mt-2">
          สำนักงานคัดเลือกและสรรหานักศึกษา มจธ. ข้อมูลอาจมีการเปลี่ยนแปลงตามความเหมาะสม
        </p>
      </div>
    </div>
  );
}
