"""Full-pool, graded-label ranking metrics v1. No discarded difficult queries."""
import math
def metrics(ranking,labels,k):
 if isinstance(k,bool) or not isinstance(k,int) or k<1:raise ValueError('k must be positive integer')
 if len(ranking)!=len(set(ranking)) or set(ranking)!=set(labels):raise ValueError('Full ranking and all labels must match exactly; never infer an unjudged label')
 if any(isinstance(g,bool) or not isinstance(g,int) or not 0<=g<=3 for g in labels.values()):raise ValueError('Grades must be integers0..3')
 relevant=sum(g>=2 for g in labels.values());hits=0;precision_sum=0
 for i,doc in enumerate(ranking[:k],1):
  if labels[doc]>=2:hits+=1;precision_sum+=hits/i
 dcg=sum((2**labels[doc]-1)/math.log2(i+2) for i,doc in enumerate(ranking[:k]))
 ideal=sorted(labels.values(),reverse=True)[:k];idcg=sum((2**g-1)/math.log2(i+2) for i,g in enumerate(ideal))
 return {'precision':hits/k,'recall':hits/relevant if relevant else 0.0,'ap':precision_sum/min(relevant,k) if relevant else 0.0,'ndcg':dcg/idcg if idcg else 0.0,'relevant':relevant,'hits':hits}
