# Explicit local-only demonstration. Does not install, download, seed or stop processes.
$ErrorActionPreference = 'Stop'
$projectRoot = [IO.Path]::GetFullPath((Join-Path $PSScriptRoot '../..'))
$modelArtifact = Join-Path $projectRoot 'contracts/node_modules/.cache/risk-training-20261107/tfidf-1000/local-classifier.json'
$runtimeDeps = Join-Path $projectRoot 'contracts/node_modules/.cache/phase4-20261031/python-deps'
$embeddingModel = Join-Path $projectRoot 'contracts/node_modules/.cache/phase4-20261031/model'
if (!(Test-Path -LiteralPath $modelArtifact) -or !(Test-Path -LiteralPath $runtimeDeps) -or !(Test-Path -LiteralPath $embeddingModel)) { throw 'Missing approved local model/runtime. Follow training documentation first.' }
$artifactHash = (Get-FileHash -LiteralPath $modelArtifact -Algorithm SHA256).Hash.ToLowerInvariant()
if ($artifactHash -ne 'a34302d9224721ea0a24915b71925b6b82470d1edf42af4ef9c2dc9113291f7e') { throw 'Unexpected classifier artifact; review a new version before enabling.' }
$pythonExe = (Get-Command python -ErrorAction Stop).Source
$env:PYTHONPATH = $runtimeDeps
$env:NLP_MODEL_DIR = $embeddingModel
$env:NLP_ALLOW_SYNTHETIC_CLASSIFIER = 'true'
$env:NLP_RISK_MODEL_FILE = $modelArtifact
$env:NLP_RISK_MODEL_SHA256 = $artifactHash
$env:OMP_NUM_THREADS = '2'
$env:OPENBLAS_NUM_THREADS = '2'
Set-Location (Join-Path $projectRoot 'ai-service')
& $pythonExe -B -m uvicorn main:app --host 127.0.0.1 --port 8003 --no-access-log
exit $LASTEXITCODE
