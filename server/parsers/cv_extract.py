"""Private, bounded CV text extraction adapter. No AI, OCR, network or DB writes."""
import sys,json,base64,io,zipfile,re,xml.etree.ElementTree as ET

MAX_TEXT=50000
def extract(data,kind):
    if kind=='docx':
        if not data.startswith(b'PK\x03\x04'):raise ValueError('DOCX không đúng định dạng ZIP')
        with zipfile.ZipFile(io.BytesIO(data)) as z:
            items=z.infolist();names=[i.filename for i in items]
            if len(items)>100 or len(set(names))!=len(names) or sum(i.file_size for i in items)>8*1024*1024:raise ValueError('DOCX vượt giới hạn cấu trúc')
            if 'word/document.xml' not in names or '[Content_Types].xml' not in names:raise ValueError('Không phải tài liệu Word DOCX')
            for i in items:
                name=i.filename.replace('\\','/').lower()
                if name.startswith('/') or '..' in name.split('/') or i.flag_bits&1 or i.file_size>2*1024*1024 or i.file_size>100*max(i.compress_size,1):raise ValueError('DOCX nén hoặc đường dẫn không an toàn')
                if any(s in name for s in ['vbaproject','/embeddings/','/activex/']):raise ValueError('DOCX chứa macro hoặc nội dung nhúng')
                if name.endswith(('.xml','.rels')):
                    content=z.read(i)
                    if re.search(br'<!\s*(DOCTYPE|ENTITY)',content.replace(b'\x00',b''),re.I):raise ValueError('XML chứa DTD/entity không được phép')
                    if name.endswith('.rels'):
                        rel=ET.fromstring(content)
                        if any(e.attrib.get('TargetMode','').lower()=='external' for e in rel.iter()):raise ValueError('DOCX chứa liên kết ngoài')
            node=ET.fromstring(z.read('word/document.xml'))
            for element in node.iter():
                tag=element.tag.rsplit('}',1)[-1]
                if tag in ['altChunk','object','control']:raise ValueError('DOCX chứa nội dung chủ động')
                if tag in ['fldSimple','instrText']:
                    instruction=' '.join(element.attrib.values())+' '+''.join(element.itertext())
                    if re.search(r'\b(DDEAUTO|DDE|INCLUDETEXT|INCLUDEPICTURE|DATABASE|LINK)\b',instruction,re.I):raise ValueError('DOCX chứa field chủ động')
            text='\n'.join(''.join(e.itertext()) for e in node.iter('{http://schemas.openxmlformats.org/wordprocessingml/2006/main}p'))
            parser='docx-stdlib-v1'
    elif kind=='pdf':
        if not data.startswith(b'%PDF-'):raise ValueError('PDF không đúng magic bytes')
        try:
            import pypdf
            import pypdf.filters
        except ImportError:
            return {'error':'PDF parser chưa được cài đặt trong môi trường cô lập','unavailable':True}
        pypdf.overwrite_configuration(
            maximum_declared_stream_length=8*1024*1024,
            array_based_stream_maximum_output_length=8*1024*1024,
            zlib_maximum_output_length=8*1024*1024,
            lzw_maximum_output_length=8*1024*1024,
            run_length_maximum_output_length=8*1024*1024,
            jbig2_maximum_output_length=8*1024*1024,
            brotli_maximum_output_length=8*1024*1024,
            image_maximum_buffer_size=8*1024*1024,
            stream_decoding_work_maximum_length=16*1024*1024,
            stream_parsing_work_maximum_count=200000,
            array_maximum_element_count=10000,
            dictionary_maximum_element_count=10000,
            page_tree_maximum_entries=128,
            page_tree_maximum_depth=32,
            page_tree_maximum_page_entries=2000,
            xform_maximum_invocations_per_extraction=100,
            jbig2dec_binary=None,
        )
        reader=pypdf.PdfReader(io.BytesIO(data),strict=True)
        if reader.is_encrypted:raise ValueError('PDF mã hóa không được hỗ trợ')
        root=reader.trailer['/Root'];names=root.get('/Names',{})
        if hasattr(names,'get_object'):names=names.get_object()
        if any(k in root for k in ['/OpenAction','/AA','/AcroForm']) or any(k in names for k in ['/JavaScript','/EmbeddedFiles']):raise ValueError('PDF chứa nội dung chủ động hoặc tệp nhúng')
        if not 1<=len(reader.pages)<=20:raise ValueError('PDF phải có từ1 đến20 trang')
        texts=[]
        for page in reader.pages:
            if page.get('/AA'):raise ValueError('PDF chứa hành động tự động')
            for annotation in page.get('/Annots',[]):
                annotation=annotation.get_object()
                if annotation.get('/A') or annotation.get('/AA') or annotation.get('/FS') or annotation.get('/Subtype') in ['/RichMedia','/Screen','/Movie','/Sound','/3D','/FileAttachment']:raise ValueError('PDF chứa action hoặc attachment')
            texts.append(page.extract_text() or '')
            if sum(map(len,texts))>MAX_TEXT:raise ValueError('Nội dung CV quá dài')
        text='\n'.join(texts);parser='pypdf-'+pypdf.__version__
    else:raise ValueError('Chỉ hỗ trợ PDF hoặc DOCX')
    text=''.join(c for c in text if c in '\n\t' or ord(c)>=32).strip()
    if not text:raise ValueError('Không trích được văn bản; PDF scan cần OCR ở phase sau')
    if len(text)>MAX_TEXT:raise ValueError('Nội dung CV quá dài')
    return {'text':text,'parser':parser,'characters':len(text)}

if __name__=='__main__':
    try:
        raw=sys.stdin.buffer.read(3*1024*1024+1)
        if len(raw)>3*1024*1024:raise ValueError('Input quá lớn')
        request=json.loads(raw);data=base64.b64decode(request['data'],validate=True)
        if len(data)>2*1024*1024:raise ValueError('Tệp vượt2MiB')
        result=extract(data,request['kind'])
    except (ValueError,KeyError,zipfile.BadZipFile,ET.ParseError):result={'error':'Tệp không hợp lệ, có nội dung không an toàn hoặc vượt giới hạn'}
    except Exception:result={'error':'Không thể xử lý tài liệu này an toàn'}
    sys.stdout.write(json.dumps(result,ensure_ascii=True))
