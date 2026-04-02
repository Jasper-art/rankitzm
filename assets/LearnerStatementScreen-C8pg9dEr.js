import{u as ee,h as te,r as a,d as v,j as e}from"./index-Cv9hFNda.js";import{D as re,L as oe,Z as ne}from"./rankitz-colors-BR--Oa5l.js";import{g as ae,b as ie}from"./grading-CnuXgHGN.js";function ue(){var W;const u=ee(),{learnerId:s}=te(),c=a.useRef(null),[p,B]=a.useState(()=>{const r=localStorage.getItem("rankitz-theme");return r?r==="dark":window.matchMedia("(prefers-color-scheme: dark)").matches}),[i,L]=a.useState(null),[A,P]=a.useState(null),[z,N]=a.useState([]),[m,E]=a.useState(new Map),[se,le]=a.useState([]),[M,D]=a.useState([]),[G,I]=a.useState(!0),[g,F]=a.useState(window.innerWidth<640),[de,O]=a.useState(window.innerWidth<1024),[h,H]=a.useState(""),[_,Z]=a.useState("RankIT ZM School"),[T,V]=a.useState(null),t=p?re:oe;a.useEffect(()=>{const r=()=>{F(window.innerWidth<640),O(window.innerWidth<1024)};return window.addEventListener("resize",r),()=>window.removeEventListener("resize",r)},[]),a.useEffect(()=>{q()},[s]),a.useEffect(()=>{U()},[z,h,M,i]);const q=async()=>{try{I(!0);const r=s?parseInt(s,10):null;if(!r)return;const[o,l,f,b]=await Promise.all([v.getLearner(r),v.getScoresByLearner(r),v.getAllSubjects(),v.getAllClasses()]);if(L(o||null),N(l),D(f),o!=null&&o.classId){const y=await v.getClass(o.classId);P(y||null)}const j=localStorage.getItem("schoolName"),n=localStorage.getItem("logoUri");j&&Z(j),n&&V(n)}catch(r){console.error("Error loading data:",r)}finally{I(!1)}},U=()=>{const r=M.filter(n=>n.classId===(i==null?void 0:i.classId)),o=new Set(r.map(n=>n.id)),l=z.filter(n=>o.has(n.subjectId)),f=h?l.filter(n=>n.term===h):l,b=new Map;f.forEach(n=>{b.has(n.subjectId)||b.set(n.subjectId,[]),b.get(n.subjectId).push(n)});const j=new Map;b.forEach((n,y)=>{var $;const Y=(($=r.find(d=>d.id===y))==null?void 0:$.subjectName)||`Subject ${y}`,x=n.map(d=>d.score),J=x.filter(d=>d>=50).length;j.set(y,{subjectName:Y,scores:x,average:Math.round(x.reduce((d,Q)=>d+Q,0)/x.length*10)/10,highest:Math.max(...x),lowest:Math.min(...x),passCount:J})}),E(j)},C=()=>{if(m.size===0)return 0;let r=0,o=0;return m.forEach(l=>{r+=l.average,o+=1}),Math.round(r/o*10)/10},R=r=>ae(r,100,"secondary"),K=r=>ie(r,100,"secondary"),X=()=>{const r=C();return r>=75?"Excellent Performance":r>=70?"Very Good Performance":r>=65||r>=60?"Good Performance":r>=55||r>=50?"Satisfactory Performance":r>=45?"Acceptable Performance":r>=40?"Needs Improvement":"Critical Support Needed"},S={back:e.jsx("svg",{viewBox:"0 0 20 20",fill:"currentColor",width:18,height:18,children:e.jsx("path",{fillRule:"evenodd",d:"M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z",clipRule:"evenodd"})}),print:e.jsx("svg",{viewBox:"0 0 20 20",fill:"currentColor",width:16,height:16,children:e.jsx("path",{d:"M5 4a2 2 0 012-2h6a2 2 0 012 2v14l-5-2.5L5 18V4z"})}),sun:e.jsx("svg",{viewBox:"0 0 20 20",fill:"currentColor",width:16,height:16,children:e.jsx("path",{fillRule:"evenodd",d:"M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z",clipRule:"evenodd"})}),moon:e.jsx("svg",{viewBox:"0 0 20 20",fill:"currentColor",width:16,height:16,children:e.jsx("path",{d:"M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z"})})};return e.jsxs("div",{className:"screen-container",style:{display:"flex",minHeight:"100dvh",background:t.bg,color:t.text,fontFamily:"'Inter', 'Segoe UI', system-ui, sans-serif",flexDirection:"column"},children:[e.jsxs("header",{className:"no-print",style:{background:t.surface,borderBottom:`1.5px solid ${t.border}`,padding:g?"12px 14px":"14px 24px",display:"flex",alignItems:"center",justifyContent:"space-between",position:"sticky",top:0,zIndex:20,flexShrink:0,boxShadow:`0 1px 3px ${t.shadow}`,flexWrap:"wrap",gap:"10px"},children:[e.jsxs("div",{style:{display:"flex",alignItems:"center",gap:12},children:[e.jsx("button",{onClick:()=>u("/learners"),style:{background:"none",border:"none",color:t.textMuted,cursor:"pointer",padding:8,display:"flex",borderRadius:8,transition:"all 0.3s ease"},onMouseEnter:r=>{r.currentTarget.style.background=t.surfaceAlt,r.currentTarget.style.color=t.accent},onMouseLeave:r=>{r.currentTarget.style.background="none",r.currentTarget.style.color=t.textMuted},children:S.back}),e.jsxs("div",{children:[e.jsx("div",{style:{fontSize:16,fontWeight:700,color:t.text},children:"Statement of Results"}),e.jsx("div",{style:{fontSize:12,color:t.textMuted,marginTop:2},children:"Academic performance report"})]})]}),e.jsxs("div",{style:{display:"flex",alignItems:"center",gap:12},children:[e.jsxs("select",{value:h,onChange:r=>H(r.target.value),style:{padding:"8px 12px",borderRadius:8,border:`1.5px solid ${t.border}`,background:t.surfaceAlt,color:t.text,fontSize:13,fontWeight:600,outline:"none",cursor:"pointer"},children:[e.jsx("option",{value:"",children:"All Terms Combined"}),e.jsx("option",{value:"Term 1",children:"Term 1"}),e.jsx("option",{value:"Term 2",children:"Term 2"}),e.jsx("option",{value:"Term 3",children:"Term 3"})]}),e.jsxs("button",{onClick:()=>{const r=document.createElement("script");r.src="https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js",r.onload=()=>{const o=document.querySelector(".printable-document");if(o&&i){const f={margin:8,filename:`Statement_of_Results_${i.name.replace(/\s+/g,"_")}.pdf`,image:{type:"jpeg",quality:.98},html2canvas:{scale:2,backgroundColor:"#ffffff",useCORS:!0,logging:!1},jsPDF:{format:"a4",orientation:"portrait"},pagebreak:{avoid:"css",mode:["avoid-all"]}};html2pdf().set(f).from(o).save()}},document.head.appendChild(r)},style:{padding:"8px 16px",borderRadius:8,border:"none",background:t.accent,color:"white",fontSize:13,fontWeight:600,display:"flex",alignItems:"center",gap:8,cursor:"pointer"},children:[S.print," Export PDF"]}),e.jsx("button",{onClick:()=>B(r=>!r),style:{width:36,height:36,borderRadius:8,border:`1.5px solid ${t.border}`,background:t.surfaceAlt,display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",color:t.textMuted},children:p?S.sun:S.moon})]})]}),e.jsx("main",{style:{flex:1,padding:g?"10px":"30px",overflowY:"auto",display:"flex",justifyContent:"center",alignItems:"flex-start"},children:G?e.jsx("div",{style:{textAlign:"center",marginTop:50},children:"Loading..."}):i?e.jsxs("div",{ref:c,className:"printable-document",style:{background:t.surface,color:t.text,width:"100%",maxWidth:"210mm",margin:"0 auto",padding:g?"15px":"25px",boxShadow:`0 8px 24px ${t.shadow}`,borderRadius:g?8:4,border:`1px solid ${t.border}`,position:"relative",display:"flex",flexDirection:"column",WebkitPrintColorAdjust:"exact",printColorAdjust:"exact"},children:[e.jsx("div",{style:{display:"flex",height:6,borderRadius:4,overflow:"hidden",marginBottom:30,flexShrink:0},children:ne.map(r=>e.jsx("div",{style:{flex:1,background:r,WebkitPrintColorAdjust:"exact"}},r))}),e.jsxs("div",{style:{textAlign:"center",borderBottom:`2px solid ${t.text}`,paddingBottom:12,marginBottom:15},children:[T&&e.jsx("img",{src:T,alt:"School Logo",style:{width:60,height:60,objectFit:"contain",marginBottom:6,WebkitPrintColorAdjust:"exact"}}),e.jsx("h1",{style:{fontSize:18,fontWeight:800,textTransform:"uppercase",letterSpacing:"1px",margin:"0 0 3px 0",color:t.text},children:_}),e.jsx("h2",{style:{fontSize:14,fontWeight:600,color:t.textMuted,margin:"0 0 8px 0",textTransform:"uppercase",letterSpacing:"2px"},children:"Statement of Results"}),e.jsx("div",{style:{fontSize:12,color:t.textMuted,fontStyle:"italic"},children:"Official Academic Performance Report"})]}),e.jsxs("div",{style:{display:"grid",gridTemplateColumns:g?"1fr":"1fr 1fr",gap:10,marginBottom:15,padding:"10px",background:t.surfaceAlt,border:`1px solid ${t.border}`,borderRadius:8,WebkitPrintColorAdjust:"exact"},children:[e.jsxs("div",{children:[e.jsx(w,{label:"Learner Name",value:i.name,t}),e.jsx(w,{label:"Exam/ID Number",value:((W=i.id)==null?void 0:W.toString())||"N/A",t})]}),e.jsxs("div",{children:[e.jsx(w,{label:"Class",value:(A==null?void 0:A.className)||"N/A",t}),e.jsx(w,{label:"Academic Term",value:h||"All Terms Combined",t})]})]}),e.jsx("div",{style:{marginBottom:15,overflowX:"auto"},children:e.jsxs("table",{className:"results-table",style:{width:"100%",borderCollapse:"collapse",textAlign:"left",fontSize:12,WebkitPrintColorAdjust:"exact"},children:[e.jsx("thead",{children:e.jsxs("tr",{style:{background:t.border,color:t.text,WebkitPrintColorAdjust:"exact"},children:[e.jsx("th",{style:{padding:"8px",border:`1px solid ${t.border}`},children:"Subject"}),e.jsx("th",{style:{padding:"12px",border:`1px solid ${t.border}`,textAlign:"center",width:"15%"},children:"Score (%)"}),e.jsx("th",{style:{padding:"12px",border:`1px solid ${t.border}`,textAlign:"center",width:"15%"},children:"Grade"}),e.jsx("th",{style:{padding:"12px",border:`1px solid ${t.border}`,textAlign:"left",width:"25%"},children:"Remark"})]})}),e.jsx("tbody",{children:m.size===0?e.jsx("tr",{children:e.jsx("td",{colSpan:4,style:{padding:"30px",textAlign:"center",color:t.textMuted,border:`1px solid ${t.border}`},children:"No subject scores recorded for this period."})}):Array.from(m.entries()).map(([r,o])=>e.jsxs("tr",{children:[e.jsx("td",{style:{padding:"8px",border:`1px solid ${t.border}`,fontWeight:600},children:o.subjectName}),e.jsx("td",{style:{padding:"8px",border:`1px solid ${t.border}`,textAlign:"center",fontWeight:700},children:o.average}),e.jsx("td",{style:{padding:"8px",border:`1px solid ${t.border}`,textAlign:"center",fontWeight:700,color:o.average>=50?t.text:t.red},children:R(o.average)}),e.jsx("td",{style:{padding:"8px",border:`1px solid ${t.border}`,textAlign:"left",color:t.textMuted},children:K(o.average)})]},r))})]})}),e.jsxs("div",{style:{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"10px 15px",border:`2px solid ${t.text}`,borderRadius:8,marginBottom:20,flexWrap:"wrap",gap:10,WebkitPrintColorAdjust:"exact"},children:[e.jsx(k,{label:"Subjects Taken",value:m.size,t}),e.jsx(k,{label:"Overall Average",value:`${C()}%`,t}),e.jsx(k,{label:"Overall Grade",value:R(C()),t}),e.jsx(k,{label:"Overall Remark",value:X(),highlight:!0,t})]}),e.jsxs("div",{style:{display:"flex",justifyContent:"space-between",alignItems:"flex-end",paddingTop:15,marginTop:10},children:[e.jsxs("div",{style:{textAlign:"center",width:"30%"},children:[e.jsx("div",{style:{borderBottom:`1px solid ${t.text}`,height:20,marginBottom:3}}),e.jsx("div",{style:{fontSize:10,fontWeight:600},children:"Teacher's Signature"})]}),e.jsx("div",{style:{textAlign:"center",width:"30%"},children:e.jsx("div",{style:{height:60,width:60,border:`2px dashed ${t.border}`,borderRadius:"50%",margin:"0 auto 6px auto",display:"flex",alignItems:"center",justifyContent:"center",color:t.textMuted,fontSize:8},children:"OFFICIAL STAMP"})}),e.jsxs("div",{style:{textAlign:"center",width:"30%"},children:[e.jsx("div",{style:{borderBottom:`1px solid ${t.text}`,height:20,marginBottom:3,display:"flex",alignItems:"flex-end",justifyContent:"center",fontSize:12},children:new Date().toLocaleDateString()}),e.jsx("div",{style:{fontSize:10,fontWeight:600},children:"Date Issued"})]})]}),e.jsx("div",{style:{textAlign:"center",marginTop:15,fontSize:8,color:t.textMuted},children:"Generated securely by RankIT ZM School Management System"})]}):e.jsx("div",{style:{textAlign:"center",marginTop:50},children:"Learner not found"})}),e.jsx("style",{children:`
        @media print {
          @page {
            size: A4;
            margin: 0;
            padding: 0;
          }
          
          * {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
            color-adjust: exact !important;
          }

          html, body {
            margin: 0 !important;
            padding: 0 !important;
            width: 100% !important;
            height: 100% !important;
          }

          .screen-container {
            background: white !important;
            margin: 0 !important;
            padding: 0 !important;
          }

          .no-print {
            display: none !important;
            visibility: hidden !important;
          }

          main {
            padding: 0 !important;
            margin: 0 !important;
            display: block !important;
            background: white !important;
          }

          .printable-document {
            box-shadow: none !important;
            border: none !important;
            border-radius: 0 !important;
            padding: 40px !important;
            max-width: 100% !important;
            width: 100% !important;
            margin: 0 !important;
            background: white !important;
            color: black !important;
            min-height: auto !important;
            page-break-after: avoid !important;
          }

          .printable-document * {
            background-color: transparent !important;
          }

          .results-table {
            width: 100% !important;
            page-break-inside: avoid !important;
          }

          .results-table thead {
            display: table-header-group !important;
            page-break-after: avoid !important;
          }

          .results-table tbody {
            page-break-inside: avoid !important;
          }

          .results-table tr {
            page-break-inside: avoid !important;
          }

          h1, h2, h3, h4, h5, h6 {
            page-break-after: avoid !important;
          }

          img {
            max-width: 100% !important;
          }
        }

        @media screen {
          * {
            box-sizing: border-box;
            margin: 0;
            padding: 0;
          }
        }
      `})]})}function w({label:u,value:s,t:c}){return e.jsxs("div",{style:{display:"flex",marginBottom:6,fontSize:14},children:[e.jsxs("span",{style:{width:130,fontWeight:600,color:c.textMuted},children:[u,":"]}),e.jsx("span",{style:{fontWeight:700,color:c.text},children:s})]})}function k({label:u,value:s,highlight:c=!1,t:p}){return e.jsxs("div",{style:{textAlign:"center"},children:[e.jsx("div",{style:{fontSize:9,color:p.textMuted,textTransform:"uppercase",fontWeight:700,marginBottom:2,letterSpacing:"0.5px"},children:u}),e.jsx("div",{style:{fontSize:14,fontWeight:800,color:c?p.accent:p.text},children:s})]})}export{ue as default};
//# sourceMappingURL=LearnerStatementScreen-C8pg9dEr.js.map
