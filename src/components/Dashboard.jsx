import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useCases } from '../context/CaseContext';
import { isArchivedStatus } from '../utils/statusHelpers';
import LoadingSpinner from './LoadingSpinner';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement } from 'chart.js';
import { Bar, Doughnut, Pie } from 'react-chartjs-2';
import { useNavigate } from 'react-router-dom';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement);

const Dashboard = () => {
  const { fetchAllCases, loading, error } = useCases();
  const [allCases, setAllCases] = useState([]);
  const navigate = useNavigate();
  const activeDonutRef = useRef(null);
  const programPieRef = useRef(null);
  const admissionsBarRef = useRef(null);
  
  useEffect(() => {
    const loadAllCases = async () => {
      // Only fetch if we don't have cases already
      if (allCases.length === 0) {
        const cases = await fetchAllCases();
        setAllCases(cases);
      }
    };
    
    loadAllCases();
  }, [fetchAllCases, allCases.length]);
  
  // Calculate dashboard statistics with memoization for performance
  const dashboardStats = useMemo(() => {
    const activeCasesCount = allCases.filter(c => 
      String(c?.status || '').toLowerCase() === 'active' || 
      c?.status === true ||
      c?.isActive === true || 
      c?.status === null || 
      c?.status === undefined
    ).length;
    
    const archivedCount = allCases.filter(c => {
      return isArchivedStatus(c?.status);
    }).length;

    const newAdmissionsCount = allCases.filter(c => {
      // Assume cases added in the last 30 days are new admissions
      if (!c?.lastUpdated) return false;
      const caseDate = new Date(c.lastUpdated);
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      return caseDate >= thirtyDaysAgo;
    }).length;

    return { activeCasesCount, archivedCount, newAdmissionsCount };
  }, [allCases]);

  // Calculate month over month changes with memoization
  const monthlyChanges = useMemo(() => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const lastMonth = currentMonth === 0 ? 11 : currentMonth - 1; // Handle January case
    const currentYear = now.getFullYear();
    const lastMonthYear = currentMonth === 0 ? currentYear - 1 : currentYear; // Handle January case
    
    // Cases active this month
    const activeCasesThisMonth = allCases.filter(c => {
      if (!c?.lastUpdated) return false;
      const updateDate = new Date(c.lastUpdated);
      return updateDate.getMonth() === currentMonth && 
             updateDate.getFullYear() === currentYear &&
             (String(c?.status || '').toLowerCase() === 'active' || 
              c?.status === true ||
              c?.isActive === true || 
              c?.status === null || 
              c?.status === undefined);
    }).length;
    
    // Cases active last month
    const activeCasesLastMonth = allCases.filter(c => {
      if (!c?.lastUpdated) return false;
      const updateDate = new Date(c.lastUpdated);
      return updateDate.getMonth() === lastMonth && 
             updateDate.getFullYear() === lastMonthYear &&
             (String(c?.status || '').toLowerCase() === 'active' || 
              c?.status === true ||
              c?.isActive === true || 
              c?.status === null || 
              c?.status === undefined);
    }).length;
    
    // Calculate active cases percentage change
    const activePercentChange = activeCasesLastMonth > 0 
      ? ((activeCasesThisMonth - activeCasesLastMonth) / activeCasesLastMonth) * 100 
      : 0;
    
    // Archived cases this month
    const archivedThisMonth = allCases.filter(c => {
      if (!c?.lastUpdated) return false;
      const updateDate = new Date(c.lastUpdated);
      return updateDate.getMonth() === currentMonth && 
             updateDate.getFullYear() === currentYear &&
             isArchivedStatus(c?.status);
    }).length;
    
    // Archived cases last month
    const archivedLastMonth = allCases.filter(c => {
      if (!c?.lastUpdated) return false;
      const updateDate = new Date(c.lastUpdated);
      return updateDate.getMonth() === lastMonth && 
             updateDate.getFullYear() === lastMonthYear &&
             isArchivedStatus(c?.status);
    }).length;
    
    // Calculate archived percentage change
    const archivedPercentChange = archivedLastMonth > 0 
      ? ((archivedThisMonth - archivedLastMonth) / archivedLastMonth) * 100 
      : 0;
    
    // New admissions this month
    const admissionsThisMonth = allCases.filter(c => {
      if (!c?.lastUpdated) return false;
      const updateDate = new Date(c.lastUpdated);
      return updateDate.getMonth() === currentMonth && 
             updateDate.getFullYear() === currentYear;
    }).length;
    
    // New admissions last month
    const admissionsLastMonth = allCases.filter(c => {
      if (!c?.lastUpdated) return false;
      const updateDate = new Date(c.lastUpdated);
      return updateDate.getMonth() === lastMonth && 
             updateDate.getFullYear() === lastMonthYear;
    }).length;
    
    // Calculate admissions percentage change
    const admissionsPercentChange = admissionsLastMonth > 0 
      ? ((admissionsThisMonth - admissionsLastMonth) / admissionsLastMonth) * 100 
      : 0;

    return {
      activePercentChange: Math.round(activePercentChange),
      archivedPercentChange: Math.round(archivedPercentChange),
      admissionsPercentChange: Math.round(admissionsPercentChange)
    };
  }, [allCases]);

  // Process chart data similar to Reports component
  const processChartData = useCallback(() => {
    if (!allCases || allCases.length === 0) {
      return {
        activeCasesChart: {
          newAdmissions: 0,
          archived: 0
        },
        monthlyAdmissions: {
          labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
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

    // Count new admissions (last 30 days)
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

    const archivedCount = allCases.filter(c => {
      return isArchivedStatus(c?.status);
    }).length;

    // Group admissions by months
    const monthLabels = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const admissionsByMonth = new Array(12).fill(0);

    allCases.forEach(c => {
      if (c?.lastUpdated) {
        const updateDate = new Date(c.lastUpdated);
        const month = updateDate.getMonth();
        
        // Count as admission if it's active
        if (!isArchivedStatus(c?.status)) {
          admissionsByMonth[month]++;
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
      activeCasesChart: {
        newAdmissions: newAdmissionsCount,
        archived: archivedCount
      },
      monthlyAdmissions: {
        labels: monthLabels,
        data: admissionsByMonth
      },
      programDistribution: programCounts
    };
  }, [allCases]);

  // Chart data state
  const [chartData, setChartData] = useState(processChartData());

  // Update chart data when cases change
  useEffect(() => {
    setChartData(processChartData());
  }, [processChartData]);

  // Active Cases Donut Chart Data
  const activeCasesChartData = {
    labels: ['New Admissions', 'Discharged'],
    datasets: [
      {
        data: [chartData.activeCasesChart.newAdmissions, chartData.activeCasesChart.archived],
        backgroundColor: ['#4CAF50', '#F44336'],
        borderWidth: 0,
        cutout: '60%'
      },
    ],
  };

  // Monthly Admissions Bar Chart Data
  const monthlyAdmissionsData = {
    labels: chartData.monthlyAdmissions.labels,
    datasets: [
      {
        label: 'Monthly Admissions',
        data: chartData.monthlyAdmissions.data,
        backgroundColor: '#0096FF',
        borderRadius: 4,
        barThickness: 20,
      },
    ],
  };

  // Use the exact chart palette to color the summary numbers
  const activeNumberColor = activeCasesChartData.datasets[0].backgroundColor[0];
  const dischargedNumberColor = activeCasesChartData.datasets[0].backgroundColor[1];
  const admissionsNumberColor = monthlyAdmissionsData.datasets[0].backgroundColor;

  // Program Distribution Pie Chart Data
  const programDistributionData = {
    labels: Object.keys(chartData.programDistribution),
    datasets: [
      {
        data: Object.values(chartData.programDistribution),
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
        position: 'bottom',
        labels: {
          color: '#1f2937',
          font: {
            size: 10
          }
        }
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
          color: 'rgba(245, 0, 0, 0.2)',
        },
        ticks: {
          color: '#1f2937'
        }
      },
      x: {
        grid: {
          display: false,
        },
        ticks: {
          color: '#1f2937'
        }
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
            size: 10
          }
        }
      }
    }
  };

  return (
    <div className="container-fluid py-4">
      <h2 className="mb-4 border-bottom pb-3">Dashboard</h2>
      
      {loading ? (
        <LoadingSpinner message="Loading case data..." size="large" />
      ) : error ? (
        <div className="alert alert-danger">{error}</div>
      ) : (
        <>
          {/* Statistics Cards Row */}
          <div className="row g-4 mb-5">
            {/* Active Cases Card */}
            <div className="col-lg-4 col-md-6">
              <div className="card h-100 border-0 rounded-4" style={{ backgroundColor: '#e0f2fe' }}>
                <div className="card-body p-4 text-dark">
                  <h5 className="card-title text-uppercase fw-bold text-center" style={{ color: '#1f2937' }}>ACTIVE CASES</h5>
                  <div className="d-flex align-items-center justify-content-center my-4">
                    <h1 className="display-1 fw-bold mb-0" style={{ color: activeNumberColor }}>{dashboardStats.activeCasesCount}</h1>
                  </div>
                  <div className="mt-2 d-flex align-items-center justify-content-center" style={{ color: '#475569' }}>
                    {monthlyChanges.activePercentChange !== 0 && (
                      <>
                        <i className={`fas fa-arrow-${monthlyChanges.activePercentChange >= 0 ? 'up' : 'down'} me-2 ${monthlyChanges.activePercentChange < 0 ? 'text-danger' : ''}`}></i>
                        <small>{Math.abs(monthlyChanges.activePercentChange)}% From Last Month</small>
                      </>
                    )}
                    {monthlyChanges.activePercentChange === 0 && (
                      <small>No Change From Last Month</small>
                    )}
                  </div>
                </div>
              </div>
            </div>
            
            {/* Archived Card */}
            <div className="col-lg-4 col-md-6">
              <div className="card h-100 border-0 rounded-4" style={{ backgroundColor: '#e0f2fe' }}>
                <div className="card-body p-4 text-dark">
                  <h5 className="card-title text-uppercase fw-bold text-center" style={{ color: '#1f2937' }}>DISCHARGED</h5>
                  <div className="d-flex align-items-center justify-content-center my-4">
                    <h1 className="display-1 fw-bold mb-0" style={{ color: dischargedNumberColor }}>{dashboardStats.archivedCount}</h1>
                  </div>
                  <div className="mt-2 d-flex align-items-center justify-content-center" style={{ color: '#475569' }}>
                    {monthlyChanges.archivedPercentChange !== 0 && (
                      <>
                        <i className={`fas fa-arrow-${monthlyChanges.archivedPercentChange >= 0 ? 'up' : 'down'} me-2 ${monthlyChanges.archivedPercentChange < 0 ? 'text-danger' : ''}`}></i>
                        <small>{Math.abs(monthlyChanges.archivedPercentChange)}% From Last Month</small>
                      </>
                    )}
                    {monthlyChanges.archivedPercentChange === 0 && (
                      <small>No Change From Last Month</small>
                    )}
                  </div>
                </div>
              </div>
            </div>
            
            {/* New Admissions Card */}
            <div className="col-lg-4 col-md-6">
              <div className="card h-100 border-0 rounded-4" style={{ backgroundColor: '#e0f2fe' }}>
                <div className="card-body p-4 text-dark">
                  <h5 className="card-title text-uppercase fw-bold text-center" style={{ color: '#1f2937' }}>NEW ADMISSIONS</h5>
                  <div className="d-flex align-items-center justify-content-center my-4">
                    <h1 className="display-1 fw-bold mb-0" style={{ color: admissionsNumberColor }}>{dashboardStats.newAdmissionsCount}</h1>
                  </div>
                  <div className="mt-2 d-flex align-items-center justify-content-center" style={{ color: '#475569' }}>
                    {monthlyChanges.admissionsPercentChange !== 0 && (
                      <>
                        <i className={`fas fa-arrow-${monthlyChanges.admissionsPercentChange >= 0 ? 'up' : 'down'} me-2 ${monthlyChanges.admissionsPercentChange < 0 ? 'text-danger' : ''}`}></i>
                        <small>{Math.abs(monthlyChanges.admissionsPercentChange)}% From Last Month</small>
                      </>
                    )}
                    {monthlyChanges.admissionsPercentChange === 0 && (
                      <small>No Change From Last Month</small>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Charts/Details Row */}
          <div className="row g-4">
            {/* Active Cases Chart */}
            <div className="col-lg-4 col-md-6">
              <div className="card h-100 border-0 rounded-4" style={{ backgroundColor: '#e0f2fe' }}>
                <div className="card-body p-4 text-dark">
                  <h5 className="card-title text-uppercase fw-bold" style={{ color: '#1f2937' }}>ACTIVE CASES</h5>
                  <div style={{ height: '250px', position: 'relative' }}
                       onDoubleClick={(e) => {
                         const chart = activeDonutRef.current;
                         if (!chart) return navigate('/archived-cases');
                         const els = chart.getElementsAtEventForMode(e, 'nearest', { intersect: true }, true);
                         if (!els?.length) return;
                         const idx = els[0].index;
                         if (idx === 1) navigate('/archived-cases');
                         else if (idx === 0) navigate('/cases');
                       }}
                  >
                    <Doughnut ref={activeDonutRef} data={activeCasesChartData} options={pieOptions} />
                  </div>
                </div>
              </div>
            </div>
            
            {/* Monthly Admissions Chart */}
            <div className="col-lg-4 col-md-6">
              <div className="card h-100 border-0 rounded-4" style={{ backgroundColor: '#e0f2fe' }}>
                <div className="card-body p-4 text-dark">
                  <h5 className="card-title text-uppercase fw-bold" style={{ color: '#1f2937' }}>ADMISSION</h5>
                  <div style={{ height: '250px', position: 'relative' }} onClick={() => navigate('/cases')}>
                    <Bar ref={admissionsBarRef} data={monthlyAdmissionsData} options={chartOptions} />
                  </div>
                </div>
              </div>
            </div>
            
            {/* Program Distribution Chart */}
            <div className="col-lg-4 col-md-6">
              <div className="card h-100 border-0 rounded-4" style={{ backgroundColor: '#e0f2fe' }}>
                <div className="card-body p-4 text-dark">
                  <h5 className="card-title text-uppercase fw-bold" style={{ color: '#1f2937' }}>PROGRAM</h5>
                  <div style={{ height: '250px', position: 'relative' }}
                       onClick={(e) => {
                         const chart = programPieRef.current;
                         if (!chart) return;
                         const els = chart.getElementsAtEventForMode(e, 'nearest', { intersect: true }, true);
                         if (!els?.length) return;
                         const idx = els[0].index;
                         const label = programDistributionData.labels[idx];
                         if (label) navigate(`/cases?program=${encodeURIComponent(label)}`);
                       }}
                  >
                    <Pie ref={programPieRef} data={programDistributionData} options={pieOptions} />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default Dashboard;
