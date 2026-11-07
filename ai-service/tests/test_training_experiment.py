import copy
import unittest
from training.build_synthetic import build
from training.experiment import validate

class TrainingSafetyTests(unittest.TestCase):
    def test_requires_explicit_synthetic_mode(self):
        with self.assertRaisesRegex(ValueError, 'requires'):
            validate(build())

    def test_student_leakage_rejected(self):
        rows=build()
        row=copy.deepcopy(rows[0]); row['id']='extra'; row['split']='test'
        with self.assertRaisesRegex(ValueError, 'leakage'):
            validate(rows+[row], allow_synthetic=True)

    def test_copied_text_across_students_rejected(self):
        rows=build()
        rows[-1]['report_text']=rows[0]['report_text']
        with self.assertRaisesRegex(ValueError, 'leakage'):
            validate(rows, allow_synthetic=True)

    def test_cannot_disguise_synthetic_as_real(self):
        rows=build(); rows[0]['synthetic']=False
        with self.assertRaisesRegex(ValueError, 'separate review'):
            validate(rows, allow_synthetic=True)

    def test_complete_dataset_has_disjoint_students(self):
        rows=build(); validate(rows, allow_synthetic=True)
        self.assertEqual(len(rows),240)
        groups={s:{r['student_id'] for r in rows if r['split']==s} for s in ['train','validation','test']}
        self.assertFalse(groups['train'] & groups['test'])
        self.assertFalse(groups['validation'] & groups['test'])

    def test_thousand_reports_have_balanced_splits(self):
        rows=build(500); validate(rows, allow_synthetic=True)
        self.assertEqual(len(rows),1000)
        for split, expected in [('train',600),('validation',200),('test',200)]:
            part=[r for r in rows if r['split']==split]
            self.assertEqual(len(part),expected)
            self.assertEqual(sum(r['label']=='on_track' for r in part),expected//2)

if __name__=='__main__':
    unittest.main()
