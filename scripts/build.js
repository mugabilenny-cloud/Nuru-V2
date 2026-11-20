// NURU build: data/hub_repo.xlsx -> public/jobs.json
// Sheet columns: path | title | url | details   (optional: image). Add a listing = add a row at the bottom.
//   path    "Jobs/Medical" or "Scholarships/Open now"  (section/category)
//   title   "Employer - Job title"   (no " - " = whole text is the title)
//   url     listing page (this is the Apply link)
//   details free text: "Location. Closes 11 Oct 2026. Requirements... Email CV to hr@x.com"
// Flag: --strict fails the build on any bad row.
const X=require('xlsx'),fs=require('fs'),P=require('path');
const strict=process.argv.includes('--strict'),src=P.join(__dirname,'..','data','hub_repo.xlsx');
if(!fs.existsSync(src)){console.error('Missing data/hub_repo.xlsx');process.exit(1)}
const wb=X.readFile(src),rows=X.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]],{defval:''});
const s=v=>String(v??'').replace(/<[^>]*>/g,'').replace(/\s+/g,' ').trim();
const slug=t=>t.toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'').slice(0,60);
const M='jan feb mar apr may jun jul aug sep oct nov dec'.split(' ');
const img=u=>{u=s(u);const m=u.match(/\/d\/([\w-]+)|[?&]id=([\w-]+)/);return/drive\.google\.com/.test(u)&&m?`https://drive.google.com/thumbnail?id=${m[1]||m[2]}&sz=w600`:u};
const today=new Date().toISOString().slice(0,10),cut=new Date(Date.now()-30*864e5).toISOString().slice(0,10);
const jobs=[],warn=[],ids=new Set(),urls=new Set();let old=0;
rows.forEach((r,i)=>{const o={};for(const k in r)o[k.trim().toLowerCase()]=r[k];
  const path=s(o.path),full=s(o.title),url=s(o.url),det=s(o.details);if(!path&&!full&&!url)return;
  const e=[];if(!path)e.push('missing path');if(!full)e.push('missing title');if(!/^https?:\/\//i.test(url))e.push('url must start with http(s)://');if(urls.has(full.toLowerCase()))e.push('duplicate title');
  if(e.length){warn.push(`Row ${i+2} (${full||'untitled'}): ${e.join('; ')}`);return}
  urls.add(full.toLowerCase());
  const seg=path.split('/').map(x=>x.trim()).filter(Boolean),sec=seg[0],cat=seg.slice(1).join(' / ')||sec,isJob=/^jobs?$/i.test(sec);
  const cut2=full.indexOf(' - '),paren=(full.match(/\(([^)]*)\)\s*$/)||[])[1]||'';
  const employer=cut2>0?full.slice(0,cut2):(paren.split(',')[0]||sec),title=cut2>0?full.slice(cut2+3):full;
  const m=det.match(/(?:closes?|deadline)\s+(\d{1,2})\s+([a-z]{3})[a-z]*\s+(\d{4})/i),mi=m?M.indexOf(m[2].toLowerCase()):-1;
  const deadline=mi>=0?`${m[3]}-${String(mi+1).padStart(2,'0')}-${m[1].padStart(2,'0')}`:'';
  if(deadline&&deadline<cut){old++;return}
  const email=(det.match(/[\w.+-]+@[\w-]+(?:\.[\w-]+)+/)||[])[0],links=[];
  if(email)links.push({kind:'apply_email',url:email,label:'Email your application'});
  links.push({kind:'apply_link',url:url,label:'Open the full listing'});
  const t=(det+' '+full+' '+cat).match(/full-time|part-time|internship|contract|volunteer/i);
  let id=slug(title+'-'+employer);while(ids.has(id))id+='-2';ids.add(id);
  jobs.push({id,section:sec,category:cat,sub:'',title,employer,
    location:isJob?det.split(/\.\s/)[0].replace(/\.$/,''):(paren.split(',').pop().trim()||'International'),
    image:img(o.image||o['job tile']),type:isJob?(t?t[0][0].toUpperCase()+t[0].slice(1).toLowerCase():'Full-time'):'Scholarship',
    level:'',salary_min:null,salary_max:null,currency:'',deadline,description:det,requirements:[],verified:false,links});
});
if(warn.length){console.warn(`\n${warn.length} row(s) skipped:\n  - `+warn.join('\n  - '));if(strict){console.error('Strict mode: failed');process.exit(1)}}
fs.mkdirSync(P.join(__dirname,'..','public'),{recursive:true});
fs.writeFileSync(P.join(__dirname,'..','public','jobs.json'),JSON.stringify({generated:today,jobs}));
const open=jobs.filter(j=>!j.deadline||j.deadline>=today).length;
console.log(`NURU build: ${jobs.length} listing(s) written (${open} open today); ${old} dropped for closing 30+ days ago.`);
