"""Export auditable model scores alongside synthetic reference judgments."""
import argparse
import csv
import json
from pathlib import Path
from .evaluate_cv_reference import load_dataset

def summarize(dataset,run,output):
    _,cvs,jobs,labels=load_dataset(dataset)
    if output.exists():raise FileExistsError('Refuse to overwrite comparison evidence')
    metrics=json.loads((run/'metrics.json').read_text(encoding='utf8'))
    predictions=[json.loads(s) for s in (run/'predictions.jsonl').read_text(encoding='utf8').splitlines()]
    indexed={(r['cv_id'],r['engine']):r for r in predictions}
    output.mkdir(parents=True)
    fields=['cv_id','jd_id','reference_score','reference_grade','reference_reason','human_confirmed','tfidf_cosine','tfidf_rank','sbert_cosine','sbert_rank']
    with (output/'pair-comparison.csv').open('x',encoding='utf-8-sig',newline='') as f:
        writer=csv.DictWriter(f,fieldnames=fields);writer.writeheader()
        for label in labels:
            row=dict(cv_id=label['cv_id'],jd_id=label['jd_id'],reference_score=label['score'],reference_grade=label['grade'],reference_reason=label['rationale'],human_confirmed=False)
            for engine in ['tfidf','sbert']:
                ranking=indexed.get((label['cv_id'],engine),{}).get('ranking',[])
                item=next(((i,r) for i,r in enumerate(ranking,1) if r['id']==label['jd_id']),None)
                row[engine+'_cosine']=item[1]['cosine'] if item else ''
                row[engine+'_rank']=item[0] if item else ''
            writer.writerow(row)
    relevant={cv['id']:[r for r in labels if r['cv_id']==cv['id'] and r['grade']>=2] for cv in cvs}
    lines=['# Kết quả thực nghiệm 200 CV × 20 yêu cầu công việc','',
           'Đây là đối chiếu với nhãn tổng hợp theo thang tham chiếu, chưa có giảng viên xác nhận. Không phải độ chính xác trên người thật. Không huấn luyện hoặc thay model đang chạy.','',
           f"Có {len(cvs)} CV, {len(jobs)} JD, {len(labels)} cặp; {sum(bool(x) for x in relevant.values())} CV có ít nhất một đề tài đạt mức2/3, {sum(not x for x in relevant.values())} CV chưa có đề tài đạt mức này.",'',
           '| Phạm vi | Phương pháp | P@5 | R@5 | MAP | NDCG@5 | Thời gian trung bình (ms) |',
           '|---|---|---:|---:|---:|---:|---:|']
    for split in ['all','test']:
        for engine in ['tfidf','sbert']:
            part=metrics['engines'][engine]['groups'][split];m=part['metrics']
            if m:lines.append(f"| {split} ({part['metric_queries']} CV có đề tài phù hợp) | {engine} | {m['precision_at_k']:.4f} | {m['recall_at_k']:.4f} | {m['map']:.4f} | {m['ndcg_at_k']:.4f} | {part['mean_latency_ms']:.2f} |")
    lines.extend(['','P@5 chia đúng5. Mỗi CV có thể chỉ có1–2 đề tài phù hợp nên P@5 thấp không đồng nghĩa mất các đề tài phù hợp; luôn đọc cùng Recall@5 và MAP. CV không có đề tài đạt mức2 không tính vào MAP/Recall vì mẫu số bằng0, nhưng vẫn được chạy đầy đủ và báo riêng. NDCG dùng mức0–3 để đo thứ tự; P/R/MAP chỉ coi mức2–3 là phù hợp.','',
                  'TF-IDF tốt hơn Sentence-BERT trên bộ này. Không chỉnh nhãn để đảo kết quả: CV/JD được tạo từ cùng danh mục kỹ năng và mẫu câu nên có thiên lệch có lợi cho so từ khóa. Kết quả rất cao của TF-IDF không chứng minh hiệu quả thực tế. Chia nhóm CV120/40/40 tránh cùng family qua split, nhưng mẫu câu và catalog JD dùng chung, chưa độc lập về ngữ nghĩa. Không dùng tập test này để tinh chỉnh rồi báo lại như kiểm thử độc lập.','',
                  'Đo trên service đã nạp model, gọi tuần tự; không phải benchmark khởi động lạnh hay nhiều người đồng thời. Model Sentence-BERT multilingual MiniLM-L12-v2, ONNX CPU int8; xem revision/coverage/error trong metrics.json và predictions.jsonl. Cosine không phải xác suất trúng tuyển.','',
                  '## Ví dụ đối chiếu từng CV','',
                  '| CV | Hướng | Số đề tài đạt mức2–3 | Top1 TF-IDF | Top1 Sentence-BERT |',
                  '|---|---|---:|---|---|'])
    for cv in cvs:
        tops=[]
        for engine in ['tfidf','sbert']:
            rank=indexed.get((cv['id'],engine),{}).get('ranking',[])
            top=rank[0]['id'] if rank else 'BLOCKED'
            grade=next((r['grade'] for r in labels if r['cv_id']==cv['id'] and r['jd_id']==top),None)
            tops.append(f'{top} (mức {grade})')
        lines.append(f"| {cv['id']} | {cv['track']} | {len(relevant[cv['id']])} | {tops[0]} | {tops[1]} |")
    lines.extend(['','## Cách kiểm tra lại','',
                  'Mở CV trong `cvs/`, yêu cầu công việc trong `jobs.jsonl`, phiếu tham chiếu trong `reviews/`, bảng điểm và thứ hạng đầy đủ trong `pair-comparison.csv`. Người đánh giá độc lập dùng `human-review.csv` (các ô điểm/người chấm để trống), không xem thứ hạng trước khi chấm. Sau khi có xác nhận thật mới tạo phiên bản nhãn độc lập để chạy evaluator nghiệm thu hiện có; không tự đổi provenance cho bộ này.'])
    (output/'RESULTS.md').write_text('\n'.join(lines)+'\n',encoding='utf8')
    for name in ['metrics.json','predictions.jsonl']:
        with (output/name).open('xb') as f:f.write((run/name).read_bytes())
    print(str(output))

if __name__=='__main__':
    p=argparse.ArgumentParser();p.add_argument('--dataset',required=True);p.add_argument('--run',required=True);p.add_argument('--output',required=True);a=p.parse_args()
    summarize(Path(a.dataset),Path(a.run),Path(a.output))
