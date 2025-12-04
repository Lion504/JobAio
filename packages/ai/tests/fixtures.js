/**
 * Test fixtures for job analysis tests
 */

export const mockJobDescriptions = {
  softwareEngineer: `We are looking for a skilled Software Engineer to join our development team.

Responsibilities:
- Design and develop high-quality software solutions
- Collaborate with cross-functional teams
- Write clean, maintainable code
- Participate in code reviews

Requirements:
- Bachelor's degree in Computer Science or related field
- 3-5 years of experience in software development
- Proficiency in JavaScript, Node.js, and React
- Experience with SQL databases
- Knowledge of Agile methodologies

Nice to have:
- Experience with cloud platforms (AWS, Azure)
- Familiarity with Docker and Kubernetes
- Understanding of CI/CD pipelines`,

  juniorDeveloper: `Junior Developer Position Available

We're seeking a motivated Junior Developer to grow with our company.

Key Responsibilities:
- Assist in developing web applications
- Learn new technologies under guidance
- Participate in team meetings
- Help with testing and debugging

Requirements:
- Currently pursuing or recently completed Computer Science degree
- Basic knowledge of HTML, CSS, and JavaScript
- Understanding of version control (Git)
- Strong problem-solving skills
- Good communication abilities

Benefits:
- Mentorship program
- Training opportunities
- Flexible working hours`,

  seniorDataScientist: `Senior Data Scientist

Join our data science team to drive insights from complex datasets.

Responsibilities:
- Develop and deploy machine learning models
- Analyze large datasets using Python and R
- Create data visualizations and reports
- Collaborate with business stakeholders
- Mentor junior team members

Requirements:
- PhD or Master's in Data Science, Statistics, or related field
- 7+ years of experience in data science
- Expert knowledge of Python, R, SQL
- Experience with TensorFlow, PyTorch, or similar
- Strong statistical analysis skills
- Experience leading projects

Preferred:
- Publications in data science journals
- Experience with big data technologies
- Knowledge of MLOps practices`,

  internship: `Summer Internship - Marketing Assistant

We're offering a fantastic opportunity for marketing students to gain real-world experience.

What you'll do:
- Assist with social media content creation
- Help analyze marketing campaign performance
- Support event planning and coordination
- Conduct market research

Requirements:
- Currently enrolled in Marketing, Business, or Communications program
- Basic knowledge of social media platforms
- Proficiency in Microsoft Office or Google Workspace
- Creative mindset and attention to detail
- Ability to work 20-30 hours per week during summer

What we offer:
- Competitive internship stipend
- Flexible schedule
- Professional development workshops
- Letter of recommendation upon completion`,

  partTimeSupport: `Part-Time Technical Support Specialist

We're looking for a reliable Technical Support Specialist for our evening shift.

Duties:
- Provide technical assistance to customers via phone and chat
- Troubleshoot hardware and software issues
- Document support cases and solutions
- Escalate complex issues to senior staff

Requirements:
- High school diploma or equivalent
- 1-2 years of customer service experience
- Basic computer skills and troubleshooting knowledge
- Excellent communication skills
- Availability for evening shifts (4 PM - 12 AM)

Preferred:
- CompTIA A+ certification
- Experience with help desk software
- Knowledge of Windows and macOS operating systems`,
};

export const expectedResults = {
  softwareEngineer: {
    jobType: "full-time",
    experienceLevel: "junior",
    educationLevel: "bachelor",
    languages: { required: ["English"], advantage: [] },
    skills: {
      technical: ["JavaScript", "Node.js", "React", "SQL"],
      domain_specific: ["Agile methodologies"],
      certifications: [],
      soft_skills: [],
      other: ["AWS", "Azure", "Docker", "Kubernetes", "CI/CD"],
    },
    responsibilities: [
      "Design and develop high-quality software solutions",
      "Collaborate with cross-functional teams",
      "Write clean, maintainable code",
      "Participate in code reviews",
    ],
  },

  juniorDeveloper: {
    jobType: "full-time",
    experienceLevel: "student",
    educationLevel: "bachelor",
    languages: { required: ["English"], advantage: [] },
    skills: {
      technical: ["HTML", "CSS", "JavaScript", "Git"],
      domain_specific: [],
      certifications: [],
      soft_skills: ["problem-solving skills", "communication abilities"],
      other: [],
    },
    responsibilities: [
      "Assist in developing web applications",
      "Learn new technologies under guidance",
      "Participate in team meetings",
      "Help with testing and debugging",
    ],
  },
};
