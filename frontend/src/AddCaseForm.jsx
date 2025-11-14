import React, { useState } from 'react';
import { downloadCaseReportPDF } from '../../src/utils/pdfGenerator';
import { downloadCaseReportCSV } from '../../src/utils/csvGenerator';

const AddCaseForm = ({ onClose, onCaseAdded }) => {
  const [formData, setFormData] = useState({});

  const computeAge = (birthdate) => {
    if (!birthdate) return '';
    const d = new Date(birthdate);
    if (isNaN(d.getTime())) return '';
    const now = new Date();
    let age = now.getFullYear() - d.getFullYear();
    const m = now.getMonth() - d.getMonth();
    if (m < 0 || (m === 0 && now.getDate() < d.getDate())) age--;
    return age;
  };

  const buildCaseDataForExport = () => ({
    ...formData,
    age: formData.age || computeAge(formData.birthdate),
    address: formData.presentAddress || formData.address || '',
    name: formData.name || 'New Case',
  });

  const handleExportPDF = (e) => {
    e.preventDefault();
    try { downloadCaseReportPDF(buildCaseDataForExport()); } catch (err) { console.error('PDF export failed:', err); }
  };
  const handleExportCSV = (e) => {
    e.preventDefault();
    try { downloadCaseReportCSV(buildCaseDataForExport()); } catch (err) { console.error('CSV export failed:', err); }
  };

  return (
    <div className="container py-3">
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h5 className="mb-0">Add Case</h5>
        <div className="d-flex gap-2">
          <button type="button" className="btn btn-outline-secondary" onClick={handleExportPDF}>
            <i className="fas fa-file-pdf me-2"></i> Export PDF
          </button>
          <button type="button" className="btn btn-outline-secondary" onClick={handleExportCSV}>
            <i className="fas fa-file-csv me-2"></i> Export CSV
          </button>
        </div>
      </div>
      {/* Minimal placeholder; real fields live in root src app */}
      <div className="alert alert-info">Form placeholder. Export uses current entries.</div>
      <div className="d-flex gap-2">
        <button className="btn btn-light" onClick={onClose}>Close</button>
        <button className="btn btn-primary" onClick={() => onCaseAdded?.(buildCaseDataForExport())}>Save</button>
      </div>
    </div>
  );
};

export default AddCaseForm;
