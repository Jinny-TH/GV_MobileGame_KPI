import { useState } from 'react';
import { Database, FileSpreadsheet, RefreshCw, UploadCloud } from 'lucide-react';
import { importPreviewToSupabase, previewExcelImport, type ImportPreview } from '../services/importService';

type Props = { onImported: () => void };

export function AdminImport({ onImported }: Props) {
  const [fileName, setFileName] = useState('');
  const [preview, setPreview] = useState<ImportPreview | null>(null);
  const [status, setStatus] = useState('');
  const [busy, setBusy] = useState(false);

  async function handleFile(file?: File) {
    if (!file) return;
    setBusy(true);
    setStatus('엑셀 파일 분석 중...');
    setFileName(file.name);
    try {
      const result = await previewExcelImport(file);
      setPreview(result);
      setStatus('분석 완료. 미리보기를 확인한 뒤 DB 저장을 눌러줘.');
    } catch (e: any) {
      setStatus(`분석 실패: ${e.message || e}`);
      setPreview(null);
    } finally {
      setBusy(false);
    }
  }

  async function saveToDb() {
    if (!preview) return;
    setBusy(true);
    setStatus('Supabase DB 저장 중...');
    try {
      const result = await importPreviewToSupabase(preview);
      setStatus(result.message);
      if (result.ok) onImported();
    } catch (e: any) {
      setStatus(`DB 저장 실패: ${e.message || e}. Supabase RLS 정책 또는 환경변수를 확인해줘.`);
    } finally {
      setBusy(false);
    }
  }

  return <section className="panel full admin-import">
    <div className="panel-head">
      <div>
        <small>ADMIN · EXCEL IMPORT</small>
        <h3>Excel 업로드로 런칭 KPI DB 업데이트</h3>
        <p>GGT KPI 엑셀 파일을 선택하면 ALL KPI 비교, 사전예약, Retention 시트를 분석해서 Supabase에 저장합니다.</p>
      </div>
      <span className="pill">Currency: USD / 1 USD = 1,300 KRW</span>
    </div>

    <label className={`upload-box ${busy ? 'busy' : ''}`}>
      <UploadCloud size={34}/>
      <b>{fileName || '엑셀 파일을 선택하거나 드래그해서 업로드'}</b>
      <span>.xlsx / .xls 지원 · 기존 데이터는 game code + period 기준으로 업데이트</span>
      <input type="file" accept=".xlsx,.xls" onChange={e => handleFile(e.target.files?.[0])} disabled={busy}/>
    </label>

    {status && <div className="import-status">{busy ? <RefreshCw size={16} className="spin"/> : <Database size={16}/>} {status}</div>}

    {preview && <>
      <div className="import-summary">
        <div><FileSpreadsheet size={20}/><span>Games</span><b>{preview.games.length}</b></div>
        <div><FileSpreadsheet size={20}/><span>Launch KPI</span><b>{preview.launchKpis.length}</b></div>
        <div><FileSpreadsheet size={20}/><span>Retention</span><b>{preview.retention.length}</b></div>
        <div><FileSpreadsheet size={20}/><span>Pre-registration</span><b>{preview.preRegistration.length}</b></div>
      </div>

      {preview.warnings.length > 0 && <div className="warning compact">
        {preview.warnings.map((w, i) => <div key={i}>⚠️ {w}</div>)}
      </div>}

      <div className="preview-table">
        <h4>미리보기 · 게임</h4>
        <table><thead><tr><th>Code</th><th>Title</th><th>Region</th><th>Launch</th></tr></thead><tbody>
          {preview.games.slice(0, 8).map(g => <tr key={g.code}><td>{g.code}</td><td>{g.title}</td><td>{g.region || '-'}</td><td>{g.launch_date || '-'}</td></tr>)}
        </tbody></table>
      </div>

      <button className="wide save-db" onClick={saveToDb} disabled={busy}>Supabase DB 저장</button>
    </>}
  </section>;
}
