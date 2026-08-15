import { planP3Fit } from '../pipeline3/fit-planner.js';
import { updateJobDerivedAss } from '../pipeline3/subtitle-ass.js';

/** Pipeline 3 — focused final composition. P1/P2 source artifacts remain immutable. */
const EXPORT_QUALITY={balanced:{crf:20,preset:'medium'},high:{crf:18,preset:'slow'},very_high:{crf:16,preset:'slow'},max:{crf:14,preset:'slower'}};
function _durationSec(valueMs){return `${(Number(valueMs||0)/1000).toFixed(2)}s`;}
function _p3ArtifactDir(job){const p1Dir=String(job?.p1ArtifactDir||'').trim().replace(/[\\/]+$/,'');if(!p1Dir)return'';const parent=p1Dir.replace(/[\\/]+p1$/i,''),sep=p1Dir.includes('\\')?'\\':'/';return `${parent}${sep}p3`;}
function _srtTimeToMs(value){const m=String(value||'').match(/^(\d{2}):(\d{2}):(\d{2})[,.](\d{3})$/);if(!m)return null;return Number(m[1])*3600000+Number(m[2])*60000+Number(m[3])*1000+Number(m[4]);}
function _msToSrtTime(ms){const safe=Math.max(0,Math.round(Number(ms)||0)),h=Math.floor(safe/3600000),m=Math.floor((safe%3600000)/60000),s=Math.floor((safe%60000)/1000),mil=safe%1000;return `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')},${String(mil).padStart(3,'0')}`;}
function _scaleTimedSrt(srtText,scale){const safe=Number(scale);if(!String(srtText||'').trim()||!Number.isFinite(safe)||safe<=0)return String(srtText||'');return String(srtText).replace(/(\d{2}:\d{2}:\d{2}[,.]\d{3})\s*-->\s*(\d{2}:\d{2}:\d{2}[,.]\d{3})/g,(full,start,end)=>{const a=_srtTimeToMs(start.replace('.',',')),b=_srtTimeToMs(end.replace('.',','));return a==null||b==null?full:`${_msToSrtTime(a*safe)} --> ${_msToSrtTime(b*safe)}`;});}
function _exportQuality(config={}){return EXPORT_QUALITY[config.exportQuality]||EXPORT_QUALITY.high;}
function _baseName(pathValue){const raw=String(pathValue||'').replace(/\\/g,'/');return raw.split('/').pop()||'video.mp4';}
function _dirName(pathValue){const raw=String(pathValue||''),slash=Math.max(raw.lastIndexOf('/'),raw.lastIndexOf('\\'));return slash>=0?raw.slice(0,slash):'';}
function _joinPath(dir,file){const d=String(dir||'').replace(/[\\/]+$/,'');if(!d)return file;return `${d}${d.includes('\\')?'\\':'/'}${file}`;}
function _safeOutputName(value,fallback){const raw=String(value||'').trim().replace(/[<>:"/\\|?*\x00-\x1F]/g,'_').replace(/[. ]+$/g,'');const stem=(raw||fallback).replace(/\.mp4$/i,'');return `${stem||'video_final'}.mp4`;}
function _getFinalOutputPath(job){const config=job?.p3Config||{},source=job?.filePath||job?.p3CleanVideoPath||job?.outputPath||'video.mp4',fallback=`${_baseName(source).replace(/\.[^.]+$/,'')}_final.mp4`,file=_safeOutputName(config.outputFileName,fallback),dir=String(config.outputDirectory||'').trim()||_dirName(source);return _joinPath(dir,file);}
function _samePath(a,b){const norm=value=>String(value||'').trim().replace(/\\/g,'/').replace(/\/+$/,'').toLowerCase();return Boolean(norm(a)&&norm(a)===norm(b));}

function _resolveFitPlan(config,videoMs,voiceMs){
  let plan=planP3Fit(videoMs,voiceMs,config.fitMode||'auto');
  const needsVideoRetime=plan.ok&&Math.abs(Number(plan.videoSpeed||1)-1)>=.02;
  if(needsVideoRetime&&Number(config.bgVolume)>0&&!config.removeVocal){
    if((config.fitMode||'auto')==='auto'){
      const voiceOnly=planP3Fit(videoMs,voiceMs,'fit_voice');
      if(voiceOnly.ok)plan={...voiceOnly,mode:'auto',selectedStrategy:'fit_voice',reason:'Auto dùng Fit Voice vì video retime + audio gốc chưa có đường retime nền an toàn.'};
      else plan={...plan,ok:false,reason:'Video retime + audio gốc > 0 hiện cần bật Xóa giọng gốc hoặc đặt âm nền = 0.'};
    }else plan={...plan,ok:false,reason:'Video retime + audio gốc > 0 hiện cần bật Xóa giọng gốc hoặc đặt âm nền = 0.'};
  }
  return plan;
}

async function _prepareP3Voice(job,p1Audio,sourceTimedSrt,plan){
  const originalMs=Number(job?.ttsAudioDurMs)||0,requestedSpeed=Number(plan?.voiceSpeed)||1;
  if(!(originalMs>0)||Math.abs(requestedSpeed-1)<.001)return{ok:true,audioPath:p1Audio,timedSrt:sourceTimedSrt,durationMs:originalMs,tempo:1};
  const artifactDir=_p3ArtifactDir(job);if(!artifactDir)return{ok:false,error:'Không xác định được thư mục artifact P3 để tạo derived voice.'};
  if(!window.electronAPI?.prepareP1NarrationAudio)return{ok:false,error:'Bridge pitch-preserving voice tempo chưa sẵn sàng.'};
  const prepared=await window.electronAPI.prepareP1NarrationAudio({source_path:p1Audio,artifact_dir:artifactDir,speed:requestedSpeed});
  if(!prepared?.ok||!prepared?.audio_path||!(Number(prepared.duration_ms)>0))return{ok:false,error:prepared?.error||'Không tạo được derived voice P3.'};
  const adjustedMs=Number(prepared.duration_ms),timingScale=adjustedMs/originalMs;let timedSrt=sourceTimedSrt;
  if(timedSrt){timedSrt=_scaleTimedSrt(timedSrt,timingScale);const sep=artifactDir.includes('\\')?'\\':'/',srtPath=`${artifactDir}${sep}tts_timed.srt`,save=await window.api.writeFile(srtPath,timedSrt);if(save?.status==='error')return{ok:false,error:save.error||'Không lưu được P3 timed SRT.'};job.p3RenderTimedSrt=timedSrt;job.p3TimedSrtPath=srtPath;}
  job.p3VoiceAudioPath=prepared.audio_path;job.p3VoiceDurMs=adjustedMs;job.p3VoiceTempo=requestedSpeed;
  _addLog(`[Finalize] ✅ Voice tempo ${requestedSpeed.toFixed(4)}x: ${_durationSec(originalMs)} → ${_durationSec(adjustedMs)}.`,'success');
  return{ok:true,audioPath:prepared.audio_path,timedSrt,durationMs:adjustedMs,tempo:requestedSpeed};
}

async function _prepareP3Video(job,baseVideo,videoInfo,plan,bgVolume,removeVocal){
  const requestedSpeed=Number(plan?.videoSpeed)||1;
  if(Math.abs(requestedSpeed-1)<.02)return{ok:true,videoPath:baseVideo,durationMs:Number(videoInfo?.duration||0)*1000,tempo:1,adjusted:false};
  if(Number(bgVolume)>0&&!removeVocal)return{ok:false,error:'Video retime + audio gốc > 0 cần bật Xóa giọng gốc hoặc đặt âm nền = 0 để tránh mất/lệch audio nền.'};
  const sourceMs=Number(videoInfo?.duration||0)*1000;if(!(sourceMs>0))return{ok:false,error:'Không đọc được duration clean video.'};
  if(!window.electronAPI?.retimeP3Video)return{ok:false,error:'P3 export bridge chưa sẵn sàng để retime video theo chất lượng đã chọn.'};
  const outputPath=String(baseVideo).replace(/\.[^.]+$/,'')+'_p3_tempo.mp4',quality=_exportQuality(job?.p3Config);
  const res=await window.electronAPI.retimeP3Video({videoPath:baseVideo,outputPath,speed:requestedSpeed,crf:quality.crf,preset:quality.preset});
  if(!res?.ok||!res.output_path)return{ok:false,error:res?.error||'Không retime được video P3.'};
  job.p3VideoTempoPath=res.output_path;job.p3VideoTempo=Number(res.speed_ratio)||requestedSpeed;const durationMs=sourceMs/job.p3VideoTempo;
  _addLog(`[Finalize] ✅ Video tempo ${job.p3VideoTempo.toFixed(4)}x · CRF ${quality.crf}/${quality.preset}: ${_durationSec(sourceMs)} → ~${_durationSec(durationMs)}.`,'success');
  return{ok:true,videoPath:res.output_path,durationMs,tempo:job.p3VideoTempo,adjusted:Boolean(res.adjusted)};
}

async function _prepareBackground(job,baseVideo,videoFit,bgVol,removeVocal){
  if(!removeVocal||!(bgVol>0))return{ok:true,audioPath:null};
  _addLog('[Finalize] 🎵 Tách giọng gốc bằng Demucs để giữ nhạc nền...','info');
  const vocalRes=await window.api.removeVocal(baseVideo);
  if(vocalRes?.status!=='ok'||!vocalRes.audio_path)return{ok:false,error:vocalRes?.error||vocalRes?.message||'Demucs không tách được audio nền.'};
  const method=String(vocalRes.method_used||'unknown');
  if(method!=='demucs')return{ok:false,error:`Xóa giọng gốc yêu cầu Demucs. Backend chỉ trả về ${method}; P3 đã chặn để không trộn giọng gốc trở lại.`};
  _addLog('[Finalize] ✅ Vocal separation method=demucs; dùng no-vocals stem.','success');
  let audioPath=vocalRes.audio_path;
  if(videoFit.adjusted&&Math.abs(Number(videoFit.tempo||1)-1)>=.02){
    if(!window.electronAPI?.applyVoiceTempo)return{ok:false,error:'Bridge audio tempo chưa sẵn sàng để đồng bộ nền với video retime.'};
    const tempoRes=await window.electronAPI.applyVoiceTempo(audioPath,videoFit.tempo);
    if(!tempoRes?.ok||!tempoRes.output_path)return{ok:false,error:tempoRes?.error||'Không retime được audio nền.'};
    audioPath=tempoRes.output_path;
    _addLog(`[Finalize] ✅ Audio nền retime ${Number(videoFit.tempo).toFixed(4)}x theo video.`,'success');
  }
  return{ok:true,audioPath};
}

export async function finalizeVideo(job){
  const baseVideo=job.p3CleanVideoPath||job.outputPath;let ttsAudio=job.ttsAudioPath,timedSrt=job.p3BaseTimedSrt||job.ttsTimedSrt||job.p3TimedSrt;
  if(!baseVideo){_addLog('[Finalize] ❌ Chưa có clean video từ Pipeline 2.','error');return false;}
  if(!ttsAudio){_addLog('[Finalize] ⚠️ Không có TTS; chỉ burn subtitle nếu được bật.','warning');if(job.voiceSub&&timedSrt)return _burnSubOnly(job,baseVideo,timedSrt);return false;}
  const config=job.p3Config||{},bgVol=Math.max(0,Math.min(100,Number(config.bgVolume??localStorage.getItem('tts_bg_volume')??10))),removeVocal=Boolean(config.removeVocal??(localStorage.getItem('tts_remove_vocal')==='true')),quality=_exportQuality(config),finalOutput=_getFinalOutputPath(job);
  if(_samePath(finalOutput,baseVideo)||_samePath(finalOutput,job.filePath)){_addLog('[Finalize] ❌ Đường dẫn đầu ra không được ghi đè video nguồn/P2 clean video. Hãy đổi tên file hoặc thư mục xuất.','error');return false;}
  const info=await window.api.videoInfo(baseVideo),videoMs=Number(info?.duration||0)*1000,voiceMs=Number(job.ttsAudioDurMs)||0,plan=_resolveFitPlan({...config,bgVolume:bgVol,removeVocal},videoMs,voiceMs);job.p3FitPlan=plan;
  if(!plan.ok){_addLog('[Finalize] ❌ Fit bị chặn: '+plan.reason,'error');return false;}
  _addLog(`[Finalize] 🚀 P3 final: strategy=${plan.selectedStrategy||plan.mode}; voice=${plan.voiceSpeed.toFixed(3)}x; video=${plan.videoSpeed.toFixed(3)}x; H.264 CRF=${quality.crf}/${quality.preset}; output=${finalOutput}`,'info');

  let videoFit;try{videoFit=await _prepareP3Video(job,baseVideo,info,plan,bgVol,removeVocal);if(!videoFit.ok)throw new Error(videoFit.error);}catch(e){_addLog('[Finalize] ❌ Video-fit: '+e.message,'error');return false;}
  let voiceFit;try{voiceFit=await _prepareP3Voice(job,ttsAudio,timedSrt,plan);if(!voiceFit.ok)throw new Error(voiceFit.error);ttsAudio=voiceFit.audioPath;timedSrt=voiceFit.timedSrt||timedSrt;}catch(e){_addLog('[Finalize] ❌ Voice-fit: '+e.message,'error');return false;}
  let background;try{background=await _prepareBackground(job,baseVideo,videoFit,bgVol,removeVocal);if(!background.ok)throw new Error(background.error);}catch(e){_addLog('[Finalize] ❌ Audio nền: '+e.message,'error');return false;}

  const hasSubtitle=Boolean(job.voiceSub&&timedSrt),videoForMix=videoFit.videoPath,videoWithVoice=hasSubtitle?job.filePath.replace(/\.[^.]+$/,'')+'_with_voice.mp4':finalOutput;let mergeRes;
  try{if(background.audioPath){mergeRes=await fetch(`${window.api.base}/api/mix-audio-tracks`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({video_path:videoForMix,tts_path:ttsAudio,bg_audio_path:background.audioPath,output_path:videoWithVoice,bg_volume:bgVol})}).then(r=>r.json());}else mergeRes=await window.api.replaceAudio(videoForMix,ttsAudio,videoWithVoice,bgVol);}catch(e){_addLog('[Finalize] ❌ Ghép audio lỗi: '+e.message,'error');return false;}
  if(!mergeRes||mergeRes.status!=='ok'){_addLog('[Finalize] ❌ Ghép audio thất bại: '+(mergeRes?.error||'Unknown'),'error');return false;}

  if(hasSubtitle){const success=await _burnSubtitle(job,videoWithVoice,finalOutput,timedSrt);if(!success){_addLog('[Finalize] ❌ Final render bị chặn vì subtitle burn thất bại.','error');return false;}job.finalOutputPath=finalOutput;}else job.finalOutputPath=finalOutput;
  job.outputPath=job.finalOutputPath;_addLog('[Finalize] 🎉 Hoàn tất! Video: '+job.finalOutputPath,'success');_showFinalOutputButton(job.finalOutputPath);window.renderJobList?.();window.updateStartButton?.();return true;
}

async function _burnSubOnly(job,videoPath,timedSrt){const finalOutput=_getFinalOutputPath(job);if(_samePath(finalOutput,videoPath)||_samePath(finalOutput,job.filePath)){_addLog('[Finalize] ❌ Đường dẫn đầu ra không được ghi đè video nguồn/P2 clean video.','error');return false;}const success=await _burnSubtitle(job,videoPath,finalOutput,timedSrt);if(!success)return false;job.finalOutputPath=finalOutput;job.outputPath=finalOutput;_showFinalOutputButton(finalOutput);window.renderJobList?.();return true;}
async function _burnSubtitle(job,videoPath,outputPath,srtContent){
  _addLog('[Finalize] 📝 Burn subtitle final...','info');
  const config=job.p3Config||{},quality=_exportQuality(config);let info=job.p3VideoInfo||{};
  if(!(Number(info.width)>0&&Number(info.height)>0)){try{info=await window.api.videoInfo(videoPath);}catch{info={};}}
  const sourceSrt=job.p3BaseTimedSrt||job.ttsTimedSrt||'',timingChanged=String(srtContent||'').trim()!==String(sourceSrt||'').trim(),renderConfig=timingChanged?{...config,preserveKaraoke:false}:config;
  if(String(srtContent||'').trim()&&Number(info.width)>0&&Number(info.height)>0)job.p3AssTimedSrt=srtContent;
  let assContent='';
  try{assContent=updateJobDerivedAss(job,renderConfig,Number(info.width)||1920,Number(info.height)||1080);}finally{delete job.p3AssTimedSrt;}
  if(timingChanged&&config.preserveKaraoke&&job.p3OriginalKaraokeAss)_addLog('[P3] Timing final đã đổi: rebuild ASS từ SRT final để tránh lệch karaoke timing P1.','info');
  assContent=String(assContent||job.karaokeAss||job.p3DerivedAss||'').trim();
  if(!assContent){_addLog('[Finalize] ❌ Không có derived ASS P3; chặn burn để tránh preview/final lệch.','error');return false;}
  if(!window.electronAPI?.burnP3SubtitleHq){_addLog('[Finalize] ❌ P3 high-quality export bridge chưa sẵn sàng.','error');return false;}
  try{
    const res=await window.electronAPI.burnP3SubtitleHq({videoPath,assContent,outputPath,crf:quality.crf,preset:quality.preset});
    if(res?.ok){_addLog(`[Finalize] ✅ Burn subtitle H.264 CRF ${quality.crf}/${quality.preset} thành công.`,'success');return true;}
    _addLog('[Finalize] ❌ Burn subtitle thất bại: '+(res?.error||'Unknown'),'error');return false;
  }catch(e){_addLog('[Finalize] ❌ Burn subtitle lỗi: '+e.message,'error');return false;}
}
function _showFinalOutputButton(filePath){if(!window.electronAPI?.openPath)return;document.getElementById('btn-open-final-output')?.remove();const btn=document.createElement('button');btn.id='btn-open-final-output';btn.className='btn btn-accent btn-block';btn.style.marginTop='8px';btn.textContent='📂 Mở video hoàn chỉnh';btn.onclick=()=>window.electronAPI.openPath(filePath);document.getElementById('progress-section')?.appendChild(btn);}
function _addLog(msg,type){if(typeof window.addLog==='function')window.addLog(msg,type);else console.log(`[${type}] ${msg}`);}
export{_scaleTimedSrt,_prepareP3Voice,_prepareP3Video,_prepareBackground,_resolveFitPlan,_getFinalOutputPath};
