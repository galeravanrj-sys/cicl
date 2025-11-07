import React, { useState, useEffect, useCallback } from 'react';
import { useCases } from '../context/CaseContext';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement } from 'chart.js';
import { Bar, Doughnut, Pie } from 'react-chartjs-2';
import { isArchivedStatus } from '../utils/statusHelpers';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement);

const Reports = () => {
  const { fetchAllCases, loading, error } = useCases();
  const [allCases, setAllCases] = useState([]);
  
  useEffect(() => {
    const loadAllCases = async () => {
      const cases = await fetchAllCases();
      setAllCases(cases);
    };
    
    loadAllCases();
  }, [fetchAllCases]);
  
  // Process case data for reports
  const processReportData = useCallback(() => {
    if (!allCases || allCases.length === 0) {
      return {
        activeCases: {
          newAdmissions: 0,
          Reintegration: 0
        },
        performanceByMonth: {
          labels: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'],
          data: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
        },
        reintegrationByMonth: {
          labels: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'],
          data: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
        },
        programDistribution: {
          'Children': 0,
          'Youth': 0,
          'Sanctuary': 0,
          'Crisis Intervention': 0
        }
      };
    }

    // Count active cases
    const newAdmissionsCount = allCases.filter(c => {
      if (!c?.lastUpdated) return false;
      const updateDate = new Date(c.lastUpdated);
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      return updateDate >= thirtyDaysAgo && 
             (String(c?.status || '').toLowerCase() === 'active' || 
              c?.status === true ||
              c?.isActive === true || 
              c?.status === null || 
              c?.status === undefined);
    }).length;

    const reintegrationCount = allCases.filter(c => {
      return isArchivedStatus(c?.status);
    }).length;

    // Group data by months
    const monthLabels = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    const admissionsByMonth = new Array(12).fill(0);
    const reintegrationsByMonth = new Array(12).fill(0);

    allCases.forEach(c => {
      if (c?.lastUpdated) {
        const updateDate = new Date(c.lastUpdated);
        const month = updateDate.getMonth();
        
        // Count as admission if it's active
        if (!isArchivedStatus(c?.status)) {
          admissionsByMonth[month]++;
        }
        
        // Count as archives if it's marked as archived
        if (isArchivedStatus(c?.status)) {
          reintegrationsByMonth[month]++;
        }
      }
    });

    // Program distribution
    const programCounts = {
      'Children': 0,
      'Youth': 0,
      'Sanctuary': 0,
      'Crisis Intervention': 0
    };

    allCases.forEach(c => {
      const pt = (c?.programType || c?.program_type || '').toString();
      if (pt) {
        if (pt.includes('Children')) {
          programCounts['Children']++;
        } else if (pt.includes('Youth')) {
          programCounts['Youth']++;
        } else if (pt.includes('Sanctuary')) {
          programCounts['Sanctuary']++;
        } else if (pt.toLowerCase().includes('crisis')) {
          programCounts['Crisis Intervention']++;
        } else if (pt.includes('Rosalie')) {
          programCounts['Children']++;
        } else if (pt.includes('Margaret')) {
          programCounts['Youth']++;
        } else if (pt.includes('Martha')) {
          programCounts['Sanctuary']++;
        }
      }
    });

    return {
      activeCases: {
        newAdmissions: newAdmissionsCount,
        Reintegration: reintegrationCount
      },
      performanceByMonth: {
        labels: monthLabels,
        data: admissionsByMonth
      },
      reintegrationByMonth: {
        labels: monthLabels,
        data: reintegrationsByMonth
      },
      programDistribution: programCounts
    };
  }, [allCases]);

  // State to store case data
  const [caseData, setCaseData] = useState(processReportData());

  // Update report data when cases change
  useEffect(() => {
    setCaseData(processReportData());
  }, [processReportData]);

  // Active Cases Donut Chart Data
  const activeCasesData = {
    labels: ['New Admissions', 'Discharged'],
    datasets: [
      {
        data: [caseData.activeCases.newAdmissions, caseData.activeCases.Reintegration],
        backgroundColor: ['#4CAF50', '#F44336'],
        borderWidth: 0,
        cutout: '60%'
      },
    ],
  };

  // Admission Data (previously Performance Analysis)
  const admissionData = {
    labels: caseData.performanceByMonth.labels,
    datasets: [
      {
        label: 'Monthly Admissions',
        data: caseData.performanceByMonth.data,
        backgroundColor: '#0096FF',
        borderRadius: 4,
        barThickness: 30,
      },
    ],
  };

  // Reintegration Data - Monthly view
  const reintegrationData = {
    labels: caseData.reintegrationByMonth.labels,
    datasets: [
      {
        label: 'Monthly Discharged',
        data: caseData.reintegrationByMonth.data,
        backgroundColor: '#81C784',
        borderRadius: 4,
        barThickness: 30,
      },
    ],
  };

  // Program Distribution Chart Data
  const programData = {
    labels: Object.keys(caseData.programDistribution),
    datasets: [
      {
        data: Object.values(caseData.programDistribution),
        backgroundColor: [
          '#4BC0C0', // Teal for Children
          '#36A2EB', // Blue for Youth
          '#FFCE56', // Yellow for Sanctuary
          '#FF6384'  // Pink for Crisis Intervention
        ],
        borderWidth: 1
      },
    ],
  };

  // Chart options
  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: false,
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        grid: {
          display: true,
          color: 'rgba(0, 0, 0, 0.1)',
        },
      },
      x: {
        grid: {
          display: false,
        },
      },
    },
  };

  // Pie chart options
  const pieOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          color: '#475569',
          font: {
            size: 12
          }
        }
      }
    }
  };

  if (loading) {
    return (
      <div className="container-fluid py-4 text-center">
        <h2 className="mb-4 border-bottom pb-3">REPORTS</h2>
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
        <p className="mt-2">Loading report data...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container-fluid py-4">
        <h2 className="mb-4 border-bottom pb-3">REPORTS</h2>
        <div className="alert alert-danger">{error}</div>
      </div>
    );
  }

  return (
    <div className="container-fluid py-4">
      <h2 className="mb-4 border-bottom pb-3">REPORTS</h2>
      
      <div className="row g-4">
        {/* Active Cases Chart */}
        <div className="col-md-6">
          <div className="card h-100 border-0 rounded-4" style={{ backgroundColor: '#e0f2fe' }}>
            <div className="card-body p-4 text-dark">
              <h5 className="card-title text-uppercase fw-bold" style={{ color: '#1f2937' }}>Active Cases</h5>
              <div style={{ height: '300px', position: 'relative' }}>
                <Doughnut 
                  data={activeCasesData} 
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                      legend: {
                        position: 'bottom',
                        labels: {
                          color: '#475569',
                          font: {
                            size: 12
                          }
                        }
                      }
                    }
                  }}
                />
              </div>
            </div>
          </div>
        </div>
        
        {/* Admission Chart */}
        <div className="col-md-6">
          <div className="card h-100 border-0 rounded-4" style={{ backgroundColor: '#e0f2fe' }}>
            <div className="card-body p-4 text-dark">
              <h5 className="card-title text-uppercase fw-bold" style={{ color: '#1f2937' }}>Admission</h5>
              <div style={{ height: '300px', position: 'relative' }}>
                <Bar data={admissionData} options={chartOptions} />
              </div>
            </div>
          </div>
        </div>
        
        {/* Archived Chart */}
        <div className="col-md-6">
          <div className="card h-100 border-0 rounded-4" style={{ backgroundColor: '#e0f2fe' }}>
            <div className="card-body p-4 text-dark">
              <h5 className="card-title text-uppercase fw-bold" style={{ color: '#1f2937' }}>Discharged</h5>
              <div style={{ height: '300px', position: 'relative' }}>
                <Bar data={reintegrationData} options={chartOptions} />
              </div>
            </div>
          </div>
        </div>
        
        {/* Program/Services Chart */}
        <div className="col-md-6">
          <div className="card h-100 border-0 rounded-4" style={{ backgroundColor: '#e0f2fe' }}>
            <div className="card-body p-4 text-dark">
              <h5 className="card-title text-uppercase fw-bold" style={{ color: '#1f2937' }}>Program</h5>
              <div style={{ height: '300px', position: 'relative' }}>
                <Pie data={programData} options={pieOptions} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Reports;