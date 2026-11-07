param([switch]$ExperimentalRisk)
$ErrorActionPreference='Stop'
$projectRoot=[IO.Path]::GetFullPath((Join-Path $PSScriptRoot '../..'))
$pythonExe=Join-Path $projectRoot '.venv/Scripts/python.exe'
$modelDir=Join-Path $projectRoot '.team/bert-model'
if(!(Test-Path -LiteralPath $pythonExe) -or !(Test-Path -LiteralPath (Join-Path $modelDir 'manifest.json'))){throw 'Prepare .venv and run scripts/team/download-model.ps1 first. No automatic install/download.'}
$env:NLP_MODEL_DIR=$modelDir
$env:NLP_ALLOW_SYNTHETIC_CLASSIFIER='false'
if($ExperimentalRisk){$artifact=Join-Path $projectRoot 'ai-service/models/risk-experimental/local-classifier.json';$env:NLP_ALLOW_SYNTHETIC_CLASSIFIER='true';$env:NLP_RISK_MODEL_FILE=$artifact;$env:NLP_RISK_MODEL_SHA256=(Get-FileHash -LiteralPath $artifact -Algorithm SHA256).Hash.ToLowerInvariant()}
$env:OMP_NUM_THREADS='2'
$env:OPENBLAS_NUM_THREADS='2'
Set-Location (Join-Path $projectRoot 'ai-service')
& $pythonExe -B -m uvicorn main:app --host 127.0.0.1 --port 8003 --no-access-log
exit $LASTEXITCODE
