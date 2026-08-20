const fs = require('fs');
const path = require('path');
const { spawn, spawnSync } = require('child_process');

const ROOT = 'C:\\VSR-EchoMimicV3';
const REPO = path.join(ROOT, 'repo');
const PYTHON = path.join(ROOT, 'venv', 'Scripts', 'python.exe');
const FLASH = path.join(ROOT, 'flash');
const LOW_VRAM_MARKER = 'VSR_LOW_VRAM_OFFLOAD_V2';
const LONG_AUDIO_MARKER = 'VSR_LONG_AUDIO_V2';
const SELECTIVE_MARKER = 'VSR_SELECTIVE_GPU_V4';
const FULL_GPU_BENCH_FRAMES = '45';
let activeChild = null;

function assets() {
  return {
    script: path.join(REPO, 'infer_flash.py'),
    pipeline: path.join(REPO, 'src', 'pipeline_wan_fun_inpaint_audio_2512.py'),
    config: path.join(REPO, 'config', 'config.yaml'),
    model: path.join(FLASH, 'Wan2.1-Fun-V1.1-1.3B-InP'),
    audio: path.join(FLASH, 'chinese-wav2vec2-base'),
    transformer: path.join(FLASH, 'transformer', 'diffusion_pytorch_model.safetensors'),
  };
}

function status() {
  const a = assets();
  const required = [PYTHON,a.script,a.pipeline,a.config,path.join(a.model,'config.json'),path.join(a.model,'diffusion_pytorch_model.safetensors'),path.join(a.model,'Wan2.1_VAE.pth'),path.join(a.model,'models_t5_umt5-xxl-enc-bf16.pth'),path.join(a.model,'models_clip_open-clip-xlm-roberta-large-vit-huge-14.pth'),path.join(a.audio,'config.json'),a.transformer];
  const missing = required.filter(x => !fs.existsSync(x));
  let runtimeSource = '', pipelineSource = '';
  if (fs.existsSync(a.script)) { try { runtimeSource = fs.readFileSync(a.script,'utf8'); } catch (_) {} }
  if (fs.existsSync(a.pipeline)) { try { pipelineSource = fs.readFileSync(a.pipeline,'utf8'); } catch (_) {} }
  const lowVramPatched = runtimeSource.includes(LOW_VRAM_MARKER);
  const longAudioPatched = runtimeSource.includes(LONG_AUDIO_MARKER);
  const fullGpuModeReady = runtimeSource.includes('full GPU mode enabled');
  const selectiveGpuReady = runtimeSource.includes(SELECTIVE_MARKER) && pipelineSource.includes(SELECTIVE_MARKER);
  if (!lowVramPatched) missing.push('EchoMimicV3 low-VRAM runtime patch V2');
  if (!longAudioPatched) missing.push('EchoMimicV3 long-audio runtime patch V2');
  if (!fullGpuModeReady) missing.push('EchoMimicV3 full GPU runtime mode');
  return { ok: missing.length === 0, name:'EchoMimicV3 Flash', runtimeRoot:ROOT, missing, running:Boolean(activeChild), lowVramPatched, longAudioPatched, fullGpuModeReady, selectiveGpuReady };
}

function safeFile(value, exts, label) {
  const file = path.resolve(String(value || ''));
  if (!file || !fs.existsSync(file) || !fs.statSync(file).isFile()) throw new Error(`Không tìm thấy ${label}.`);
  if (!exts.includes(path.extname(file).toLowerCase())) throw new Error(`${label} không đúng định dạng.`);
  return file;
}
function copyInput(source, dir, stem) { const target=path.join(dir,`${stem}${path.extname(source).toLowerCase()}`); fs.copyFileSync(source,target); return target; }
function findNewestMp4(dir) { if(!fs.existsSync(dir)) return ''; return fs.readdirSync(dir).filter(x=>x.toLowerCase().endsWith('.mp4')).map(x=>path.join(dir,x)).filter(x=>fs.statSync(x).isFile()).sort((a,b)=>fs.statSync(b).mtimeMs-fs.statSync(a).mtimeMs)[0]||''; }

async function generate(event, payload={}) {
  if (activeChild) return {ok:false,error:'Đang có một EchoMimicV3 job chạy.'};
  const ready=status();
  if(!ready.ok) return {ok:false,error:'EchoMimicV3 Flash full-GPU benchmark chưa sẵn sàng. Chạy setup/upgrade runtime trước.',status:ready};
  let image,audio;
  try { image=safeFile(payload.imagePath,['.jpg','.jpeg','.png','.webp','.bmp'],'ảnh nhân vật'); audio=safeFile(payload.audioPath,['.wav','.mp3','.m4a','.flac','.ogg','.aac'],'voice'); } catch(error){ return {ok:false,error:error.message}; }
  const runId=`echo-${Date.now()}`;
  const runDir=path.join(ROOT,'runs',runId); const outputDir=path.join(runDir,'output'); fs.mkdirSync(outputDir,{recursive:true});
  image=copyInput(image,runDir,'portrait'); audio=copyInput(audio,runDir,'voice');
  const a=assets(); const emit=(type,message)=>{ if(message&&!event.sender.isDestroyed()) event.sender.send('talking-portrait:progress',{runId,type,message:String(message).trim()}); };
  emit('info','Engine: EchoMimicV3 Flash · upstream pinned · 8-step');
  emit('info',`Input staged: ${image}`); emit('info',`Voice staged: ${audio}`);
  emit('info',`Owner full-GPU benchmark: 768x768 · 25 FPS · ${FULL_GPU_BENCH_FRAMES}-frame chunks · all heavy pipeline models resident on CUDA · TeaCache on GPU · no CPU offload. Stop after chunk 1 timing is captured.`);
  const args=[a.script,'--image_path',image,'--audio_path',audio,'--prompt','A natural person is speaking with realistic facial expressions, subtle head movement, blinking and conversational emotion.','--num_inference_steps','8','--config_path',a.config,'--model_name',a.model,'--transformer_path',a.transformer,'--save_path',outputDir,'--wav2vec_model_dir',a.audio,'--sampler_name','Flow_Unipc','--video_length',FULL_GPU_BENCH_FRAMES,'--guidance_scale','5.0','--audio_guidance_scale','2.0','--audio_scale','1.0','--neg_scale','1.0','--neg_steps','0','--seed','43','--enable_teacache','--teacache_threshold','0.1','--num_skip_start_steps','5','--GPU_memory_mode','full_gpu','--ulysses_degree','1','--ring_degree','1','--weight_dtype','bfloat16','--sample_size','768','768','--fps','25','--add_prompt','','--negative_prompt','static face, frozen expression, stiff head, bad mouth, deformed face, jitter','--shift','5.0'];
  return new Promise(resolve=>{
    let stdout='',stderr='',settled=false;
    const child=spawn(PYTHON,args,{cwd:REPO,windowsHide:true,env:{...process.env,PYTHONUTF8:'1',PYTHONIOENCODING:'utf-8'}}); activeChild=child;
    child.stdout.on('data',c=>{const t=c.toString(); stdout+=t; emit('info',t);}); child.stderr.on('data',c=>{const t=c.toString(); stderr+=t; emit('info',t);});
    child.on('error',error=>{if(activeChild===child)activeChild=null;if(!settled){settled=true;resolve({ok:false,runId,error:`Không khởi động được EchoMimicV3: ${error.message}`});}});
    child.on('close',code=>{if(activeChild===child)activeChild=null;if(settled)return;const outputPath=findNewestMp4(outputDir);if(code!==0||!outputPath){settled=true;const combined=`${stderr}\n${stdout}`;const isOom=/CUDA out of memory|torch\.OutOfMemoryError/i.test(combined);const tail=(stderr||stdout).trim().split(/\r?\n/).slice(-20).join('\n');resolve({ok:false,runId,error:isOom?`EchoMimicV3 full-GPU ${FULL_GPU_BENCH_FRAMES}-frame benchmark OOM. Dừng retry; PM sẽ quyết định giảm chunk có kiểm soát.`:(tail||`EchoMimicV3 kết thúc với mã ${code}.`),code,outputDir,oom:isOom});return;} settled=true;emit('success',`EchoMimicV3 hoàn tất: ${outputPath}`);resolve({ok:true,runId,outputPath,outputDir,engine:'echomimicv3',ratio:'source',profile:`flash-8step-768-full-gpu-${FULL_GPU_BENCH_FRAMES}f`});});
  });
}
function cancel(){
  if(!activeChild)return{ok:true,cancelled:false};
  try {
    const pid=activeChild.pid;
    if(process.platform==='win32' && pid){
      const result=spawnSync('taskkill',['/PID',String(pid),'/T','/F'],{windowsHide:true});
      const accepted=result.status===0;
      return {ok:accepted,cancelled:accepted,pid};
    }
    const accepted=activeChild.kill('SIGTERM');
    return {ok:accepted,cancelled:accepted,pid};
  } catch(error){return{ok:false,error:error.message};}
}
module.exports={status,generate,cancel};
