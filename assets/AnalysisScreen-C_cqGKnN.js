import{u as xe,r as o,d as $,j as t}from"./index-BU2jcHjm.js";import{a as he}from"./grading-CnuXgHGN.js";const ue=()=>{const[e,x]=o.useState(window.innerWidth<768),[h,j]=o.useState(window.innerWidth>=768&&window.innerWidth<1024),[m,P]=o.useState(window.innerWidth>=1024);return o.useEffect(()=>{const d=()=>{const y=window.innerWidth;x(y<768),j(y>=768&&y<1024),P(y>=1024)};return window.addEventListener("resize",d),()=>window.removeEventListener("resize",d)},[]),{isMobile:e,isTablet:h,isDesktop:m}},fe={bg:"#F9FAFB",surface:"#FFFFFF",surfaceAlt:"#F3F4F6",border:"#E5E7EB",text:"#111827",textMuted:"#6B7280",accent:"#10B981",accentLighter:"#ECFDF5",red:"#EF4444",redBg:"#FEE2E2",shadow:"rgba(17, 24, 39, 0.04)"},pe={bg:"#0F172A",surface:"#1E293B",surfaceAlt:"#334155",border:"#475569",text:"#F1F5F9",textMuted:"#94A3B8",accent:"#10B981",accentLighter:"#052E16",red:"#F87171",redBg:"#7F1D1D",shadow:"rgba(0, 0, 0, 0.2)"},me=(e,x,h,j,m="School Report")=>{const P=new Date().toLocaleDateString("en-US",{year:"numeric",month:"short",day:"numeric"});return`
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>Analytics Report - ${x}</title>
      <style>
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        
        html, body {
          width: 100%;
          height: 100%;
        }
        
        body {
          font-family: 'Segoe UI', Arial, sans-serif;
          color: #333;
          line-height: 1.4;
          font-size: 11px;
          background: white;
        }
        
        @page {
          size: A4;
          margin: 0.4in;
        }
        
        .container {
          width: 100%;
          max-width: 8.5in;
          margin: 0 auto;
          padding: 0;
        }
        
        /* Header */
        .header {
          background: linear-gradient(135deg, #059669 0%, #10B981 100%);
          color: white;
          padding: 14px 16px;
          border-radius: 4px;
          margin-bottom: 10px;
          text-align: center;
          box-shadow: 0 2px 8px rgba(5, 150, 105, 0.2);
        }
        
        .header h1 {
          font-size: 18px;
          margin: 0 0 4px 0;
          font-weight: 800;
          letter-spacing: 0.5px;
          text-transform: uppercase;
        }
        
        .header .subtitle {
          font-size: 11px;
          opacity: 0.95;
          margin: 0 0 3px 0;
          font-weight: 600;
        }
        
        .header .date {
          font-size: 9px;
          opacity: 0.85;
          margin: 0;
          font-weight: 500;
        }
        
        /* School Info Grid */
        .info-grid {
          display: grid;
          grid-template-columns: 1fr 1fr 1fr 1fr;
          gap: 4px;
          margin-bottom: 8px;
          padding: 6px;
          background: #f9fafb;
          border-radius: 3px;
          border-left: 3px solid #10B981;
          text-align: center;
        }
        
        .info-label {
          font-size: 8px;
          color: #6b7280;
          text-transform: uppercase;
          font-weight: 700;
          margin-bottom: 2px;
          letter-spacing: 0.3px;
        }
        
        .info-value {
          font-size: 14px;
          font-weight: 700;
          color: #1f2937;
        }
        
        /* Section Title */
        .section-title {
          font-size: 11px;
          font-weight: 700;
          color: #1f2937;
          margin-top: 6px;
          margin-bottom: 4px;
          padding-bottom: 2px;
          border-bottom: 2px solid #10B981;
          text-transform: uppercase;
          letter-spacing: 0.4px;
        }
        
        /* Summary Grid */
        .summary-grid {
          display: grid;
          grid-template-columns: 1fr 1fr 1fr;
          gap: 4px;
          margin-bottom: 8px;
        }
        
        .summary-card {
          background: linear-gradient(135deg, #f0fdf4 0%, #ecfdf5 100%);
          padding: 8px 10px;
          border-radius: 4px;
          border-left: 3px solid #10B981;
          border: 1px solid #d1fae5;
          text-align: center;
          box-shadow: 0 1px 3px rgba(5, 150, 105, 0.1);
        }
        
        .card-label {
          font-size: 8px;
          color: #6b7280;
          font-weight: 700;
          margin-bottom: 2px;
          text-transform: uppercase;
        }
        
        .card-value {
          font-size: 14px;
          font-weight: 800;
          color: #1f2937;
          line-height: 1.2;
        }
        
        .card-subtitle {
          font-size: 8px;
          color: #9ca3af;
          margin-top: 2px;
        }
        
        /* Gender Boxes */
        .gender-boxes {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 4px;
          margin-bottom: 8px;
        }
        
        .gender-box {
          background: #f9fafb;
          padding: 8px 10px;
          border-radius: 4px;
          border: 1.5px solid #e5e7eb;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
        }
        
        .gender-box h3 {
          font-size: 11px;
          font-weight: 700;
          margin-bottom: 6px;
          color: #059669;
          text-align: center;
          border-bottom: 2px solid #d1fae5;
          padding-bottom: 4px;
        }
        
        .gender-stat {
          display: flex;
          justify-content: space-between;
          padding: 3px 0;
          border-bottom: 1px solid #e5e7eb;
          font-size: 9px;
        }
        
        .gender-stat:last-child {
          border-bottom: none;
        }
        
        .stat-label {
          color: #6b7280;
          font-weight: 600;
        }
        
        .stat-value {
          font-weight: 700;
          color: #10B981;
        }
        
        /* Tables */
        table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 8px;
          font-size: 9px;
          border: 1px solid #e5e7eb;
          border-radius: 4px;
          overflow: hidden;
        }
        
        table thead {
          background: linear-gradient(135deg, #059669 0%, #10B981 100%);
        }
        
        table th {
          padding: 6px 8px;
          text-align: left;
          font-weight: 700;
          color: white;
          border-bottom: 2px solid #059669;
          font-size: 8.5px;
          text-transform: uppercase;
          letter-spacing: 0.3px;
        }
        
        table td {
          padding: 4px;
          color: #374151;
          border-bottom: 1px solid #e5e7eb;
        }
        
        table tbody tr:nth-child(even) {
          background: #f9fafb;
        }
        
        .text-center {
          text-align: center;
        }
        
        .text-right {
          text-align: right;
        }
        
        /* Criteria Box */
        .criteria-box {
          background: linear-gradient(135deg, #f0fdf4 0%, #ecfdf5 100%);
          border: 1.5px solid #d1fae5;
          padding: 10px 12px;
          border-radius: 4px;
          margin-top: 8px;
          font-size: 9px;
          box-shadow: 0 2px 4px rgba(5, 150, 105, 0.1);
        }
        
        .criteria-box h3 {
          font-size: 11px;
          font-weight: 700;
          color: #059669;
          margin-bottom: 8px;
          text-align: center;
          text-transform: uppercase;
          letter-spacing: 0.3px;
        }
        
        .criteria-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 6px;
        }
        
        .criteria-section h4 {
          font-size: 9px;
          font-weight: 700;
          color: #059669;
          margin-bottom: 3px;
          text-align: center;
        }
        
        .criteria-section ul {
          list-style: none;
          margin: 0;
          padding: 0;
        }
        
        .criteria-section li {
          padding: 2px 0 2px 10px;
          position: relative;
          font-size: 8px;
          color: #374151;
        }
        
        .criteria-section li:before {
          content: "•";
          position: absolute;
          left: 3px;
          color: #10B981;
          font-weight: bold;
        }
        
        /* Footer */
        .footer {
          margin-top: 6px;
          padding-top: 6px;
          border-top: 1px solid #e5e7eb;
          text-align: center;
          font-size: 8px;
          color: #6b7280;
        }
        
        @media print {
          body {
            margin: 0;
            padding: 0;
            background: white;
          }
        }
      </style>
    </head>
    <body>
      <div class="container">
        <!-- Header -->
        <div class="header">
          <h1>${m.toUpperCase()}</h1>
          <p class="subtitle">📊 CLASS ANALYTICS REPORT</p>
          <p class="subtitle" style="font-size: 9px; margin-top: 2px;">RankIT ZM - School Management System</p>
          <p class="date">${P}</p>
        </div>
        
        <!-- School Info -->
        <div class="info-grid">
          <div>
            <div class="info-label">Class</div>
            <div class="info-value">${x}</div>
          </div>
          <div>
            <div class="info-label">Level</div>
            <div class="info-value">${h}</div>
          </div>
          <div>
            <div class="info-label">Total Students</div>
            <div class="info-value">${e.totalStudents}</div>
          </div>
          <div>
            <div class="info-label">Term</div>
            <div class="info-value">${j}</div>
          </div>
        </div>
        
        <!-- Overall Summary -->
        <h2 class="section-title">OVERALL SUMMARY</h2>
        <div class="summary-grid">
          <div class="summary-card">
            <div class="card-label">Present</div>
            <div class="card-value">${e.studentsPresent}</div>
            <div class="card-subtitle">Absent: ${e.studentsAbsent}</div>
          </div>
          <div class="summary-card">
            <div class="card-label">Pass Rate</div>
            <div class="card-value">${e.quantityPassRate.toFixed(1)}%</div>
            <div class="card-subtitle">${e.totalPassed} passed</div>
          </div>
          <div class="summary-card">
            <div class="card-label">Quality Pass</div>
            <div class="card-value">${e.qualityPassRate.toFixed(1)}%</div>
            <div class="card-subtitle">Grade 2+/4+</div>
          </div>
        </div>
        
        <!-- Gender Performance -->
        <h2 class="section-title">GENDER PERFORMANCE</h2>
        <div class="gender-boxes">
          <div class="gender-box">
            <h3>👨 Male (${e.maleCount})</h3>
            <div class="gender-stat">
              <span class="stat-label">Quality Pass</span>
              <span class="stat-value">${e.maleCount>0?(e.maleQualityPass/e.maleCount*100).toFixed(1):0}%</span>
            </div>
            <div class="gender-stat">
              <span class="stat-label">Quantity Pass</span>
              <span class="stat-value">${e.maleCount>0?(e.maleQuantityPass/e.maleCount*100).toFixed(1):0}%</span>
            </div>
          </div>
          <div class="gender-box">
            <h3>👩 Female (${e.femaleCount})</h3>
            <div class="gender-stat">
              <span class="stat-label">Quality Pass</span>
              <span class="stat-value">${e.femaleCount>0?(e.femaleQualityPass/e.femaleCount*100).toFixed(1):0}%</span>
            </div>
            <div class="gender-stat">
              <span class="stat-label">Quantity Pass</span>
              <span class="stat-value">${e.femaleCount>0?(e.femaleQuantityPass/e.femaleCount*100).toFixed(1):0}%</span>
            </div>
          </div>
        </div>
        
        <!-- Subject Analysis -->
        <h2 class="section-title">SUBJECT ANALYSIS (Top 5)</h2>
        <table>
          <thead>
            <tr>
              <th>Subject</th>
              <th class="text-center">Qty %</th>
              <th class="text-center">Qty %</th>
              <th class="text-center">High</th>
              <th class="text-center">Low</th>
            </tr>
          </thead>
          <tbody>
            ${e.subjectAnalysis.slice(0,5).map(d=>`
              <tr>
                <td>${d.name}</td>
                <td class="text-center">${d.quantityPassRate.toFixed(0)}%</td>
                <td class="text-center">${d.qualityPassRate.toFixed(0)}%</td>
                <td class="text-right">${d.highestScore.toFixed(0)}</td>
                <td class="text-right">${d.lowestScore.toFixed(0)}</td>
              </tr>
            `).join("")}
          </tbody>
        </table>
        
        <!-- Grade Distribution -->
        <h2 class="section-title">GRADE DISTRIBUTION</h2>
        <table>
          <thead>
            <tr>
              <th>Grade</th>
              <th class="text-center">Range</th>
              <th class="text-center">Students</th>
              <th class="text-center">%</th>
            </tr>
          </thead>
          <tbody>
            ${e.qualityPassBreakdown.map(d=>`
              <tr>
                <td><strong>${d.grade}</strong></td>
                <td class="text-center">${d.range}</td>
                <td class="text-center">${d.students}</td>
                <td class="text-right"><strong>${d.percentage.toFixed(1)}%</strong></td>
              </tr>
            `).join("")}
          </tbody>
        </table>
        
        <!-- Criteria -->
        <div class="criteria-box">
          <h3>📋 PASSING CRITERIA (ZAMBIAN EDUCATION)</h3>
          <div class="criteria-grid">
            <div class="criteria-section">
              <h4>PRIMARY (JSSLC)</h4>
              <ul>
                <li>Pass: ≥50 total marks</li>
                <li>Quality: ≥60% avg</li>
                <li>Grade 1: 75%+</li>
                <li>Grade 2: 60-74%</li>
              </ul>
            </div>
            <div class="criteria-section">
              <h4>SECONDARY (School Cert)</h4>
              <ul>
                <li>Pass: 6+ subjects</li>
                <li>Quality: ≥60% avg</li>
                <li>Grade 1: 75%+</li>
                <li>Grade 4: 60-64%</li>
              </ul>
            </div>
          </div>
        </div>
        
        <!-- Footer -->
        <div class="footer">
          <p>RankIT ZM | School Management System | For inquiries contact school administration</p>
        </div>
      </div>
    </body>
    </html>
  `};function ye(){xe();const{isMobile:e,isTablet:x}=ue(),[h,j]=o.useState(!1),[m,P]=o.useState([]),[d,y]=o.useState([]),[W,Y]=o.useState([]),[B,J]=o.useState([]),[S,k]=o.useState(null),[w,X]=o.useState(""),[l,Z]=o.useState(null),[V,G]=o.useState(!0),[F,E]=o.useState(!1),a=h?pe:fe,u=o.useMemo(()=>m.find(i=>i.id===S)||null,[m,S]),L=(u==null?void 0:u.educationLevel)||"secondary";o.useEffect(()=>{_()},[]),o.useEffect(()=>{S&&K()},[S,w,d,W,B,m]);const _=async()=>{try{G(!0);const[i,c,g,b]=await Promise.all([$.getAllClasses(),$.getAllLearners(),$.getAllScores(),$.getAllSubjects()]);P(i),y(c),Y(g),J(b),i.length>0&&k(i[0].id||null)}catch(i){console.error("Error loading data:",i)}finally{G(!1)}},K=()=>{if(!u)return;const i=d.filter(s=>s.classId===S),c=new Set(i.map(s=>s.id).filter(s=>s!=null)),g=W.filter(s=>c.has(s.learnerId)&&(!w||s.term===w)),b=i.length,z=new Set(g.map(s=>s.learnerId)).size,te=b-z,se=i.filter(s=>{var n;return((n=s.gender)==null?void 0:n.toLowerCase())==="male"}).length,ae=i.filter(s=>{var n;return((n=s.gender)==null?void 0:n.toLowerCase())==="female"}).length,D=he(L),Q=new Map;i.forEach(s=>{if(s.id){const n=g.filter(f=>f.learnerId===s.id);if(n.length>0){const f=n.reduce((U,R)=>U+R.score,0),A=f/n.length;let v=!1,T=!1,I=0;D?(v=f>=50,T=A>=60):(I=new Set(n.filter(R=>R.score>=40).map(R=>R.subjectId)).size,v=I>=6,T=A>=60),Q.set(s.id,{learnerId:s.id,avgScore:A,gender:s.gender,subjectsPassedCount:I,totalMarks:f,hasPassed:v,isQualityPass:T})}}});const r=Array.from(Q.values()),M=r.filter(s=>s.hasPassed).length,ie=r.length-M,re=r.filter(s=>s.isQualityPass).length,q=r.filter(s=>{var n;return((n=s.gender)==null?void 0:n.toLowerCase())==="male"}),N=r.filter(s=>{var n;return((n=s.gender)==null?void 0:n.toLowerCase())==="female"}),ne=q.filter(s=>s.hasPassed).length,le=q.filter(s=>s.isQualityPass).length,oe=N.filter(s=>s.hasPassed).length,de=N.filter(s=>s.isQualityPass).length,C=new Map;g.forEach(s=>{if(!C.has(s.subjectId)){const n=B.find(f=>f.id===s.subjectId);C.set(s.subjectId,{scores:[],name:(n==null?void 0:n.subjectName)||`Subject ${s.subjectId}`})}C.get(s.subjectId).scores.push(s.score)});let ce=60;const ge=Array.from(C.entries()).map(([,{scores:s,name:n}])=>{const f=s.filter(v=>v>=40).length,A=s.filter(v=>v>=ce).length;return{name:n,quantityPassRate:f/s.length*100,qualityPassRate:A/s.length*100,highestScore:Math.max(...s),lowestScore:Math.min(...s)}}).sort((s,n)=>n.qualityPassRate-s.qualityPassRate),O=D?[{grade:"Grade 1 (75-100%)",range:"75%+",students:r.filter(s=>s.avgScore>=75).length,percentage:0},{grade:"Grade 2 (60-74%)",range:"60-74%",students:r.filter(s=>s.avgScore>=60&&s.avgScore<75).length,percentage:0},{grade:"Grade 3 (50-59%)",range:"50-59%",students:r.filter(s=>s.avgScore>=50&&s.avgScore<60).length,percentage:0},{grade:"Grade 4 (40-49%)",range:"40-49%",students:r.filter(s=>s.avgScore>=40&&s.avgScore<50).length,percentage:0},{grade:"Fail (0-39%)",range:"0-39%",students:r.filter(s=>s.avgScore<40).length,percentage:0}]:[{grade:"Grade 1 (75-100%)",range:"75-100%",students:r.filter(s=>s.avgScore>=75).length,percentage:0},{grade:"Grade 2 (70-74%)",range:"70-74%",students:r.filter(s=>s.avgScore>=70&&s.avgScore<75).length,percentage:0},{grade:"Grade 3 (65-69%)",range:"65-69%",students:r.filter(s=>s.avgScore>=65&&s.avgScore<70).length,percentage:0},{grade:"Grade 4 (60-64%)",range:"60-64%",students:r.filter(s=>s.avgScore>=60&&s.avgScore<65).length,percentage:0},{grade:"Grade 5 (55-59%)",range:"55-59%",students:r.filter(s=>s.avgScore>=55&&s.avgScore<60).length,percentage:0},{grade:"Grade 6 (50-54%)",range:"50-54%",students:r.filter(s=>s.avgScore>=50&&s.avgScore<55).length,percentage:0},{grade:"Grade 7 (45-49%)",range:"45-49%",students:r.filter(s=>s.avgScore>=45&&s.avgScore<50).length,percentage:0},{grade:"Grade 8 (40-44%)",range:"40-44%",students:r.filter(s=>s.avgScore>=40&&s.avgScore<45).length,percentage:0},{grade:"Grade 9 (0-39%)",range:"0-39%",students:r.filter(s=>s.avgScore<40).length,percentage:0}];O.forEach(s=>{s.percentage=r.length>0?s.students/r.length*100:0}),Z({totalStudents:b,studentsPresent:z,studentsAbsent:te,maleCount:se,femaleCount:ae,totalPassed:M,totalFailed:ie,qualityPassRate:r.length>0?re/r.length*100:0,quantityPassRate:r.length>0?M/r.length*100:0,maleQualityPass:le,maleQuantityPass:ne,femaleQualityPass:de,femaleQuantityPass:oe,subjectAnalysis:ge,qualityPassBreakdown:O})},ee=async()=>{if(!(!l||!u)){E(!0);try{let i="School Report";try{const g=localStorage.getItem("rankitz-school-settings");g&&(i=JSON.parse(g).schoolName||"School Report")}catch(g){console.warn("Failed to get school name from cache:",g)}const c=document.createElement("script");c.src="https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js",c.onload=()=>{const g=me(l,u.className,L,w||"All Terms",i),b=document.createElement("div");b.innerHTML=g;const z=`Analytics_${u.className}_${new Date().getTime()}.pdf`;window.html2pdf().set({margin:.3,filename:z,image:{type:"jpeg",quality:.98},html2canvas:{scale:2,useCORS:!0},jsPDF:{format:"a4",orientation:"portrait"}}).from(b).save(),E(!1)},document.head.appendChild(c)}catch(i){console.error("Error exporting PDF:",i),E(!1)}}};return t.jsxs("div",{style:{background:a.bg,color:a.text,minHeight:"100vh",padding:e?"16px":x?"18px":"20px",fontFamily:"'Inter', system-ui, sans-serif"},children:[t.jsxs("div",{style:{marginBottom:e?20:30,display:"flex",justifyContent:"space-between",alignItems:e?"flex-start":"center",flexDirection:e?"column":"row",gap:e?12:0},children:[t.jsxs("div",{children:[t.jsx("h1",{style:{fontSize:e?24:32,fontWeight:800,margin:"0 0 10px 0"},children:"Analytics Report"}),t.jsx("p",{style:{fontSize:e?12:14,color:a.textMuted,margin:0},children:"Comprehensive class performance analysis"})]}),t.jsxs("div",{style:{display:"flex",gap:10},children:[l&&u&&t.jsx("button",{onClick:ee,disabled:F,style:{padding:e?"9px 12px":"10px 16px",borderRadius:8,border:"none",background:a.accent,color:"white",cursor:F?"not-allowed":"pointer",fontWeight:600,fontSize:e?11:13,opacity:F?.7:1,whiteSpace:"nowrap"},children:F?"Generating…":e?"📥 PDF":"📥 Export PDF (A4)"}),t.jsx("button",{onClick:()=>j(!h),style:{width:40,height:40,borderRadius:8,border:`1px solid ${a.border}`,background:a.surface,cursor:"pointer",fontSize:18},children:h?"☀️":"🌙"})]})]}),t.jsxs("div",{style:{marginBottom:e?20:30,display:"flex",gap:e?8:12,flexWrap:"wrap"},children:[t.jsxs("select",{value:S||"",onChange:i=>k(i.target.value?parseInt(i.target.value,10):null),style:{padding:e?"8px 10px":"10px 12px",borderRadius:8,border:`1px solid ${a.border}`,background:a.surface,color:a.text,fontSize:e?12:13,fontWeight:600,flex:e?"1 1 100%":"auto"},children:[t.jsx("option",{value:"",children:"Select Class"}),m.map(i=>t.jsxs("option",{value:i.id,children:[i.className," (",i.educationLevel,")"]},i.id))]}),t.jsxs("select",{value:w,onChange:i=>X(i.target.value),style:{padding:e?"8px 10px":"10px 12px",borderRadius:8,border:`1px solid ${a.border}`,background:a.surface,color:a.text,fontSize:e?12:13,fontWeight:600,flex:e?"1 1 100%":"auto"},children:[t.jsx("option",{value:"",children:"All Terms"}),t.jsx("option",{value:"Term 1",children:"Term 1"}),t.jsx("option",{value:"Term 2",children:"Term 2"}),t.jsx("option",{value:"Term 3",children:"Term 3"})]})]}),V||!l||!u?t.jsx("div",{style:{textAlign:"center",padding:"40px 20px"},children:t.jsx("p",{style:{color:a.textMuted},children:"Loading analytics..."})}):t.jsxs(t.Fragment,{children:[t.jsxs("div",{style:{background:a.surface,border:`1px solid ${a.border}`,borderRadius:12,padding:e?16:20,marginBottom:20},children:[t.jsx("h2",{style:{fontSize:e?15:18,fontWeight:700,margin:"0 0 14px 0"},children:"OVERALL SUMMARY"}),t.jsxs("div",{style:{display:"grid",gridTemplateColumns:e?"repeat(2, 1fr)":x?"repeat(3, 1fr)":"repeat(auto-fit, minmax(200px, 1fr))",gap:e?10:16},children:[t.jsx(p,{label:"Total Students",value:l.totalStudents,t:a,isMobile:e}),t.jsx(p,{label:"Present",value:l.studentsPresent,t:a,isMobile:e}),t.jsx(p,{label:"Absent",value:l.studentsAbsent,t:a,isMobile:e}),t.jsx(p,{label:"Male",value:l.maleCount,t:a,isMobile:e}),t.jsx(p,{label:"Female",value:l.femaleCount,t:a,isMobile:e}),t.jsx(p,{label:"Passed",value:l.totalPassed,t:a,isMobile:e}),t.jsx(p,{label:"Failed",value:l.totalFailed,t:a,isMobile:e}),t.jsx(p,{label:"Quality Pass",value:`${l.qualityPassRate.toFixed(1)}%`,t:a,isMobile:e}),t.jsx(p,{label:"Qty Pass",value:`${l.quantityPassRate.toFixed(1)}%`,t:a,isMobile:e})]})]}),t.jsxs("div",{style:{background:a.surface,border:`1px solid ${a.border}`,borderRadius:12,padding:e?16:20,marginBottom:20},children:[t.jsx("h2",{style:{fontSize:e?15:18,fontWeight:700,margin:"0 0 14px 0"},children:"GENDER PERFORMANCE"}),t.jsxs("div",{style:{display:"grid",gridTemplateColumns:e?"1fr":"1fr 1fr",gap:e?12:16},children:[t.jsx(H,{title:`Male Students (${l.maleCount})`,qualityPass:l.maleQualityPass,quantityPass:l.maleQuantityPass,total:l.maleCount,t:a,isMobile:e}),t.jsx(H,{title:`Female Students (${l.femaleCount})`,qualityPass:l.femaleQualityPass,quantityPass:l.femaleQuantityPass,total:l.femaleCount,t:a,isMobile:e})]})]}),t.jsxs("div",{style:{background:a.surface,border:`1px solid ${a.border}`,borderRadius:12,padding:e?14:20,marginBottom:20,overflowX:"auto"},children:[t.jsx("h2",{style:{fontSize:e?15:18,fontWeight:700,margin:"0 0 14px 0"},children:"SUBJECT ANALYSIS"}),t.jsx("div",{style:{overflowX:"auto"},children:t.jsxs("table",{style:{width:"100%",borderCollapse:"collapse",minWidth:e?"350px":"600px",fontSize:e?11:13},children:[t.jsx("thead",{children:t.jsxs("tr",{style:{borderBottom:`2px solid ${a.border}`},children:[t.jsx("th",{style:{padding:e?8:12,textAlign:"left",fontWeight:700},children:"Subject"}),t.jsx("th",{style:{padding:e?8:12,textAlign:"center",fontWeight:700,fontSize:e?10:12},children:"Qty %"}),t.jsx("th",{style:{padding:e?8:12,textAlign:"center",fontWeight:700,fontSize:e?10:12},children:"Qlt %"}),t.jsx("th",{style:{padding:e?8:12,textAlign:"center",fontWeight:700,fontSize:e?10:12},children:"High"}),t.jsx("th",{style:{padding:e?8:12,textAlign:"center",fontWeight:700,fontSize:e?10:12},children:"Low"})]})}),t.jsx("tbody",{children:l.subjectAnalysis.map((i,c)=>t.jsxs("tr",{style:{borderBottom:`1px solid ${a.border}`,background:c%2===0?a.surfaceAlt:"transparent"},children:[t.jsx("td",{style:{padding:e?8:12,fontWeight:600},children:e?i.name.substring(0,10):i.name}),t.jsxs("td",{style:{padding:e?8:12,textAlign:"center",fontWeight:600},children:[i.quantityPassRate.toFixed(0),"%"]}),t.jsxs("td",{style:{padding:e?8:12,textAlign:"center",fontWeight:600},children:[i.qualityPassRate.toFixed(0),"%"]}),t.jsx("td",{style:{padding:e?8:12,textAlign:"center",fontWeight:600},children:i.highestScore.toFixed(0)}),t.jsx("td",{style:{padding:e?8:12,textAlign:"center",fontWeight:600},children:i.lowestScore.toFixed(0)})]},c))})]})})]}),t.jsxs("div",{style:{background:a.surface,border:`1px solid ${a.border}`,borderRadius:12,padding:e?14:20,marginBottom:20,overflowX:"auto"},children:[t.jsx("h2",{style:{fontSize:e?15:18,fontWeight:700,margin:"0 0 14px 0"},children:"GRADE DISTRIBUTION"}),t.jsx("div",{style:{overflowX:"auto"},children:t.jsxs("table",{style:{width:"100%",borderCollapse:"collapse",minWidth:e?"280px":"400px",fontSize:e?11:13},children:[t.jsx("thead",{children:t.jsxs("tr",{style:{borderBottom:`2px solid ${a.border}`},children:[t.jsx("th",{style:{padding:e?8:12,textAlign:"left",fontWeight:700},children:"Grade"}),t.jsx("th",{style:{padding:e?8:12,textAlign:"center",fontWeight:700,fontSize:e?10:12},children:"Students"}),t.jsx("th",{style:{padding:e?8:12,textAlign:"center",fontWeight:700,fontSize:e?10:12},children:"%"})]})}),t.jsx("tbody",{children:l.qualityPassBreakdown.map((i,c)=>t.jsxs("tr",{style:{borderBottom:`1px solid ${a.border}`,background:c%2===0?a.surfaceAlt:"transparent"},children:[t.jsx("td",{style:{padding:e?8:12,fontWeight:600,fontSize:e?10:13},children:i.grade}),t.jsx("td",{style:{padding:e?8:12,textAlign:"center",fontWeight:600},children:i.students}),t.jsxs("td",{style:{padding:e?8:12,textAlign:"center",fontWeight:600},children:[i.percentage.toFixed(1),"%"]})]},c))})]})})]}),t.jsxs("div",{style:{background:a.surfaceAlt,border:`1px solid ${a.border}`,borderRadius:12,padding:e?12:16,marginTop:20},children:[t.jsx("h3",{style:{fontSize:e?13:14,fontWeight:700,marginBottom:10},children:"📋 Passing Criteria"}),t.jsxs("div",{style:{display:"grid",gridTemplateColumns:e?"1fr":"1fr 1fr",gap:e?12:16},children:[t.jsxs("div",{children:[t.jsx("h4",{style:{fontSize:e?11:12,fontWeight:700,color:a.textMuted,marginBottom:6},children:"PRIMARY"}),t.jsxs("ul",{style:{fontSize:e?11:12,margin:0,paddingLeft:16,lineHeight:"1.6"},children:[t.jsx("li",{children:"Pass: ≥50 marks"}),t.jsx("li",{children:"Quality: ≥60% avg"}),t.jsx("li",{children:"Grade 1: 75%+"}),t.jsx("li",{children:"Grade 2: 60-74%"})]})]}),t.jsxs("div",{children:[t.jsx("h4",{style:{fontSize:e?11:12,fontWeight:700,color:a.textMuted,marginBottom:6},children:"SECONDARY"}),t.jsxs("ul",{style:{fontSize:e?11:12,margin:0,paddingLeft:16,lineHeight:"1.6"},children:[t.jsx("li",{children:"Pass: 6+ subjects"}),t.jsx("li",{children:"Quality: ≥60% avg"}),t.jsx("li",{children:"Grade 1: 75%+"}),t.jsx("li",{children:"Grade 9: 0-39%"})]})]})]})]})]}),t.jsx("style",{children:`
        * { box-sizing: border-box; margin: 0; padding: 0; }
      `})]})}function p(e){return t.jsxs("div",{style:{background:e.t.surfaceAlt,padding:e.isMobile?10:12,borderRadius:8,border:`1px solid ${e.t.border}`},children:[t.jsx("div",{style:{fontSize:e.isMobile?10:11,fontWeight:600,color:e.t.textMuted,marginBottom:4},children:e.label}),t.jsx("div",{style:{fontSize:e.isMobile?16:20,fontWeight:800,color:e.t.text},children:e.value})]})}function H(e){const x=e.total>0?(e.qualityPass/e.total*100).toFixed(1):"0.0",h=e.total>0?(e.quantityPass/e.total*100).toFixed(1):"0.0";return t.jsxs("div",{style:{background:e.t.surfaceAlt,padding:e.isMobile?12:16,borderRadius:8,border:`1px solid ${e.t.border}`},children:[t.jsx("h3",{style:{fontSize:e.isMobile?13:14,fontWeight:700,margin:"0 0 10px 0"},children:e.title}),t.jsxs("div",{style:{display:"flex",flexDirection:"column",gap:6},children:[t.jsxs("div",{style:{display:"flex",justifyContent:"space-between"},children:[t.jsx("span",{style:{fontSize:e.isMobile?11:12,fontWeight:600,color:e.t.textMuted},children:"Quality Pass:"}),t.jsxs("span",{style:{fontSize:e.isMobile?11:12,fontWeight:700,color:e.t.text},children:[x,"%"]})]}),t.jsxs("div",{style:{display:"flex",justifyContent:"space-between"},children:[t.jsx("span",{style:{fontSize:e.isMobile?11:12,fontWeight:600,color:e.t.textMuted},children:"Quantity Pass:"}),t.jsxs("span",{style:{fontSize:e.isMobile?11:12,fontWeight:700,color:e.t.text},children:[h,"%"]})]})]})]})}export{ye as default};
//# sourceMappingURL=AnalysisScreen-C_cqGKnN.js.map
