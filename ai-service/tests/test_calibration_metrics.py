import unittest
from training.calibrate_synthetic import calibration_metrics

class CalibrationMetricsTests(unittest.TestCase):
    def test_perfect_predictions(self):
        r=calibration_metrics([0,1],[0,1]);self.assertEqual(r['brier'],0);self.assertEqual(r['ece'],0)

    def test_known_constant_probability(self):
        r=calibration_metrics([0,0,1,1],[.5,.5,.5,.5]);self.assertEqual(r['brier'],.25);self.assertEqual(r['ece'],0)

    def test_wrong_confident_predictions_are_bad(self):
        r=calibration_metrics([0,1],[1,0]);self.assertEqual(r['brier'],1);self.assertEqual(r['ece'],1)

    def test_reject_invalid_values(self):
        for y,p in [([],[]),([0],[float('nan')]),([0],[1.1]),([0,1],[.5])]:
            with self.assertRaises(ValueError):calibration_metrics(y,p)
