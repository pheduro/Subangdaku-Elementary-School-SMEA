/* Subangdaku ES SMEA data - SY 2026-2027, Term 1.
   Source: "Subangdaku ES SMEA SY 2026-2027" Drive folder.
   Only Subangdaku rows are used. Rows labeled SY 2021-2022 / 2023-2024 (division templates) are excluded.
   Edit this file to update the site; pages render from it. */
window.SMEA = {
  school: "Subangdaku Elementary School",
  district: "South District, Mandaue City Division",
  schoolId: "120006",
  address: "Lopez Jaena St., Subangdaku, Mandaue City",
  level: "Elementary",
  districtName: "South District",
  division: "Division of Mandaue City",
  sy: "SY 2026–2027",
  term: "Term 1",

  enrollment: {
    levels: [["Kinder",198],["Grade 1",281],["Grade 2",227],["Grade 3",276],["Grade 4",279],["Grade 5",297],["Grade 6",271],["SPED",19]],
    total: 1848,
    // LPN sheet uses 1,829 (Kinder to Grade 6, SPED excluded)
    withoutSped: 1829
  },

  // CRLA, Term 1 (T1). Categories in order low -> grade level.
  crla: {
    categories: ["Low Emerging","High Emerging","Developing","Transitioning","At Grade Level"],
    rows: [
      {name:"English, Grade 3", enrolment:276, t1:[61,14,28,72,101]},
      {name:"Filipino, Grade 2", enrolment:228, t1:[49,4,75,69,31]},
      {name:"Mother Tongue, Grade 1", enrolment:285, t1:[251,22,10,2,0]}
    ],
    pending: ["Mother Tongue, Grade 2 (values duplicate the Filipino Grade 2 row; needs checking)","Mother Tongue, Grade 3 (blank)"]
  },

  // PHIL-IRI: Subangdaku rows are blank in the workbook.
  philiri: { available:false },

  // Learners with Poor Nutrition, Term 1 (Wasted / Severely Wasted)
  lpn: {
    enrolment: 1829,
    rows: [["Kinder",198,11,1],["Grade 1",281,3,6],["Grade 2",227,5,0],["Grade 3",276,9,2],["Grade 4",279,5,4],["Grade 5",297,17,3],["Grade 6",271,10,0]]
  },

  // LARDOs, dropouts, subject failures: Term 1 entries are 0 for Subangdaku; Term 2 and 3 not yet due.
  outcomes: {
    lardos: 0, dropouts: 0, failures: 0,
    note: "Term 1 entries in the Guidance and Master Teacher workbooks are all zero. Term 2 and Term 3 are not yet reported."
  },

  blics: [
    {grade:"All Grade Levels", priority:"High", issue:"Limited awareness among some learners on child protection, gender-based concerns, bullying, and appropriate ways of reporting incidents.", policy:"DepEd Order No. 40, s. 2012 (Child Protection Policy); RA 10627 (Anti-Bullying Act); GAD Program; Child Protection Program", school:"Include GAD, CPC, and Pink Room concerns in LAC sessions, orientations, and school-based capability-building activities.", rftat:"Conduct age-appropriate orientation and classroom advocacy on learners' rights, anti-bullying, gender sensitivity, safe spaces, and reporting. Strengthen information dissemination through the CPC and Pink Room.", status:"Ongoing Validation"},
    {grade:"Grade 5", priority:"High", issue:"Difficulty in solving Math problems, particularly order of operations and fundamental operations.", policy:"MATATAG Curriculum; ARAL Program", status:"Awaiting response"},
    {grade:"Grade 5", priority:"High", issue:"Some learners have difficulty reading and comprehending grade-level texts.", policy:"MATATAG Curriculum; ARAL Program", status:"Awaiting response"},
    {grade:"Grade 5", priority:"Medium", issue:"Irregular attendance of some learners affects academic performance and completion of learning tasks.", policy:"School-Based Attendance Monitoring; Child Protection Policy", status:"Awaiting response"}
  ],

  practices: [
    {area:"Learning and Development", grade:"All Grade Levels", title:"Mid-year INSET 2026: Empowering Teachers for Learner-Centered Excellence (differentiated instruction, ICT/AI-integrated resources, higher-order thinking skills)", policy:"DepEd Order No. 35, s. 2016 (LAC); DepEd Order 012, s. 2025; MATATAG Curriculum Agenda", school:"Aligned with PPST indicators 1.5, 3.1.2, 4.5.2. Recommended for institutionalization as a school-based professional development model every mid-year and year-end INSET.", rftat:"Validates that the practice addresses least-mastered PPST indicators from SMEA. Recommends post-INSET classroom observation and impact evaluation.", status:"Ongoing validation: 100% teacher participation, documentation complete. Good practice for SBM Level 3, Human Resource and Team Development."},
    {area:"Learning and Development", grade:"Grade 3 teachers and relieving teachers", title:"Term 1 Classroom Observation", policy:"DepEd Order No. 42, s. 2017; DepEd Order No. 2, s. 2015; DepEd Order No. 40, s. 2020; BEMEF Access: Quality of Teaching and Learning; SBM Principle 1", school:"PPST Domains 1 to 5; indicators 1.5.2, 3.1.2, 4.5.2", rftat:"Validates that classroom observation ensures transfer of learning from INSET and LAC sessions.", status:"COT conducted with 100% compliance"},
    {area:"Learning and Development", grade:"Grade 3 teachers and relieving teachers", title:"Term 1 LAC Session", status:"Conducted"},
    {area:"Learner Protection", grade:"All Grade Levels", title:"Collaborative referral and monitoring of learner concerns through the GAD–CPC–Pink Room team, coordinated with parents/guardians and stakeholders.", policy:"Child Protection Policy; GAD; School Child Protection mechanisms", school:"Enhancement: strengthen documentation, referral pathways, confidentiality, and follow-up.", rftat:"Validation and enhancement: sustain the coordinated approach and strengthen stakeholder participation.", status:"Ongoing Validation"},
    {area:"Mathematics", grade:"Grade 5", title:"Use of concrete and visual representations in teaching difficult mathematical concepts", policy:"MATATAG Math Curriculum; differentiated instruction", school:"Document effective manipulatives, models, and visual strategies used during lessons.", rftat:"Validation and enhancement: strengthen the concrete-pictorial-abstract approach.", status:"For validation and enhancement"},
    {area:"Science", grade:"Grade 5", title:"Hands-on investigations and simple experiments", policy:"MATATAG Science Curriculum; inquiry-based learning", school:"Document experiments, learner observations, and outputs; ensure safety procedures.", rftat:"Validation and enhancement: strengthen inquiry-based and experimental learning.", status:"For validation and enhancement"},
    {area:"EPP / TLE", grade:"Grade 5", title:"Performance-based assessment through actual product creation and demonstrations", policy:"Assessment Guidelines; EPP/TLE performance standards", school:"Validate rubrics and learner products; strengthen the feedback mechanism.", rftat:"Enhancement", status:"For enhancement"}
  ],

  slides: [
    ["1. Term 1 SMEA: Guidance Report","https://drive.google.com/file/d/1rgiKoNwuCodwyOm0UGQ5_5v7rwM-PlaL/view","Guidance"],
    ["1.1 Kindergarten","https://drive.google.com/file/d/1IqrWmCQsjseZ7mBgVhMfu9zvmZ3onn0P/view","Kindergarten"],
    ["2. English","https://drive.google.com/file/d/1BJrln41IIP59NaPsng2-jnKrsf1GIBki/view","Subject"],
    ["3. Filipino","https://drive.google.com/file/d/1HSndYLm_Oh8nefy-4mF5z8fOP-VkbXqF/view","Subject"],
    ["4. Mathematics","https://drive.google.com/file/d/1sx3MP3LHqsvWOTmRgI-z66RbkXDTaImw/view","Subject"],
    ["5. Science","https://drive.google.com/file/d/12Ofzw0XSd8Qq6upFiwKlcCrKy0-oX2DL/view","Subject"],
    ["6. Makabansa / AP","https://drive.google.com/file/d/1pcp89ENDqLPf3TfBiJidaf7PP5aX3KWS/view","Subject"],
    ["7. EsP / GMRC (with least learned)","https://drive.google.com/file/d/1TQsXpWZSxuA43bQLj1cWyzTEnPGzlWIV/view","Subject"],
    ["8. EPP","https://drive.google.com/file/d/1QE3tfTTxvvDTHjt1Ve83YoAE_3yNVu04/view","Subject"],
    ["9. MAPEH","https://drive.google.com/file/d/1QaYSQZwNYmoq8ZW5kreQCYkHXzZ6Cejc/view","Subject"],
    ["First Term SMEA Conference Program 2026–2027","https://drive.google.com/file/d/1KboIMhrU1e1rKH0ywT62QZ4X_jgyhK6u/view","Program"]
  ]
};
