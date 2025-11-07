import React, { useState } from 'react';
import educationImg from '../assets/education-support.jpg';
//import mentalHealthImg from '../assets/mental-health-support.jpg';
//import sportsImg from '../assets/sports-recreation.jpg';
//import afterCareImg from '../assets/after-care.jpg';

// Program component displays available services for children in conflict with the law
const Program = () => {
  // High-quality fallback images in case the imports don't work
  const fallbackImages = {
    education: 'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?ixlib=rb-1.2.1&auto=format&fit=crop&w=1000&q=80',
    mentalHealth: 'https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?ixlib=rb-1.2.1&auto=format&fit=crop&w=1000&q=80',
    sports: 'https://images.unsplash.com/photo-1517649763962-0c623066013b?ixlib=rb-1.2.1&auto=format&fit=crop&w=1000&q=80',
    afterCare: 'https://images.unsplash.com/photo-1516534775068-ba3e7458af70?ixlib=rb-1.2.1&auto=format&fit=crop&w=1000&q=80'
  };

  // State to track which program is being hovered or expanded
  const [expandedProgram, setExpandedProgram] = useState(null);

  // Program categories with detailed services
  const programs = [
    {
      id: 1,
      title: "Children's Welfare and Development",
      image: educationImg || fallbackImages.education,
      description: 'Residential homes for girls.',
      sectionTitle: 'Residential Homes',
      items: [
        'Blessed Rosalie Rendu (girls)',
        'Blessed Marguerite Rutan (girls)',
        'Blessed Marta Anna Wiecka (girls)'
      ],
      ages: 'Ages 5–17 years old'
    },
    {
      id: 2,
      title: 'Youth Welfare and Development',
      image: fallbackImages.sports,
      description: 'Residential homes for youth.',
      sectionTitle: 'Residential Homes',
      items: [
        'Sor Asuncion Ventura (female)',
        'St. Vincent de Paul (male)'
      ],
      ages: 'Ages 17–25 years old'
    },
    {
      id: 3,
      title: 'Crisis Intervention (Individual / Family)',
      image: fallbackImages.mentalHealth,
      description: 'Temporary shelter and assistance services.',
      sectionTitle: 'Temporary Shelter',
      items: [
        'St. Elizabeth Ann Seton',
        'Indigent sick persons from provinces seeking medication in Manila',
        'Repatriated OFW',
        'Survivor of Human Trafficking'
      ]
    },
    {
      id: 4,
      title: 'Follow up / After Care',
      image: fallbackImages.afterCare,
      description: 'Post-discharge support, monitoring, and reintegration services.',
      sectionTitle: 'Post-Discharge Support',
      items: [
        'Home visits and monitoring',
        'Counseling and psychosocial support',
        'Education and employment referrals',
        'Community reintegration assistance'
      ]
    }
  ];

  // Toggle program expansion
  const toggleProgram = (id) => {
    setExpandedProgram(expandedProgram === id ? null : id);
  };

  return (
    <div className="container-fluid py-5">
      <h2 className="mb-4 border-bottom pb-3 text-dark">Programs</h2>
      
      <div className="d-flex flex-column gap-4">
        {programs.map(program => (
          <div  
            key={program.id}
            className="program-card rounded-4 overflow-hidden position-relative shadow-sm"
            style={{ 
              height: expandedProgram === program.id ? 'auto' : '120px',
              transition: 'all 0.3s ease-in-out',
              cursor: 'pointer'
            }}
            onClick={() => toggleProgram(program.id)}
          >
            {/* Background Image with overlay */}
            <div 
              className="position-absolute w-100 h-100" 
              style={{
                backgroundImage: `url(${program.image})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                filter: 'brightness(0.7)',
                backgroundColor: '#e0f2fe', // Fallback color
                transition: 'all 0.3s ease'
              }}
            ></div>
            
            {/* Program Title and Description */}
            <div className="position-relative h-100 d-flex flex-column justify-content-center px-4">
              <h3 className="text-white fw-bold mb-2">{program.title}</h3>
              {expandedProgram !== program.id && (
                <p className="text-white mb-0 d-none d-md-block">{program.description}</p>
              )}
            </div>
            
            {/* Program Services - Shown when expanded */}
            {expandedProgram === program.id && (
              <div className="position-relative bg-white p-4">
                <h4 className="mb-3 text-primary border-bottom pb-2">{program.sectionTitle || `${program.title} Services`}</h4>
                <p className="text-muted mb-3">{program.description}</p>
                <ul className="list-group list-group-flush">
                  {(program.items || program.services).map((item, index) => (
                    <li 
                      key={index} 
                      className="list-group-item bg-transparent px-0"
                    >
                      <i className="bi bi-check-circle-fill text-success me-2"></i>
                      {item}
                    </li>
                  ))}
                </ul>
                {program.ages && (
                  <p className="text-muted fst-italic mt-3">{program.ages}</p>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default Program;