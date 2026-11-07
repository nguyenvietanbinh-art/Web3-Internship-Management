const score=r=>r?.raw_cosine??r?.cosine??null;
function combine(tfidf,sbert,topK){
 const tfRows=tfidf.all_results||tfidf.results,sbRows=sbert.all_results||sbert.results;
 const tf=new Map(tfRows.map((r,i)=>[r.id,{...r,rank:i+1}])),sb=new Map(sbRows.map((r,i)=>[r.id,{...r,rank:i+1}]));
 const ids=[...new Set([...tfRows.slice(0,topK).map(r=>r.id),...sbRows.slice(0,topK).map(r=>r.id)])];
 return ids.map(id=>{const t=tf.get(id),s=sb.get(id);return {...(s||t),comparison:{tfidf:{cosine:t?.cosine??null,raw_cosine:score(t),rank:t?.rank??null},sbert:{cosine:s?.cosine??null,raw_cosine:score(s),rank:s?.rank??null},rank_delta_tfidf_to_sbert:t&&s?t.rank-s.rank:null}};});
}
module.exports={combine};
