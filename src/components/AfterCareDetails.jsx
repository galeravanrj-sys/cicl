import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useParams, useNavigate } from 'react-router-dom';
import { API_BASE } from '../utils/apiBase';

const AfterCareDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [editSchool, setEditSchool] = useState(false);
  const [editAddress, setEditAddress] = useState(false);
  const [grade, setGrade] = useState('');
  const [school, setSchool] = useState('');
  const [schoolAddress, setSchoolAddress] = useState('');
  const [yearCompleted, setYearCompleted] = useState('');
  const [presentAddress, setPresentAddress] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const run = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem('token') || sessionStorage.getItem('token');
        const res = await fetch(`${API_BASE}/cases/${id}`, {
          headers: { 'x-auth-token': token || '', 'Content-Type': 'application/json' }
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json = await res.json();
        setData(json);
        const edu = Array.isArray(json.educationalAttainment) && json.educationalAttainment.length > 0
          ? json.educationalAttainment[json.educationalAttainment.length - 1]
          : null;
        setGrade(edu?.level || '');
        setSchool(edu?.school_name || '');
        setSchoolAddress(edu?.school_address || '');
        setYearCompleted(edu?.year_completed || '');
        setPresentAddress(json.presentAddress || json.present_address || json.address || '');
      } catch (e) {
        setError('Unable to load case');
      } finally {
        setLoading(false);
      }
    };
    run();
  }, [id]);

  const labelToKey = (label) => {
    switch (String(label || '').trim()) {
      case 'Elementary': return 'elementary';
      case 'High School': return 'highSchool';
      case 'Senior High School': return 'seniorHighSchool';
      case 'Vocational Course': return 'vocationalCourse';
      case 'College': return 'college';
      default: return 'others';
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      const headers = { 'Content-Type': 'application/json', 'x-auth-token': token || '', 'Authorization': `Bearer ${token || ''}` };
      const existing = {};
      if (Array.isArray(data?.educationalAttainment)) {
        data.educationalAttainment.forEach((item) => {
          const key = labelToKey(item.level);
          existing[key] = {
            schoolName: item.school_name || '',
            schoolAddress: item.school_address || '',
            year: item.year_completed || ''
          };
        });
      }
      if (school) {
        const targetKey = labelToKey(grade || 'Others');
        existing[targetKey] = { schoolName: school, schoolAddress, year: yearCompleted };
      }
      const payload = { educationalAttainment: existing, presentAddress };
      const res = await axios.put(`${API_BASE}/cases/${id}`, payload, { headers });
      setData(res.data);
      setEditSchool(false);
      setEditAddress(false);
    } catch (e) {
      console.error('Save failed', e);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="container-fluid py-4"><div className="alert alert-info">Loading...</div></div>
    );
  }
  if (error || !data) {
    return (
      <div className="container-fluid py-4"><div className="alert alert-danger">{error || 'Not found'}</div></div>
    );
  }

  const fullName = [data.firstName || data.first_name || '', data.middleName || data.middle_name || '', data.lastName || data.last_name || ''].filter(Boolean).join(' ').trim();
  const birth = data.birthdate || data.birth_date;
  const age = (() => {
    if (!birth) return null;
    const d = new Date(birth);
    if (Number.isNaN(d.getTime())) return null;
    const n = new Date();
    let a = n.getFullYear() - d.getFullYear();
    const m = n.getMonth() - d.getMonth();
    if (m < 0 || (m === 0 && n.getDate() < d.getDate())) a--;
    return a;
  })();

  const renderField = (label, value) => {
    if (value === undefined || value === null || String(value).trim() === '') return null;
    return (
      <div className="mb-2">
        <strong>{label}:</strong>
        <div className="text-muted">{value}</div>
      </div>
    );
  };

  return (
    <div className="container-fluid py-4" style={{ backgroundColor: '#f8fafc', minHeight: '100vh' }}>
      <div className="row mb-4">
        <div className="col-12 d-flex justify-content-between align-items-center">
          <div>
            <h2 className="mb-1"><i className="fas fa-info-circle me-2 text-primary"></i>After Care Details</h2>
            <p className="text-muted mb-0">Viewing details for case #{data.id}</p>
          </div>
          <button className="btn btn-outline-primary" onClick={() => navigate('/after-care')}>
            <i className="fas fa-arrow-left me-2"></i>Back to After Care
          </button>
        </div>
      </div>

      <div className="card border-0 rounded-4 shadow-sm bg-white">
        <div className="card-header bg-primary text-white">
          <h6 className="mb-0"><i className="fas fa-user me-2"></i>Client</h6>
        </div>
        <div className="card-body p-4">
          {renderField('Name', fullName || data.name)}
          {renderField('Birthdate', birth ? new Date(birth).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : null)}
          {renderField('Age', age)}
        </div>
      </div>

      <div className="card mt-3 border-0 rounded-4 shadow-sm bg-white">
        <div className="card-header bg-success text-white">
          <h6 className="mb-0"><i className="fas fa-school me-2"></i>Current School</h6>
        </div>
        <div className="card-body p-4">
          {!editSchool ? (
            <div>
              {renderField('Grade Level', grade)}
              {renderField('School', school)}
              {renderField('School Address', schoolAddress)}
              {renderField('Year', yearCompleted)}
              <button className="btn btn-outline-secondary btn-sm mt-2" onClick={() => setEditSchool(true)}>
                <i className="fas fa-edit me-1"></i>Edit
              </button>
            </div>
          ) : (
            <div className="row g-2 align-items-end">
              <div className="col-md-4">
                <label className="form-label">Grade Level</label>
                <select className="form-select" value={grade} onChange={(e) => setGrade(e.target.value)}>
                  <option value="Elementary">Elementary</option>
                  <option value="High School">High School</option>
                  <option value="Senior High School">Senior High School</option>
                  <option value="Vocational Course">Vocational Course</option>
                  <option value="College">College</option>
                  <option value="Others">Others</option>
                </select>
              </div>
              <div className="col-md-4">
                <label className="form-label">School</label>
                <input className="form-control" value={school} onChange={(e) => setSchool(e.target.value)} />
              </div>
              <div className="col-md-4">
                <label className="form-label">School Address</label>
                <input className="form-control" value={schoolAddress} onChange={(e) => setSchoolAddress(e.target.value)} />
              </div>
              <div className="col-md-3">
                <label className="form-label">Year</label>
                <input className="form-control" value={yearCompleted} onChange={(e) => setYearCompleted(e.target.value)} />
              </div>
              <div className="col-md-9 d-flex gap-2 justify-content-end">
                <button className="btn btn-outline-secondary btn-sm" onClick={() => setEditSchool(false)} disabled={saving}>Cancel</button>
                <button className="btn btn-primary btn-sm" onClick={handleSave} disabled={saving || !school}>Save</button>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="card mt-3 border-0 rounded-4 shadow-sm bg-white">
        <div className="card-header bg-info text-dark">
          <h6 className="mb-0"><i className="fas fa-home me-2"></i>Current Address</h6>
        </div>
        <div className="card-body p-4">
          {!editAddress ? (
            <div>
              {renderField('Address', presentAddress)}
              <button className="btn btn-outline-secondary btn-sm mt-2" onClick={() => setEditAddress(true)}>
                <i className="fas fa-edit me-1"></i>Edit
              </button>
            </div>
          ) : (
            <div className="row g-2 align-items-end">
              <div className="col-md-12">
                <label className="form-label">Current Address</label>
                <input className="form-control" value={presentAddress} onChange={(e) => setPresentAddress(e.target.value)} />
              </div>
              <div className="col-12 d-flex gap-2 justify-content-end">
                <button className="btn btn-outline-secondary btn-sm" onClick={() => setEditAddress(false)} disabled={saving}>Cancel</button>
                <button className="btn btn-primary btn-sm" onClick={handleSave} disabled={saving || !presentAddress}>Save</button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AfterCareDetails;