'use client';

import { useState } from 'react';
import { Major, Qualification } from '@/lib/types/report.types';

interface DataEditorProps {
  structuredData: Major[];
  setStructuredData: (data: Major[]) => void;
}

export default function DataEditor({ structuredData, setStructuredData }: DataEditorProps) {
  const [expandedMajor, setExpandedMajor] = useState<string | null>(null);
  const [editingField, setEditingField] = useState<{
    majorId: string;
    field: string;
    value: string;
  } | null>(null);

  const handleMajorFieldChange = (majorId: string, field: keyof Major, value: string) => {
    const updatedData = structuredData.map((major) => {
      if (major.id === majorId) {
        return { ...major, [field]: value };
      }
      return major;
    });
    setStructuredData(updatedData);
  };

  const handleQualificationChange = (
    majorId: string,
    qualIndex: number,
    field: keyof Qualification,
    value: string
  ) => {
    const updatedData = structuredData.map((major) => {
      if (major.id === majorId) {
        const updatedQualifications = [...major.qualifications];
        updatedQualifications[qualIndex] = {
          ...updatedQualifications[qualIndex],
          [field]: value,
        };
        return { ...major, qualifications: updatedQualifications };
      }
      return major;
    });
    setStructuredData(updatedData);
  };

  const toggleMajorExpansion = (majorId: string) => {
    setExpandedMajor(expandedMajor === majorId ? null : majorId);
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold">Data Editor</h3>
        <p className="text-sm text-gray-600">
          Click on any field to edit. Changes are saved automatically.
        </p>
      </div>

      <div className="space-y-3">
        {structuredData.map((major, majorIndex) => (
          <div key={major.id} className="border border-gray-300 rounded-lg bg-white shadow-sm">
            {/* Major Header */}
            <div
              className="p-4 bg-gray-50 cursor-pointer hover:bg-gray-100 transition-colors"
              onClick={() => toggleMajorExpansion(major.id)}
            >
              <div className="flex justify-between items-center">
                <div className="flex-1">
                  <h4 className="font-semibold text-lg">{major.name}</h4>
                  <p className="text-sm text-gray-600">Faculty: {major.faculty}</p>
                </div>
                <div className="flex items-center space-x-4 text-sm text-gray-600">
                  <span>Fee: {major.fee || 'N/A'}</span>
                  <span>Admit: {major.admitCount || 'N/A'}</span>
                  <svg
                    className={`w-5 h-5 transition-transform ${
                      expandedMajor === major.id ? 'transform rotate-180' : ''
                    }`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </div>
              </div>
            </div>

            {/* Expanded Major Details */}
            {expandedMajor === major.id && (
              <div className="p-4 space-y-4 border-t border-gray-200">
                {/* Editable Major Fields */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Major Name
                    </label>
                    <input
                      type="text"
                      value={major.name}
                      onChange={(e) => handleMajorFieldChange(major.id, 'name', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Faculty</label>
                    <input
                      type="text"
                      value={major.faculty}
                      onChange={(e) => handleMajorFieldChange(major.id, 'faculty', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Fee</label>
                    <input
                      type="text"
                      value={major.fee || ''}
                      onChange={(e) => handleMajorFieldChange(major.id, 'fee', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Admit Count
                    </label>
                    <input
                      type="number"
                      value={major.admitCount || ''}
                      onChange={(e) =>
                        handleMajorFieldChange(major.id, 'admitCount', e.target.value)
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                  <textarea
                    value={major.notes || ''}
                    onChange={(e) => handleMajorFieldChange(major.id, 'notes', e.target.value)}
                    rows={2}
                    className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {/* Qualifications */}
                <div className="space-y-3">
                  <h5 className="font-semibold text-md">
                    Qualifications ({major.qualifications.length})
                  </h5>
                  {major.qualifications.map((qual, qualIndex) => (
                    <div key={qualIndex} className="p-3 bg-gray-50 rounded border border-gray-200">
                      <div className="mb-2">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Applicant Type
                        </label>
                        <input
                          type="text"
                          value={qual.applicantType}
                          onChange={(e) =>
                            handleQualificationChange(
                              major.id,
                              qualIndex,
                              'applicantType',
                              e.target.value
                            )
                          }
                          className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <p className="text-sm font-medium text-gray-700 mb-1">
                            Requirements ({qual.requirements.length})
                          </p>
                          <div className="space-y-1 text-sm">
                            {qual.requirements.map((req, reqIndex) => (
                              <div key={reqIndex} className="text-gray-600">
                                • {req.subject}
                                {req.score && `: ${req.score}`}
                              </div>
                            ))}
                          </div>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-700 mb-1">
                            English Tests ({qual.englishTests.length})
                          </p>
                          <div className="space-y-1 text-sm">
                            {qual.englishTests.map((test, testIndex) => (
                              <div key={testIndex} className="text-gray-600">
                                • {test.test}: {test.score}
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {structuredData.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          No data available. Please upload a CSV file first.
        </div>
      )}
    </div>
  );
}
