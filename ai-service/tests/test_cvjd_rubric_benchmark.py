import math,unittest
from evaluation.cvjd_rubric import grade_pair,label_for
from evaluation.cvjd_metrics import metrics

def cv(**patch):return {'id':'cv','skills':['Node.js','Git'],'experience':'Xây dựng API Node.js, trong nhóm phụ trách viết chức năng; đã hoàn thành chức năng và có nhật ký sửa lỗi.','education':'Ngành Công nghệ thông tin','text':'Node.js Git, có thể tham gia4ngày mỗi tuần theo nhà trường','gpa':3.0,**patch}
def jd(**patch):return {'id':'jd','title':'Xây dựng API','requirements':['Node.js','Git'],'description':'Yêu cầu học vấn: Công nghệ thông tin. Hiểu nền tảng Node.js. Lịch4ngày/tuần theo kỳ nhà trường.',**patch}
class RubricTests(unittest.TestCase):
 def test_thresholds(self):
  for value,label in [(0,0),(39.99,0),(40,1),(59.99,1),(60,2),(79.99,2),(80,3),(100,3)]:self.assertEqual(label_for(value),label)
 def test_no_optional_request_is_na_not_awarded_max(self):
  r=grade_pair(cv(),jd());self.assertFalse(r['criteria']['preferred_skills']['applicable']);self.assertIsNone(r['criteria']['preferred_skills']['earned']);self.assertEqual(r['applicable_weight'],85)
 def test_missing_cv_data_never_gets_maximum(self):
  r=grade_pair(cv(skills=[],experience='',education='',text=''),jd());self.assertEqual(r['total'],0);self.assertEqual(r['label'],0)
 def test_related_not_alias_and_spelling_alias_is_allowed(self):
  r=grade_pair(cv(skills=['Express']),jd(requirements=['Node.js']));self.assertEqual(r['criteria']['required_skills']['earned'],0)
  r=grade_pair(cv(skills=['NodeJS']),jd(requirements=['Node.js']));self.assertEqual(r['criteria']['required_skills']['earned'],40)
 def test_partial_coverage_caps_and_hard_condition_failure(self):
  r=grade_pair(cv(skills=['Node.js']),jd());self.assertLessEqual(r['total'],79)
  r=grade_pair(cv(text='Node.js,2ngày/tuần theo nhà trường'),jd());self.assertLessEqual(r['total'],39)
 def test_explicit_preferred_list_keeps_dotted_skill(self):
  r=grade_pair(cv(skills=['Node.js','Git','Docker']),jd(description='Ưu tiên: Node.js, Docker'));self.assertEqual(r['criteria']['preferred_skills']['earned'],15)
 def test_unknown_priority_is_not_silently_na(self):
  r=grade_pair(cv(),jd(description='Ưu tiên ứng viên có kinh nghiệm'));self.assertTrue(r['criteria']['preferred_skills']['applicable']);self.assertEqual(r['criteria']['preferred_skills']['earned'],0)
 def test_similarity_rank_latent_track_and_unrequested_gpa_do_not_change_label(self):
  base=grade_pair(cv(),jd());changed=grade_pair(cv(gpa=4.0,samplingTrack=9,similarity=1.0,rank=1),jd(samplingTrack=9,similarity=.01));self.assertEqual(base,changed);self.assertFalse(base['human_validated']);self.assertEqual(base['label_source'],'RULE_BASED')
 def test_missing_required_list_is_unjudgeable_not_automatic_irrelevant(self):
  with self.assertRaises(ValueError):grade_pair(cv(),jd(requirements=[]))
class MetricsTests(unittest.TestCase):
 def test_hand_calculated_example(self):
  labels={'a':3,'b':0,'c':2,'d':1,'e':2};r=metrics(['b','a','d','c','e'],labels,5)
  self.assertAlmostEqual(r['precision'],.6);self.assertEqual(r['recall'],1);self.assertAlmostEqual(r['ap'],(.5+.5+.6)/3)
  dcg=7/math.log2(3)+1/math.log2(4)+3/math.log2(5)+3/math.log2(6);idcg=7+3/math.log2(3)+3/math.log2(4)+1/math.log2(5);self.assertAlmostEqual(r['ndcg'],dcg/idcg)
 def test_ap_uses_only_top_k_and_min_r_k(self):
  labels={'a':3,'b':3,'c':2,'d':2,'e':2};self.assertEqual(metrics(list(labels),labels,3)['ap'],1)
  labels={'a':3,'b':0,'c':2,'d':0};self.assertEqual(metrics(['a','b','c','d'],labels,2)['ap'],.5)
  self.assertEqual(metrics(['a','b','c','d'],labels,2)['ap'],metrics(['a','b','d','c'],labels,2)['ap'])
 def test_no_binary_relevant_query_is_kept_and_ndcg_is_independent(self):
  r=metrics(['a','b'],{'a':1,'b':1},5);self.assertEqual(r['precision'],0);self.assertEqual(r['recall'],0);self.assertEqual(r['ap'],0);self.assertEqual(r['ndcg'],1)
  self.assertEqual(metrics(['a'],{'a':0},5)['ndcg'],0)
 def test_unjudged_duplicate_and_invalid_grade_fail(self):
  for ranking,labels in [(['a'],{'a':3,'b':2}),(['a','a'],{'a':2}),(['a'],{'a':4}),(['a'],{'a':True})]:
   with self.assertRaises(ValueError):metrics(ranking,labels,5)
if __name__=='__main__':unittest.main()
