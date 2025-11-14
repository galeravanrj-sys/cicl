import React, { useState, useEffect, useCallback } from 'react';
import { lifeSkillsService, vitalSignsService } from '../services/lifeSkillsVitalSignsService';
import { useParams, useNavigate } from 'react-router-dom';

const LifeSkillsVitalSigns = ({ onClose, caseData }) => {
  const [activeTab, setActiveTab] = useState('lifeSkills');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { id: routeCaseId } = useParams();
  const caseId = caseData?.id || routeCaseId;
  
  // Life Skills state
  const [lifeSkillsData, setLifeSkillsData] = useState({
    activity: '',
    dateCompleted: '',
    performanceRating: '',
    notes: ''
  });

  // Vital Signs state
  const [vitalSignsData, setVitalSignsData] = useState({
    date: '',
    bloodPressure: '',
    bloodPressureRange: '',
    heartRate: '',
    heartRateRange: '',
    temperature: '',
    temperatureRange: '',
    weight: '',
    height: '',
    notes: ''
  });

  // Previous records state
  const [previousActivities, setPreviousActivities] = useState([]);
  const [previousVitalSigns, setPreviousVitalSigns] = useState([]);

  // Life Skills activities options
  const lifeSkillsActivities = [
    'Making the Bed',
    'Basic Cooking',
    'Laundry',
    'Personal Hygiene',
    'Time Management',
    'Money Management',
    'Communication Skills',
    'Problem Solving',
    'Social Skills',
    'Self-Care'
  ];

  // Performance rating options
  const performanceRatings = [
    'Excellent',
    'Good',
    'Fair',
    'Needs Improvement'
  ];

  // Vital Signs dropdown options
  const bloodPressureRanges = [
    'Normal (90/60 - 120/80)',
    'Elevated (120-129/<80)',
    'High Stage 1 (130-139/80-89)',
    'High Stage 2 (140/90+)',
    'Low (<90/60)',
    'Custom'
  ];

  const heartRateRanges = [
    'Normal (60-100 BPM)',
    'Bradycardia (<60 BPM)',
    'Tachycardia (>100 BPM)',
    'Custom'
  ];

  const temperatureRanges = [
    'Normal (36.1-37.2°C)',
    'Low Grade Fever (37.3-38.0°C)',
    'Moderate Fever (38.1-39.0°C)',
    'High Fever (39.1°C+)',
    'Hypothermia (<36.1°C)',
    'Custom'
  ];

  const handleLifeSkillsChange = (e) => {
    const { name, value } = e.target;
    setLifeSkillsData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleVitalSignsChange = (e) => {
    const { name, value } = e.target;
    setVitalSignsData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Load Life Skills data
  const loadLifeSkills = useCallback(async () => {
    try {
      if (caseId) {
        const lifeSkills = await lifeSkillsService.getLifeSkills(caseId);
        const formattedActivities = lifeSkills.map(skill => ({
          activity: skill.activity,
          date: new Date(skill.date_completed).toLocaleDateString(),
          rating: skill.performance_rating,
          notes: skill.notes
        }));
        setPreviousActivities(formattedActivities);
      }
    } catch (error) {
      console.error('Error loading life skills:', error);
    }
  }, [caseId]);

  // Load Vital Signs data
  const loadVitalSigns = useCallback(async () => {
    try {
      if (caseId) {
        const vitalSigns = await vitalSignsService.getVitalSigns(caseId);
        const formattedVitalSigns = vitalSigns.map(vital => ({
          date: new Date(vital.date_recorded).toLocaleDateString(),
          bloodPressure: vital.blood_pressure,
          heartRate: vital.heart_rate,
          temperature: vital.temperature,
          weight: vital.weight,
          height: vital.height,
          notes: vital.notes
        }));
        setPreviousVitalSigns(formattedVitalSigns);
      }
    } catch (error) {
      console.error('Error loading vital signs:', error);
    }
  }, [caseId]);

  // Load data when component mounts
  useEffect(() => {
    if (caseId) {
      loadLifeSkills();
      loadVitalSigns();
    }
  }, [caseId, loadLifeSkills, loadVitalSigns]);

  const handleLifeSkillsSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (!caseId) {
        console.error('Case ID not found');
        return;
      }

      const lifeSkillPayload = {
        activity: lifeSkillsData.activity,
        dateCompleted: lifeSkillsData.dateCompleted,
        performanceRating: lifeSkillsData.performanceRating,
        notes: lifeSkillsData.notes
      };

      await lifeSkillsService.addLifeSkill(caseId, lifeSkillPayload);
      
      // Reset form
      setLifeSkillsData({
        activity: '',
        dateCompleted: '',
        performanceRating: '',
        notes: ''
      });

      // Refresh the previous activities list
      await loadLifeSkills();
    } catch (error) {
      console.error('Error saving life skills data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleVitalSignsSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (!caseId) {
        console.error('Case ID not found');
        return;
      }

      const payload = {
        date: vitalSignsData.date,
        bloodPressure: vitalSignsData.bloodPressure ? String(vitalSignsData.bloodPressure).slice(0, 20).trim() : null,
        heartRate: vitalSignsData.heartRate !== '' && vitalSignsData.heartRate !== null ? parseInt(vitalSignsData.heartRate, 10) : null,
        temperature: vitalSignsData.temperature !== '' && vitalSignsData.temperature !== null ? Number(parseFloat(vitalSignsData.temperature).toFixed(1)) : null,
        weight: vitalSignsData.weight !== '' && vitalSignsData.weight !== null ? Number(parseFloat(vitalSignsData.weight).toFixed(1)) : null,
        height: vitalSignsData.height !== '' && vitalSignsData.height !== null ? parseInt(vitalSignsData.height, 10) : null,
        notes: vitalSignsData.notes
      };

      await vitalSignsService.addVitalSigns(caseId, payload);

      // Reset form
      setVitalSignsData({
        date: '',
        bloodPressure: '',
        bloodPressureRange: '',
        heartRate: '',
        heartRateRange: '',
        temperature: '',
        temperatureRange: '',
        weight: '',
        height: '',
        notes: ''
      });

      // Refresh the previous vital signs
      await loadVitalSigns();
    } catch (error) {
      console.error('Error saving vital signs data:', error);
    } finally {
      setLoading(false);
    }
  };

  const customInputStyle = {
    borderRadius: '8px',
    border: '1px solid #ddd',
    padding: '10px',
    fontSize: '14px'
  };

  const customSelectStyle = {
    borderRadius: '8px',
    border: '1px solid #ddd',
    padding: '10px',
    fontSize: '14px'
  };

  return (
    <div className="modal fade show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
      <div className="modal-dialog modal-xl">
        <div className="modal-content">
          <div className="modal-header bg-primary text-white">
            <h5 className="modal-title fw-bold">Life Skills & Vital Signs Tracking</h5>
            <button 
              type="button" 
              className="btn-close btn-close-white" 
              onClick={() => (onClose ? onClose() : navigate(-1))}
            ></button>
          </div>
          
          <div className="modal-body p-0">
            {/* Tab Navigation */}
            <div className="border-bottom">
              <nav className="nav nav-tabs">
                <button
                  className={`nav-link ${activeTab === 'lifeSkills' ? 'active' : ''}`}
                  onClick={() => setActiveTab('lifeSkills')}
                  style={{
                    backgroundColor: activeTab === 'lifeSkills' ? '#0d6efd' : 'transparent',
                    color: activeTab === 'lifeSkills' ? 'white' : '#0d6efd',
                    border: 'none',
                    borderBottom: activeTab === 'lifeSkills' ? '3px solid #0d6efd' : '1px solid #dee2e6',
                    fontWeight: 'bold',
                    padding: '15px 30px'
                  }}
                >
                  Life Skills
                </button>
                <button
                  className={`nav-link ${activeTab === 'vitalSigns' ? 'active' : ''}`}
                  onClick={() => setActiveTab('vitalSigns')}
                  style={{
                    backgroundColor: activeTab === 'vitalSigns' ? '#0d6efd' : 'transparent',
                    color: activeTab === 'vitalSigns' ? 'white' : '#0d6efd',
                    border: 'none',
                    borderBottom: activeTab === 'vitalSigns' ? '3px solid #0d6efd' : '1px solid #dee2e6',
                    fontWeight: 'bold',
                    padding: '15px 30px'
                  }}
                >
                  Vital Signs
                </button>
              </nav>
            </div>

            {/* Tab Content */}
            <div className="p-4">
              {activeTab === 'lifeSkills' && (
                <div>
                  <form onSubmit={handleLifeSkillsSubmit}>
                    <div className="row">
                      {/* Activity Selection */}
                      <div className="col-md-6 mb-3">
            <label className="form-label fw-semibold text-primary">Activity:</label>
                        <input
                          type="text"
                          className="form-control"
                          name="activity"
                          value={lifeSkillsData.activity}
                          onChange={handleLifeSkillsChange}
                          style={customInputStyle}
                          placeholder="Enter activity"
                          required
                        />
                      </div>

                      {/* Date Completed */}
                      <div className="col-md-6 mb-3">
            <label className="form-label fw-semibold text-primary">Date Completed:</label>
                        <input
                          type="date"
                          className="form-control"
                          name="dateCompleted"
                          value={lifeSkillsData.dateCompleted}
                          onChange={handleLifeSkillsChange}
                          style={customInputStyle}
                          required
                        />
                      </div>

                      {/* Performance Rating */}
                      <div className="col-md-6 mb-3">
            <label className="form-label fw-semibold text-primary">Performance Rating:</label>
                        <select
                          className="form-select"
                          name="performanceRating"
                          value={lifeSkillsData.performanceRating}
                          onChange={handleLifeSkillsChange}
                          style={customSelectStyle}
                          required
                        >
                          <option value="">Select rating</option>
                          {performanceRatings.map((rating, index) => (
                            <option key={index} value={rating}>{rating}</option>
                          ))}
                        </select>
                      </div>

                      {/* Notes */}
                      <div className="col-12 mb-4">
                        <label className="form-label fw-semibold text-primary">Notes:</label>
                        <textarea
                          className="form-control"
                          name="notes"
                          value={lifeSkillsData.notes}
                          onChange={handleLifeSkillsChange}
                          rows="4"
                          placeholder="Additional observations..."
                          style={customInputStyle}
                        ></textarea>
                      </div>
                    </div>

                    {/* Previous Activities */}
                    <div className="mb-4">
                      <h6 className="fw-bold text-primary mb-3">Previous Activities</h6>
                      {previousActivities.length > 0 ? (
                        <div className="row">
                          {previousActivities.map((activity, index) => (
                            <div key={index} className="col-md-6 mb-3">
                              <div className="card border-0 shadow-sm">
                                <div className="card-body p-3">
                                  <div className="d-flex justify-content-between align-items-start mb-2">
                                    <h6 className="fw-bold mb-0">{activity.activity}</h6>
                                    <small className="text-muted">{activity.date}</small>
                                  </div>
                                  <span className="badge bg-success">{activity.rating}</span>
                                  {activity.notes && (
                                    <p className="mt-2 mb-0 small text-muted">{activity.notes}</p>
                                  )}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-muted fst-italic text-center py-4">No activities recorded yet.</p>
                      )}
                    </div>

                    {/* Action Buttons */}
                    <div className="d-flex justify-content-end gap-2">
                      <button type="button" className="btn btn-secondary px-4" onClick={onClose}>
                        Close
                      </button>
                      <button 
                        type="submit" 
                        className="btn btn-primary px-4"
                        disabled={loading}
                      >
                        {loading ? 'Saving...' : 'Save Vital Signs Data'}
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {activeTab === 'vitalSigns' && (
                <div>
                  <form onSubmit={handleVitalSignsSubmit}>
                    <div className="row">
                      {/* Date */}
                      <div className="col-md-6 mb-3">
            <label className="form-label fw-semibold text-primary">Date:</label>
                        <input
                          type="date"
                          className="form-control"
                          name="date"
                          value={vitalSignsData.date}
                          onChange={handleVitalSignsChange}
                          style={customInputStyle}
                          required
                        />
                      </div>

                      {/* Blood Pressure */}
                      <div className="col-md-6 mb-3">
                        <label className="form-label fw-semibold text-primary">Blood Pressure Range:</label>
                        <select
                          className="form-select"
                          name="bloodPressureRange"
                          value={vitalSignsData.bloodPressureRange}
                          onChange={handleVitalSignsChange}
                          style={customSelectStyle}
                        >
                          <option value="">Select range</option>
                          {bloodPressureRanges.map((range, index) => (
                            <option key={index} value={range}>{range}</option>
                          ))}
                        </select>
                      </div>

                      {/* Custom Blood Pressure Input */}
                      {vitalSignsData.bloodPressureRange === 'Custom' && (
                        <div className="col-md-6 mb-3">
                          <label className="form-label fw-semibold text-primary">Blood Pressure (Custom):</label>
                          <input
                            type="text"
                            className="form-control"
                            name="bloodPressure"
                            value={vitalSignsData.bloodPressure}
                            onChange={handleVitalSignsChange}
                            placeholder="120/80"
                            style={customInputStyle}
                            maxLength={20}
                          />
                        </div>
                      )}

                      {/* Heart Rate Range */}
                      <div className="col-md-6 mb-3">
                        <label className="form-label fw-semibold text-primary">Heart Rate Range:</label>
                        <select
                          className="form-select"
                          name="heartRateRange"
                          value={vitalSignsData.heartRateRange}
                          onChange={handleVitalSignsChange}
                          style={customSelectStyle}
                        >
                          <option value="">Select range</option>
                          {heartRateRanges.map((range, index) => (
                            <option key={index} value={range}>{range}</option>
                          ))}
                        </select>
                      </div>

                      {/* Custom Heart Rate Input */}
                      {vitalSignsData.heartRateRange === 'Custom' && (
                        <div className="col-md-6 mb-3">
                          <label className="form-label fw-semibold text-primary">Heart Rate (BPM):</label>
                          <input
                            type="number"
                            className="form-control"
                            name="heartRate"
                            value={vitalSignsData.heartRate}
                            onChange={handleVitalSignsChange}
                            placeholder="72"
                            style={customInputStyle}
                          />
                        </div>
                      )}

                      {/* Temperature Range */}
                      <div className="col-md-6 mb-3">
                        <label className="form-label fw-semibold text-primary">Temperature Range:</label>
                        <select
                          className="form-select"
                          name="temperatureRange"
                          value={vitalSignsData.temperatureRange}
                          onChange={handleVitalSignsChange}
                          style={customSelectStyle}
                        >
                          <option value="">Select range</option>
                          {temperatureRanges.map((range, index) => (
                            <option key={index} value={range}>{range}</option>
                          ))}
                        </select>
                      </div>

                      {/* Custom Temperature Input */}
                      {vitalSignsData.temperatureRange === 'Custom' && (
                        <div className="col-md-6 mb-3">
                          <label className="form-label fw-semibold text-primary">Temperature (°C):</label>
                          <input
                            type="number"
                            step="0.1"
                            className="form-control"
                            name="temperature"
                            value={vitalSignsData.temperature}
                            onChange={handleVitalSignsChange}
                            placeholder="36.5"
                            style={customInputStyle}
                          />
                        </div>
                      )}

                      {/* Weight */}
                      <div className="col-md-6 mb-3">
                        <label className="form-label fw-semibold text-primary">Weight (KG):</label>
                        <input
                          type="number"
                          step="0.1"
                          className="form-control"
                          name="weight"
                          value={vitalSignsData.weight}
                          onChange={handleVitalSignsChange}
                          placeholder="50.0"
                          style={customInputStyle}
                        />
                      </div>

                      {/* Height */}
                      <div className="col-md-6 mb-3">
                        <label className="form-label fw-semibold text-primary">Height (CM):</label>
                        <input
                          type="number"
                          className="form-control"
                          name="height"
                          value={vitalSignsData.height}
                          onChange={handleVitalSignsChange}
                          placeholder="160"
                          style={customInputStyle}
                        />
                      </div>

                      {/* Notes */}
                      <div className="col-12 mb-4">
                        <label className="form-label fw-semibold text-primary">Notes:</label>
                        <textarea
                          className="form-control"
                          name="notes"
                          value={vitalSignsData.notes}
                          onChange={handleVitalSignsChange}
                          rows="4"
                          placeholder="Additional health observations..."
                          style={customInputStyle}
                        ></textarea>
                      </div>
                    </div>

                    {/* Previous Vital Signs */}
                    <div className="mb-4">
                      <h6 className="fw-bold text-primary mb-3">Previous Vital Signs</h6>
                      {previousVitalSigns.length > 0 ? (
                        <div className="table-responsive">
                          <table className="table table-bordered">
                            <thead className="table-light">
                              <tr>
                                <th>Date</th>
                                <th>Blood Pressure</th>
                                <th>Heart Rate</th>
                                <th>Temperature</th>
                                <th>Weight</th>
                                <th>Height</th>
                              </tr>
                            </thead>
                            <tbody>
                              {previousVitalSigns.map((record, index) => (
                                <tr key={index}>
                                  <td>{record.date}</td>
                                  <td>{record.bloodPressure}</td>
                                  <td>{record.heartRate}</td>
                                  <td>{record.temperature}</td>
                                  <td>{record.weight}</td>
                                  <td>{record.height}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      ) : (
                        <p className="text-muted fst-italic text-center py-4">No vital signs recorded yet.</p>
                      )}
                    </div>

                    {/* Action Buttons */}
                    <div className="d-flex justify-content-end gap-2">
                      <button type="button" className="btn btn-secondary px-4" onClick={() => (onClose ? onClose() : navigate(-1))}>
                        Close
                      </button>
                      <button 
                        type="submit" 
                        className="btn btn-primary px-4"
                        disabled={loading}
                      >
                        {loading ? 'Saving...' : 'Save Data'}
                      </button>
                    </div>
                  </form>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LifeSkillsVitalSigns;