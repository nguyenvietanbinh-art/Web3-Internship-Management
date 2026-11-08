"""Versioned evidence rules. No model imports, scores, ranking, latent track or GPA bonus."""
import hashlib,json,re,unicodedata
from pathlib import Path
ROOT=Path(__file__).resolve().parents[2]
CATALOG=json.loads((ROOT/'shared/skill-catalog.json').read_text(encoding='utf-8'))
VERSION='cvjd-rubric-v1-20261108'
WEIGHTS={'required_skills':40,'preferred_skills':15,'projects_experience':20,'technology_tools':10,'education':10,'other_conditions':5}
TOOLS={'react','node.js','express','mongodb','git','flutter','sqlite','scikit-learn','pandas','numpy','excel','power bi','postman','playwright','linux','docker','ci/cd','figma','bpmn','uml','design system','prototyping'}
RUBRIC={'version':VERSION,'label_source':'RULE_BASED','human_validated':False,'weights':WEIGHTS,'labels':{'0':[0,39.99],'1':[40,59.99],'2':[60,79.99],'3':[80,100]},'binary_relevant_min_label':2,'na_policy':'Exclude a criterion only when JD makes no such request; normalize earned/applicable_weight to100. Missing CV evidence earns0, never the maximum. Missing required-skill list is unjudgeable, not an irrelevant pair.','required_skill_caps':{'coverage_below_0.5':39,'partial_coverage':79},'explicit_condition_failure_cap':39,'unsupported_explicit_mandatory_condition_cap':59,'project_subweights':{'job_skills_in_project':8,'actions':4,'role':4,'results':4},'education_subweights':{'major':6,'explicit_foundation':4},'ap_denominator':'min(R,k)','no_relevant_policy':'binary P/R/AP=0 and query remains in macro; NDCG uses grades independently,0 only when IDCG=0','technology_catalog':sorted(TOOLS),'skill_catalog_version':CATALOG['version'],'skill_catalog_sha256':hashlib.sha256((ROOT/'shared/skill-catalog.json').read_bytes()).hexdigest(),'unverified':'CV declarations and keyword evidence are not validated achievements; no confidence probability.'}
def fold(text):
 text=unicodedata.normalize('NFD',str(text or '').lower()).replace('đ','d')
 return ' '.join(re.sub(r'[\u0300-\u036f]','',text).split())
def canonical(skill):
 value=' '.join(unicodedata.normalize('NFC',str(skill)).lower().split())
 return CATALOG['aliases'].get(value,value)
def contains(text,word):return re.search(r'(?<!\w)'+re.escape(fold(word))+r'(?!\w)',fold(text)) is not None
def declared(values):return {canonical(s):s for s in values if isinstance(s,str) and s.strip()}
def label_for(score):
 if not 0<=score<=100:raise ValueError('score outside0..100')
 return 0 if score<40 else 1 if score<60 else 2 if score<80 else 3
def grade_pair(cv,jd):
 required=declared(jd.get('requirements',[]));own=declared(cv.get('skills',[]))
 if not required:raise ValueError('Cannot judge JD without explicit required skills')
 text=jd.get('description','');full=cv.get('text','');project=cv.get('experience','');education=cv.get('education','')
 found=sorted(set(required)&set(own));ratio=len(found)/len(required);criteria={};caps=[];unknown=[]
 def put(key,value,reason,evidence,active=True):criteria[key]={'weight':WEIGHTS[key],'applicable':active,'earned':round(value,6) if active else None,'reason':reason,'evidence':evidence}
 skill_evidence=[{'cv_field':'skills','cv_quote':own[s],'jd_field':'requirements','jd_quote':required[s],'canonical':s} for s in found]
 put('required_skills',40*ratio,f'{len(found)}/{len(required)} explicit requirements; spelling aliases only, no related-skill substitution',skill_evidence)
 optional=re.search(r'(?:ưu tiên|preferred skills)\s*:\s*([^\n]+)',text,re.I)
 preferred=declared(re.split(r'[,;|]',optional.group(1).rstrip(' .'))) if optional else {}
 if preferred:
  matched=set(preferred)&set(own);put('preferred_skills',15*len(matched)/len(preferred),'Only explicit priority list; missing CV evidence gets0',[{'cv_field':'skills','cv_quote':own[s],'jd_field':'description','jd_quote':preferred[s]} for s in sorted(matched)])
 elif re.search(r'uu tien|preferred',fold(text)):
  unknown.append('priority request not in an explicit parsable list');put('preferred_skills',0,'UNPARSED_PRIORITY_REQUEST: active but no awarded points; human review required',[{'jd_field':'description','jd_quote':text[:500]}])
 else:put('preferred_skills',0,'NOT_REQUESTED: exclude15 from denominator; do not award15',[],False)
 experience_skills=[s for s in required if contains(project,s) or any(canonical(raw)==s and contains(project,raw) for raw in cv.get('skills',[]))]
 action=bool(re.search(r'xay dung|thiet ke|phat trien|trien khai|kiem thu|phan tich|lam sach|tong hop',fold(project)))
 role=bool(re.search(r'phu trach|vai tro|thuc hien|ca nhan|trong nhom',fold(project)))
 positive_project=re.sub(r'chua[^.;\n]*','',fold(project))
 result=bool(re.search(r'hoan thanh chuc nang|da xay dung|ban giao|da trinh bay|da thuc hien|co nhat ky sua loi',positive_project))
 related=8*len(experience_skills)/len(required)
 put('projects_experience',related+4*action+4*role+4*result,'8×explicit job-skill coverage inside project text +4action +4role +4result; no inferred work history',[{'cv_field':'experience','cv_quote':project[:700],'jd_field':'title','jd_quote':jd['title'],'skill_matches':experience_skills,'action':action,'role':role,'result':result}])
 tools=set(required)&TOOLS
 if tools:put('technology_tools',10*len(tools&set(own))/len(tools),'Only requested frameworks/databases/tools from pinned catalog; intentional rubric overlap with required skills',[{'cv_field':'skills','cv_quote':own[s],'jd_field':'requirements','jd_quote':required[s]} for s in sorted(tools&set(own))])
 else:put('technology_tools',0,'NOT_REQUESTED: no catalogued technology/tool in explicit requirements',[],False)
 major_required=bool(re.search(r'cong nghe thong tin|computer science|ky thuat phan mem',fold(text)))
 major_match=bool(re.search(r'cong nghe thong tin|computer science|ky thuat phan mem',fold(education)))
 foundation=re.search(r'hiểu nền tảng\s+([^.;]+)',text,re.I);base=foundation.group(1).strip() if foundation else None
 requested=(6 if major_required else 0)+(4 if base else 0)
 if requested:
  earned=(6 if major_required and major_match else 0)+(4 if base and contains(full,base) else 0)
  put('education',10*earned/requested,'Only JD-requested major/foundation; GPA ignored unless explicitly required',[{'cv_field':'education','cv_quote':education[:600],'jd_field':'description','jd_quote':text[:500],'major_match':major_match,'foundation':base,'foundation_evidenced':bool(base and contains(full,base))}])
 else:put('education',0,'NOT_REQUESTED: no explicit education/foundation requirement',[],False)
 day_req=re.search(r'(\d+)\s*ngay\s*/\s*tuan',fold(text));day_cv=re.search(r'(\d+)\s*ngay\s*(?:/|moi)\s*tuan',fold(full));period_req='theo ky nha truong' in fold(text) or 'theo ky' in fold(text)
 parts=[]
 if day_req:
  matched=bool(day_cv and int(day_cv.group(1))>=int(day_req.group(1)));parts.append((3,matched,'working-days',day_req.group(0),day_cv.group(0) if day_cv else None))
  if day_cv and not matched:caps.append(('explicit-workday-failure',39))
  if not day_cv:unknown.append('workday availability missing')
 if period_req:parts.append((1,bool(re.search(r'nha truong|theo ky',fold(full))),'school-period','theo kỳ', 'school-period statement' if re.search(r'nha truong|theo ky',fold(full)) else None))
 mode=re.search(r'\b(remote|on-site|onsite|hybrid)\b',fold(text))
 if mode:parts.append((1,contains(full,mode.group(1)),'work-mode',mode.group(1),mode.group(1) if contains(full,mode.group(1)) else None))
 if parts:put('other_conditions',5*sum(w for w,ok,*_ in parts if ok)/sum(w for w,*_ in parts),'Only stated days/period/work mode; unknown CV condition earns0',[{'rule':rule,'jd_quote':req,'cv_quote':actual,'met':ok} for w,ok,rule,req,actual in parts])
 else:put('other_conditions',0,'NOT_REQUESTED: no supported condition stated',[],False)
 # A separately explicit GPA minimum is a gate, never a bonus for a high GPA.
 gpa=re.search(r'gpa\s*(?:>=|≥|tu|toi thieu)\s*([0-4](?:[.,]\d+)?)',fold(text))
 if gpa:
  if cv.get('gpa') is None:unknown.append('required GPA missing');caps.append(('unknown-required-GPA',59))
  elif float(cv['gpa'])<float(gpa.group(1).replace(',','.')):caps.append(('explicit-GPA-failure',39))
 if re.search(r'bat buoc|must have',fold(text)):
  unknown.append('additional mandatory wording requires human condition review');caps.append(('unsupported-explicit-condition',59))
 if ratio<.5:caps.append(('less-than-half-required-skills',39))
 elif ratio<1:caps.append(('missing-required-skills-no-high-label',79))
 active=sum(c['weight'] for c in criteria.values() if c['applicable']);raw=sum(c['earned'] or 0 for c in criteria.values());normalized=round(raw/active*100,2);total=min([normalized]+[cap for _,cap in caps])
 return {'cv_id':cv['id'],'jd_id':jd['id'],'rubric_version':VERSION,'label_source':'RULE_BASED','human_validated':False,'raw_score':round(raw,4),'applicable_weight':active,'normalized_before_caps':normalized,'total':total,'label':label_for(total),'criteria':criteria,'caps':[{'reason':r,'maximum':v} for r,v in caps],'unknowns':unknown,'missing_required_skills':sorted(set(required)-set(own))}
