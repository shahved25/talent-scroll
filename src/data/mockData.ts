export interface Candidate {
  id: string;
  name: string;
  role: string;
  category: string;
  videoUrl: string;
  resumeUrl: string;
  thumbnailUrl?: string;
  skillTags: string[];
}

// Mock candidate data with placeholder videos and resumes
export const mockCandidates: Candidate[] = [
  // UI Designers
  {
    id: "1",
    name: "Sarah Chen",
    role: "Senior UI Designer",
    category: "ui-designer",
    videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",
    resumeUrl: "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf",
    thumbnailUrl: "https://picsum.photos/seed/sarah/400/600",
    skillTags: ["Figma", "User Research", "Prototyping", "Design Systems"],
  },
  {
    id: "2",
    name: "Alex Martinez",
    role: "UI/UX Designer",
    category: "ui-designer",
    videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4",
    resumeUrl: "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf",
    thumbnailUrl: "https://picsum.photos/seed/alex/400/600",
    skillTags: ["Sketch", "Adobe XD", "Wireframing", "Mobile Design"],
  },
  {
    id: "3",
    name: "Emily Johnson",
    role: "Product Designer",
    category: "ui-designer",
    videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4",
    resumeUrl: "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf",
    thumbnailUrl: "https://picsum.photos/seed/emily/400/600",
    skillTags: ["UI/UX", "Interaction Design", "Animation", "Figma"],
  },
  // Backend Engineers
  {
    id: "4",
    name: "Marcus Thompson",
    role: "Senior Backend Engineer",
    category: "backend-engineer",
    videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4",
    resumeUrl: "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf",
    thumbnailUrl: "https://picsum.photos/seed/marcus/400/600",
    skillTags: ["Node.js", "PostgreSQL", "Microservices", "AWS"],
  },
  {
    id: "5",
    name: "Priya Patel",
    role: "Backend Developer",
    category: "backend-engineer",
    videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4",
    resumeUrl: "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf",
    thumbnailUrl: "https://picsum.photos/seed/priya/400/600",
    skillTags: ["Python", "Django", "Redis", "Docker"],
  },
  {
    id: "6",
    name: "James Wilson",
    role: "Backend Architect",
    category: "backend-engineer",
    videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4",
    resumeUrl: "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf",
    thumbnailUrl: "https://picsum.photos/seed/james/400/600",
    skillTags: ["Java", "Spring Boot", "Kubernetes", "GraphQL"],
  },
  // Frontend Developers
  {
    id: "7",
    name: "Lisa Kim",
    role: "Senior Frontend Developer",
    category: "frontend-developer",
    videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerMeltdowns.mp4",
    resumeUrl: "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf",
    thumbnailUrl: "https://picsum.photos/seed/lisa/400/600",
    skillTags: ["React", "TypeScript", "Next.js", "Tailwind CSS"],
  },
  {
    id: "8",
    name: "David Brown",
    role: "Frontend Engineer",
    category: "frontend-developer",
    videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/Sintel.mp4",
    resumeUrl: "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf",
    thumbnailUrl: "https://picsum.photos/seed/david/400/600",
    skillTags: ["Vue.js", "JavaScript", "CSS3", "WebGL"],
  },
  {
    id: "9",
    name: "Anna Rodriguez",
    role: "Frontend Specialist",
    category: "frontend-developer",
    videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/SubaruOutbackOnStreetAndDirt.mp4",
    resumeUrl: "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf",
    thumbnailUrl: "https://picsum.photos/seed/anna/400/600",
    skillTags: ["Angular", "RxJS", "SCSS", "Performance"],
  },
  // Product Managers
  {
    id: "10",
    name: "Michael Lee",
    role: "Senior Product Manager",
    category: "product-manager",
    videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4",
    resumeUrl: "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf",
    thumbnailUrl: "https://picsum.photos/seed/michael/400/600",
    skillTags: ["Agile", "Product Strategy", "Analytics", "Stakeholder Management"],
  },
  {
    id: "11",
    name: "Rachel Green",
    role: "Product Manager",
    category: "product-manager",
    videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/VolkswagenGTIReview.mp4",
    resumeUrl: "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf",
    thumbnailUrl: "https://picsum.photos/seed/rachel/400/600",
    skillTags: ["Roadmapping", "User Stories", "Jira", "A/B Testing"],
  },
  {
    id: "12",
    name: "Kevin Nguyen",
    role: "Technical Product Manager",
    category: "product-manager",
    videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/WhatCarCanYouGetForAGrand.mp4",
    resumeUrl: "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf",
    thumbnailUrl: "https://picsum.photos/seed/kevin/400/600",
    skillTags: ["API Design", "Technical Writing", "SQL", "DevOps"],
  },
  // Data Scientists
  {
    id: "13",
    name: "Dr. Sophia Wang",
    role: "Senior Data Scientist",
    category: "data-scientist",
    videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",
    resumeUrl: "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf",
    thumbnailUrl: "https://picsum.photos/seed/sophia/400/600",
    skillTags: ["Python", "Machine Learning", "TensorFlow", "Statistics"],
  },
  {
    id: "14",
    name: "Carlos Garcia",
    role: "Data Scientist",
    category: "data-scientist",
    videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4",
    resumeUrl: "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf",
    thumbnailUrl: "https://picsum.photos/seed/carlos/400/600",
    skillTags: ["R", "Deep Learning", "NLP", "PyTorch"],
  },
  {
    id: "15",
    name: "Nina Patel",
    role: "ML Engineer",
    category: "data-scientist",
    videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4",
    resumeUrl: "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf",
    thumbnailUrl: "https://picsum.photos/seed/nina/400/600",
    skillTags: ["Python", "Scikit-learn", "Data Visualization", "SQL"],
  },
  // DevOps Engineers
  {
    id: "16",
    name: "Tom Anderson",
    role: "Senior DevOps Engineer",
    category: "devops-engineer",
    videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4",
    resumeUrl: "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf",
    thumbnailUrl: "https://picsum.photos/seed/tom/400/600",
    skillTags: ["Kubernetes", "Terraform", "CI/CD", "AWS"],
  },
  {
    id: "17",
    name: "Olivia Chen",
    role: "DevOps Engineer",
    category: "devops-engineer",
    videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4",
    resumeUrl: "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf",
    thumbnailUrl: "https://picsum.photos/seed/olivia/400/600",
    skillTags: ["Docker", "Jenkins", "Ansible", "Monitoring"],
  },
  {
    id: "18",
    name: "Ryan Mitchell",
    role: "Cloud Engineer",
    category: "devops-engineer",
    videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4",
    resumeUrl: "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf",
    thumbnailUrl: "https://picsum.photos/seed/ryan/400/600",
    skillTags: ["Azure", "Infrastructure as Code", "Security", "GitOps"],
  },
];

export const getCandidatesByCategory = (category: string): Candidate[] => {
  return mockCandidates.filter((candidate) => candidate.category === category);
};
